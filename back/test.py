from unicodedata import name
import uuid
import shutil
from typing import Annotated, Literal, Optional, List, Tuple, Union, Callable
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict
from pydantic import BaseModel
from langgraph.graph.message import AnyMessage, add_messages
from langchain_anthropic import ChatAnthropic
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from datetime import datetime
from langchain_core.tools import tool
from pydantic import BaseModel, Field
import operator
import asyncio
import pandas as pd
from scipy import stats
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph
from langgraph.prebuilt import tools_condition
from langchain_core.messages import ToolMessage
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda
from langgraph.prebuilt import ToolNode
from tools import calculate_statistics, calculate_pairwise_statistics, get_column_names

from langchain_core.tools import tool
from typing import Optional, List, Dict


def update_dialog_stack(left: list[str], right: Optional[str]) -> list[str]:
    """Push or pop the state."""
    if right is None:
        return left
    if right == "pop":
        return left[:-1]
    return left + [right]
# 计划步骤


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    input: str
    plan: List[str]
    past_steps: Annotated[List[Tuple], operator.add]
    response: str
    file_path: Optional[str] 

class Assistant:
    def __init__(self, runnable: Runnable):
        self.runnable = runnable

    def __call__(self, state: State, config: RunnableConfig):
        while True:
            result = self.runnable.invoke(state)

            if not result.tool_calls and (
                not result.content
                or isinstance(result.content, list)
                and not result.content[0].get("text")
            ):
                messages = state["messages"] + \
                    [("user", "Respond with a real output.")]
                state = {**state, "messages": messages}
            else:
                break
        return {"messages": result}

# utils


def handle_tool_error(state) -> dict:
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n please fix your mistakes.",
                tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }


def create_tool_node_with_fallback(tools: list) -> dict:
    return ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)], exception_key="error"
    )



def create_entry_node(assistant_name: str, new_dialog_state: str) -> Callable:
    def entry_node(state: State) -> dict:
        tool_call_id = state["messages"][-1].tool_calls[0]["id"]
        return {
            "messages": [
                ToolMessage(
                    content=f"The assistant is now the {assistant_name}. Reflect on the above conversation between the host assistant and the user."
                    f" The user's intent is unsatisfied. Use the provided tools to assist the user. Remember, you are {assistant_name},"
                    " and the booking, update, other other action is not complete until after you have successfully invoked the appropriate tool."
                    " If the user changes their mind or needs help for other tasks, call the CompleteOrEscalate function to let the primary host assistant take control."
                    " Do not mention who you are - just act as the proxy for the assistant.",
                    tool_call_id=tool_call_id,
                )
            ],
            "dialog_state": new_dialog_state,
        }

    return entry_node


class Plan(BaseModel):
    """Plan to follow in future"""

    steps: List[str] = Field(
        description="different steps to follow, should be in sorted order"
    )


planner_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """For the given objective, come up with a simple step by step plan. \
This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps. Conventional planning involves obtaining various statistical data of data through tools to understand the data, and then mining data insights. You can refine the steps of data analysis through domain knowledge. \
The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.""",
        ),
        ("placeholder", "{messages}"),
    ]
)
planner = planner_prompt | ChatOpenAI(
    model="gpt-4o", temperature=0
).with_structured_output(Plan)


def plan_step(state: State):
    content = state['messages'][-1].content
    plan = planner.invoke({"messages": [("user", content)]})
    return {"plan": plan.steps}





# 主agent
primary_assistant_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a specialized assistant for data analyst. "
        ),
        ("placeholder", "{messages}"),
    ]
).partial(time=datetime.now)

llm = ChatOpenAI(model="gpt-4o", temperature=0)

primary_assistant_tools = [
    TavilySearchResults(max_results=2),
    calculate_statistics,
    calculate_pairwise_statistics,
    get_column_names
]


assistant_runnable = primary_assistant_prompt | llm.bind_tools(
    primary_assistant_tools
)

# 构建图
builder = StateGraph(State)
builder.add_node("plan_step", plan_step)

builder.add_node(
    "enter_primary_assistant",
    create_entry_node("primary assistant", "primary assistant"),
)
builder.add_node("primary_assistant", Assistant(assistant_runnable))
builder.add_node("primary_assistant_tools",
                 create_tool_node_with_fallback(primary_assistant_tools))


def route_primary_assistant(
    state: State,
):
    route = tools_condition(state)
    if route == END:
        return "error_correction"
    tool_calls = state["messages"][-1].tool_calls
    if tool_calls:
        return "primary_assistant_tools"
    raise ValueError("Invalid route")


def route_to_workflow(
    state: State,
) -> Literal[
    "primary_assistant",
]:
    dialog_state = state.get("dialog_state")
    if not dialog_state:
        return "primary_assistant"
    return dialog_state[-1]



builder.add_edge(START, "plan_step")
builder.add_edge("plan_step", "primary_assistant")
builder.add_edge("enter_primary_assistant", "primary_assistant")
builder.add_conditional_edges(
    "primary_assistant",
    route_primary_assistant,
    [
        "primary_assistant_tools",
        END
    ],
)
builder.add_edge("primary_assistant_tools", "primary_assistant")


memory = MemorySaver()
graph = builder.compile(
    checkpointer=memory,
)


thread_id = str(uuid.uuid4())

config = {
    "configurable": {
        "passenger_id": "3442 587242",
        "thread_id": thread_id,
    }
}


def stream_graph_updates(user_input: str, path: str):
    state = {"messages": [("user", user_input)], "file_path": path}
    for event in graph.stream(state, config, stream_mode="values"):
        event["messages"][-1].pretty_print()
    return event["response"]


def main():
    path = input("path: ")
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["quit", "exit", "q"]:
            print("Goodbye!")
            break
        stream_graph_updates(user_input, path) 


# 启动异步事件循环
# main()
# ./uploads/k.csv   挖掘数据，分析出一些insight，视图展示
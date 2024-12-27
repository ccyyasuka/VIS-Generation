from IPython.display import Image, display
from langchain_openai import ChatOpenAI
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
from typing import Annotated
from langgraph.checkpoint.memory import MemorySaver
from langchain_community.tools.tavily_search import TavilySearchResults
import os
import openai
from langsmith import wrappers, traceable
import json
from langchain_core.messages import ToolMessage, AIMessage
# 预构建的工具
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel
openai.api_key = os.getenv("OPENAI_API_KEY")
class State(TypedDict):
    # Messages have the type "list". The `add_messages` function
    # in the annotation defines how this state key should be updated
    # (in this case, it appends messages to the list, rather than overwriting them)
    messages: Annotated[list, add_messages]
    ask_human: bool
    
    
# class BasicToolNode:
#     """A node that runs the tools requested in the last AIMessage."""
#     def __init__(self, tools: list) -> None:
#         self.tools_by_name = {tool.name: tool for tool in tools}

#     def __call__(self, inputs: dict):
#         if messages := inputs.get("messages", []):
#             message = messages[-1]
#         else:
#             raise ValueError("No message found in input")
#         outputs = []
#         for tool_call in message.tool_calls:
#             tool_result = self.tools_by_name[tool_call["name"]].invoke(
#                 tool_call["args"]
#             )
#             outputs.append(
#                 ToolMessage(
#                     content=json.dumps(tool_result),
#                     name=tool_call["name"],
#                     tool_call_id=tool_call["id"],
#                 )
#             )
#         return {"messages": outputs}

# def route_tools(
#     state: State,
# ):
#     """
#     Use in the conditional_edge to route to the ToolNode if the last message
#     has tool calls. Otherwise, route to the end.
#     分岔路决定该怎么走，返回键值
#     """
#     if isinstance(state, list):
#         ai_message = state[-1]
#     elif messages := state.get("messages", []):
#         ai_message = messages[-1]
#     else:
#         raise ValueError(f"No messages found in input state to tool_edge: {state}")
#     if hasattr(ai_message, "tool_calls") and len(ai_message.tool_calls) > 0:
#         return "tools"
#     return END
class RequestAssistance(BaseModel):
    """Escalate the conversation to an expert. Use this if you are unable to assist directly or if the user requires support beyond your permissions.

    To use this function, relay the user's 'request' so the expert can provide the right guidance.
    """

    request: str

def chatbot(state: State):
    response = llm.invoke(state["messages"])
    ask_human = False
    if (
        response.tool_calls
        and response.tool_calls[0]["name"] == RequestAssistance.__name__
    ):
        ask_human = True
    return {"messages": [response], "ask_human": ask_human}

def create_response(response: str, ai_message: AIMessage):
    return ToolMessage(
        content=response,
        tool_call_id=ai_message.tool_calls[0]["id"],
    )

def human_node(state: State):
    new_messages = []
    if not isinstance(state["messages"][-1], ToolMessage):
        # Typically, the user will have updated the state during the interrupt.
        # If they choose not to, we will include a placeholder ToolMessage to
        # let the LLM continue.
        new_messages.append(
            create_response("No response from human.", state["messages"][-1])
        )
    return {
        # Append the new messages
        "messages": new_messages,
        # Unset the flag
        "ask_human": False,
    }
def select_next_node(state: State):
    if state["ask_human"]:
        return "human"
    # Otherwise, we can route as before
    return tools_condition(state)

# 调用工具的toolNode，节点的工具函数
tool = TavilySearchResults(max_results=2)
tools = [tool]
tool_node = ToolNode(tools=[tool])
# 在这里告诉llm有哪些备选工具
llm = ChatOpenAI(model="gpt-4o", temperature=0).bind_tools(tools+ [RequestAssistance])

memory = MemorySaver()
# 构建图
graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_edge(START, "chatbot")
graph_builder.add_node("tools", tool_node)
graph_builder.add_node("human", human_node)
# graph_builder.add_conditional_edges(
#     "chatbot",
#     route_tools,
#     # The following dictionary lets you tell the graph to interpret the condition's outputs as a specific node
#     # It defaults to the identity function, but if you
#     # want to use a node named something else apart from "tools",
#     # You can update the value of the dictionary to something else
#     # e.g., "tools": "my_tools"
#     {"tools": "tools", END: END},
# )
graph_builder.add_conditional_edges(
    "chatbot",
    tools_condition,
)
graph_builder.add_conditional_edges(
    "chatbot",
    select_next_node,
    {"human": "human", "tools": "tools", END: END},
)
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge("chatbot", END)
graph = graph_builder.compile(checkpointer=memory, interrupt_before=["human"])


try:
    display(Image(graph.get_graph().draw_mermaid_png()))
except Exception:
    # This requires some extra dependencies and is optional
    pass

config = {"configurable": {"thread_id": "1"}}
def stream_graph_updates(user_input: str):
    for event in graph.stream({"messages": [("user", user_input)]}, config, stream_mode="values"):
        event["messages"][-1].pretty_print()

while True:
    user_input = input("User: ")
    if user_input.lower() in ["quit", "exit", "q"]:
        print("Goodbye!")
        break

    stream_graph_updates(user_input)
    snapshot = graph.get_state(config)
    # 打印当前状态
    print("\n当前状态：", snapshot.next)
    existing_message = snapshot.values["messages"][-1]
    print("\n函数参数：",existing_message.tool_calls) 
    if len(snapshot.next) > 0 and snapshot.next[-1] == "human":
        # 如果下一个节点是工具节点，进行用户交互
        snapshot = graph.get_state(config)
        ai_message = snapshot.values["messages"][-1]
        print("ai回答：", ai_message)
        user_input = input("User: ")
        tool_message = create_response(user_input, ai_message)
        graph.update_state(config, {"messages": [tool_message]})
        print("历史记录",graph.get_state(config).values["messages"][-3:])
        events = graph.stream(None, config, stream_mode="values")
        for event in events:
          if "messages" in event:
              event["messages"][-1].pretty_print()
    
    
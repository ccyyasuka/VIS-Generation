from langchain_core.messages import BaseMessage
from typing import List, Optional, Literal, TypedDict
from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.types import Command
from langchain_core.messages import HumanMessage, trim_messages, AIMessage
from langchain_openai import ChatOpenAI
import uuid
from langgraph.prebuilt import create_react_agent
from langgraph.graph.message import AnyMessage, add_messages
from tools import calculate_statistics, calculate_pairwise_statistics, get_column_names, show_dataframe_head, tavily_tool
from tools import remove_nans, extract_columns, groupby_column, filter_dataframe, rename_columns, sort_by_column
from prompts import planner_prompt_raw, replanner_prompt_raw, error_corrector_prompt_raw, primary_assistant_prompt_raw, data_constructor_prompt_raw, data_transform_prompt_raw, teams_supervisor_raw, task_extension_raw, data_analyze_supervisor_raw, graph_grammar_introduction, diagram_writing_supervisor_raw
from typing import Annotated, Literal, Optional, List, Tuple, Union, Callable, Any
import pandas as pd
from pydantic import BaseModel, Field, validator
from langchain_core.prompts import ChatPromptTemplate


def filter_dict(original_dict, *keys):
    # 确保"dataframe_brief"和"middledataframe_brief"始终包含在结果中
    mandatory_keys = ["dataframe_brief", "middle_dataframe_brief", "messages"]
    # 生成新的字典：首先加入必须包含的键，然后根据情况添加其他指定的键
    result = {key: original_dict[key]
              for key in mandatory_keys if key in original_dict}
    # 添加用户指定的键，忽略不存在的键
    for key in keys:
        if key in original_dict:
            result[key] = original_dict[key]
    return result


class ChartMeta(BaseModel):
    """图表元数据布局配置"""
    width: str = Field(..., description="图表宽度占主界面的百分比，如'80%'")
    height: str = Field(..., description="图表高度占主界面的百分比，如'60%'")
    left: str = Field(..., description="图表左上角相对左边界的定位，使用CSS百分比定位，如'10%'")
    top: str = Field(..., description="图表左上角相对上边界的定位，使用CSS百分比定位，如'5%'")


class Graph_Result(BaseModel):
    """可视化图表配置规范"""
    name: Literal["line", "bar", "scatter", "pie",
                  "area"] = Field(..., description="图表类型")
    meta: ChartMeta = Field(..., description="图表布局元数据")
    x: str = Field(..., description="X轴对应数据列")
    y: str = Field(..., description="Y轴对应数据列")
    z: Optional[str] = Field(None, description="Z轴数据列（仅散点图可用）")
    interactionType: Optional[str] = Field(
        None, description="交互信号ID，如filter_01")
    interactionKey: Optional[str] = Field(
        None, description="交互信号对应的数据列，必须存在于x/y中")
    allowedInteractionType: Optional[str] = Field(
        None, description="可接受的交互信号ID")

    groupBy: Optional[Literal["category"]] = Field(
        "category", description="分组依据")

    @validator("z")
    def validate_z(cls, v, values):
        if v and values["name"] != "scatter":
            raise ValueError("z轴仅适用于散点图")
        return v

    @validator("interactionKey")
    def validate_interaction_key(cls, v, values):
        if v and v not in [values.get("x"), values.get("y")]:
            raise ValueError("interactionKey必须存在于x或y轴中")
        return v


class State(MessagesState):
    next: str
    messages: Annotated[list[AnyMessage], add_messages]
    input: str
    plan: str
    # past_steps: Annotated[List[Tuple], operator.add]
    response: str
    file_path: Optional[str]
    user_question: str
    dataframe: str
    dataframe_brief: str
    middle_dataframe: str
    middle_dataframe_brief: str
    graph_grammar_introduction: str
    remaining_steps: float
    structured_response: Any
    cur_graph_grammar: str
    inidata_insight: str
    graph_result: Graph_Result


thread_id = str(uuid.uuid4())

config = {
    "configurable": {
        # The passenger_id is used in our flight tools to
        # fetch the user's flight information
        "passenger_id": "3442 587242",
        # Checkpoints are accessed by thread_id
        "thread_id": thread_id,
    }
}


def make_supervisor_node(llm: BaseChatModel, members: list[str], system_prompt: str | None = None) -> str:
    options = ["FINISH"] + members
    # if (not system_prompt):
    #     system_prompt = (
    #         "You are a supervisor tasked with managing a conversation between the"
    #         f" following workers: {members}. Given the following user request,"
    #         " respond with the worker to act next. Each worker will perform a"
    #         " task and respond with their results and status. When finished,"
    #         " respond with FINISH."
    #     )

    class Router(TypedDict):
        """Worker to route to next. If no workers needed, route to FINISH."""

        next: Literal[*options]

    def supervisor_node(state: State) -> Command[Literal[*members, "__end__"]]:
        """An LLM-based router."""
        a = system_prompt.format(
            user_question=state.get("user_question", ""),
            dataframe_brief=state.get("dataframe_brief", ""),
            middle_dataframe_brief=state.get("middle_dataframe_brief", ""),
            cur_graph_grammar=state.get("cur_graph_grammar", "")
        )
        dataframe_brief = state["dataframe_brief"]
        messages = [
            {"role": "system", "content": a},
        ] + state["messages"]
        response = llm.with_structured_output(Router).invoke(messages)
        goto = response["next"]
        if goto == "FINISH":
            goto = END

        return Command(goto=goto, update={"next": goto})

    return supervisor_node


##########################################################################################
# data_analysize Team
class Task_extension(BaseModel):
    """Plan to follow in future"""
    user_question: str = Field(
        description="Clear instructions obtained by expanding the user's vague commands."
    )


llm = ChatOpenAI(model="gpt-4o", temperature=0)
task_extension_raw = ChatPromptTemplate.from_messages(
    [
        ("system", task_extension_raw),
        ("placeholder", "{messages}"),
    ]
)
task_extension_agent = create_react_agent(llm,
                                          tools=[tavily_tool],
                                          state_schema=State,
                                          prompt=task_extension_raw,
                                          response_format=Task_extension)


def task_extension_node(state: State) -> Command[Literal["supervisor"]]:
    # dataframe_brief = state["dataframe_brief"]
    result = task_extension_agent.invoke(filter_dict(state))
    a = result['structured_response'].user_question
    return Command(
        update={
            "messages": [
                AIMessage(content=result["messages"]
                          [-1].content, name="task_extension")
            ],
            "user_question": result['structured_response'].user_question
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


class Plan(BaseModel):
    """Plan to follow in future"""
    steps: List[str] = Field(
        description="different steps to follow, should be in sorted order"
    )


llm = ChatOpenAI(model="gpt-4o", temperature=0)
planner_prompt_raw = ChatPromptTemplate.from_messages(
    [
        ("system", planner_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
planner_agent = create_react_agent(llm,
                                   tools=[tavily_tool],
                                   state_schema=State,
                                   prompt=planner_prompt_raw,
                                   response_format=Plan)


def planner_node(state: State) -> Command[Literal["supervisor"]]:
    result = planner_agent.invoke(filter_dict(state, "user_question"))
    return Command(
        update={
            "messages": [
                AIMessage(content=result["messages"]
                          [-1].content, name="planner")
            ],
            "plan": ' '.join(map(lambda x: f"{x[0]+1}.{x[1]};", enumerate(result['structured_response'].steps)))
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


llm = ChatOpenAI(model="gpt-4o", temperature=0)
data_transform_prompt_raw1 = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
data_transform_agent = create_react_agent(
    llm,
    tools=[remove_nans, extract_columns, groupby_column,
           filter_dataframe, rename_columns, sort_by_column],
    state_schema=State,
    prompt=(data_transform_prompt_raw1),
)


def data_transform_node1(state: State) -> Command[Literal["supervisor"]]:
    result = data_transform_agent.invoke(filter_dict(
        state, "plan", "question", "graph_grammar_introduction"))
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="data_transform1")
            ]
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


llm = ChatOpenAI(model="gpt-4o", temperature=0)
search_agent = create_react_agent(llm, tools=[tavily_tool], state_schema=State)


def search_node(state: State) -> Command[Literal["supervisor"]]:
    result = search_agent.invoke(state)
    return Command(
        update={
            "messages": [
                AIMessage(content=result["messages"]
                          [-1].content, name="search")
            ]
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


llm = ChatOpenAI(model="gpt-4o", temperature=0)
data_constructor_prompt_raw = ChatPromptTemplate.from_messages(
    [
        ("system", data_constructor_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
df_static_agent = create_react_agent(llm,
                                     tools=[calculate_statistics, calculate_pairwise_statistics,
                                            get_column_names, show_dataframe_head],
                                     state_schema=State,
                                     prompt=(
                                         data_constructor_prompt_raw
                                     ),)


def df_static_node(state: State) -> Command[Literal["supervisor"]]:
    result = df_static_agent.invoke(state)
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="df_static")
            ]
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


data_analysize_supervisor_node = make_supervisor_node(
    llm, ["data_transform", "task_extension", "planner", "search", "df_static"], system_prompt=data_analyze_supervisor_raw)


# build
data_analysize_builder = StateGraph(State)
data_analysize_builder.add_node("supervisor", data_analysize_supervisor_node)
data_analysize_builder.add_node("data_transform", data_transform_node1)
data_analysize_builder.add_node("task_extension", task_extension_node)
data_analysize_builder.add_node("planner", planner_node)
data_analysize_builder.add_node("df_static", df_static_node)
data_analysize_builder.add_node("search", search_node)
data_analysize_builder.add_edge(START, "supervisor")
data_analysize_graph = data_analysize_builder.compile()

##########################################################################################
# graph drawing Team


class data_transform_response(BaseModel):
    middle_dataframe: str = Field()
    middle_dataframe_brief: str = Field()


    # messages: str = Field()
llm = ChatOpenAI(model="gpt-4o", temperature=0)
data_transform_prompt_raw = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
data_transform_agent = create_react_agent(
    llm,
    tools=[remove_nans, extract_columns, groupby_column,
           filter_dataframe, rename_columns, sort_by_column],
    state_schema=State,
    prompt=(data_transform_prompt_raw),
    response_format=data_transform_response
)


def data_transform_node(state: State) -> Command[Literal["supervisor"]]:
    result = data_transform_agent.invoke(state)
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="data_transform")
            ],
            "middle_dataframe": result['structured_response'].middle_dataframe,
            "middle_dataframe_brief": result['structured_response'].middle_dataframe_brief
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


llm = ChatOpenAI(model="gpt-4o", temperature=0)


class Graph_Grammar_response(BaseModel):
    """Plan to follow in future"""
    cur_graph_grammar: str = Field(
        description="current diagram grammar"
    )


primary_assistant_prompt_raw = ChatPromptTemplate.from_messages(
    [
        ("system", primary_assistant_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
graph_grammar_agent = create_react_agent(
    llm,
    tools=[],
    state_schema=State,
    prompt=primary_assistant_prompt_raw,
    response_format=Graph_Grammar_response
)


def graph_grammar_node(state: State) -> Command[Literal["supervisor"]]:
    result = graph_grammar_agent.invoke(state)
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="graph_grammar")
            ],
            "cur_graph_grammar": result['structured_response'].cur_graph_grammar
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


diagram_writing_supervisor_node = make_supervisor_node(
    llm, ["data_transform", "graph_grammar"], diagram_writing_supervisor_raw
)
diagram_writing_builder = StateGraph(State)
diagram_writing_builder.add_node("supervisor", diagram_writing_supervisor_node)
diagram_writing_builder.add_node("data_transform", data_transform_node)
diagram_writing_builder.add_node("graph_grammar", graph_grammar_node)

diagram_writing_builder.add_edge(START, "supervisor")
diagram_writing_graph = diagram_writing_builder.compile()

################################################################################
# teams_supervisor

llm = ChatOpenAI(model="gpt-4o")

teams_supervisor_node = make_supervisor_node(
    llm, ["data_analysize_team", "diagram_writing_team", "error_corrector"],
    teams_supervisor_raw)


def call_data_analysize_team(state: State) -> Command[Literal["supervisor"]]:
    response = data_analysize_graph.invoke(state)
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=response["messages"][-1].content, name="data_analysize_team"
                )
            ]
        },
        goto="supervisor",
    )


def call_diagram_writing_team(state: State) -> Command[Literal["supervisor"]]:
    response = diagram_writing_graph.invoke(state)
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=response["messages"][-1].content, name="diagram_writing_team"
                )
            ]
        },
        goto="supervisor",
    )


class Graph_Result_Wrapper(BaseModel):
    graph_result: Graph_Result


error_corrector_agent = create_react_agent(
    llm,
    tools=[],
    state_schema=State,
    prompt=(
        error_corrector_prompt_raw
    ),
    response_format=Graph_Result
)


def call_error_corrector_node(state: State) -> Command[Literal["supervisor"]]:
    result = error_corrector_agent.invoke(state)
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=result["messages"][-1].content, name="error_corrector"
                )
            ],
            "graph_result": result['structured_response'].graph_result
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


# Define the graph.
super_builder = StateGraph(State)
super_builder.add_node("supervisor", teams_supervisor_node)
super_builder.add_node("data_analysize_team", call_data_analysize_team)
super_builder.add_node("diagram_writing_team", call_diagram_writing_team)
super_builder.add_node("error_corrector", call_error_corrector_node)

super_builder.add_edge(START, "supervisor")

super_graph = super_builder.compile()


def stream_graph_updates(user_input: str, path: str):
    state = {"messages": [("user", user_input)], "file_path": path}
    df = None
    if path.endswith(".xlsx") or path.endswith(".xls"):
        # 读取Excel文件
        df = pd.read_excel(path)
    elif path.endswith(".csv"):
        # 读取CSV文件
        df = pd.read_csv(path)
    else:
        raise ValueError(
            "Unsupported file format. Please provide an Excel (.xlsx/.xls) or CSV (.csv) file.")
    df_brief = df.head(10)
    state["dataframe"] = df.to_json(orient='records')
    state["middle_dataframe"] = df.to_json(orient='records')
    state["dataframe_brief"] = df_brief.to_json(orient='records')
    state["middle_dataframe_brief"] = df_brief.to_json(orient='records')
    state["graph_grammar_introduction"] = graph_grammar_introduction
    state["user_question"] = ""
    state["cur_graph_grammar"] = "None"
    state["plan"] = ""
    state["graph_result"] = "None"
    for s in super_graph.stream(
        state,
        {"recursion_limit": 150},
        stream_mode="values",
    ):
        print(s["messages"][-1])
        print("----------------------------------------")

    print("responseresponseresponseresponseresponseresponseresponseresponseresponseresponse")
    print(s['middle_dataframe_brief'])
    print(s['graph_result'])
    # print(event['error_correction']["response"])
    # cleaned_json = re.sub(r'[\x00-\x1f]', '',
    #                       event['error_correction']["response"])
    # print("******************************************")
    # print(cleaned_json)
    # result = json.loads(cleaned_json)
    # result["analyze_data"] = state["middle_dataframe"]
    # json_str = json.dumps(result, ensure_ascii=False, indent=4)
    return None


def main():
    path = "./uploads/nba.csv"
    # user_input = "我上传了文件，请你首先先自行描述一下数据，挖掘一些潜在的insight"
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["quit", "exit", "q"]:
            print("Goodbye!")
            break
        stream_graph_updates(user_input, path)


main()
# 我提供给你的数据是什么
# 我上传了文件，请你首先先自行描述一下数据，挖掘一些潜在的insight
# 我想看看25岁以下球员命中率与三分球命中率的关系

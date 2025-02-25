from pickle import FALSE
from langchain_core.messages import BaseMessage
from typing import List, Optional, Literal, TypedDict
from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.types import Command
from langchain_core.messages import HumanMessage, trim_messages, AIMessage
from langchain_openai import ChatOpenAI
from langchain_community.llms import Tongyi
import uuid
import json
import pickle
from langgraph.prebuilt import create_react_agent
from langgraph.graph.message import AnyMessage, add_messages
from tools import calculate_statistics, calculate_pairwise_statistics, get_column_names, show_dataframe_head, tavily_tool
from tools import remove_nans, extract_columns, groupby_column, filter_dataframe, rename_columns
from prompts_english import planner_prompt_raw, error_corrector_prompt_raw, primary_assistant_prompt_raw, data_constructor_prompt_raw, data_transform_prompt_raw, teams_supervisor_raw, task_extension_raw, data_analyze_supervisor_raw, graph_grammar_introduction, diagram_writing_supervisor_raw, data_transform_extract_raw, data_transform_filter_raw, data_transform_groupby_raw, graph_filter_prompt_raw, graph_layout_prompt_raw
from typing import Annotated, Literal, Optional, List, Tuple, Union, Callable, Any
import pandas as pd
from pydantic import BaseModel, Field, validator
from langchain_core.prompts import ChatPromptTemplate
import os
CACHE = "./cache/cache.json"
CACHEBRIEF = "./cache/cache_brief.json"
CACHESTATE = "./cache/state.pkl"
ALI_API_KEY = os.environ["OPENAI_API_KEY"]
MODEL = "gpt-4o"
MODEL_SMALL = "gpt-4o-mini"
URL = "https://api.deepseek.com"
is_data_transformed = "NO"
has_error = False
has_layout = False
print("****************************************************")
print(ALI_API_KEY)
llm = ChatOpenAI(
    model_name=MODEL,  # 使用 qwen-max 模型
    temperature=0,  # 控制生成文本的随机性
    api_key=ALI_API_KEY,  # 阿里云 API Key
    # base_url=URL,
)
llm_small = ChatOpenAI(
    model_name=MODEL_SMALL,  # 使用 qwen-max 模型
    temperature=0,  # 控制生成文本的随机性
    api_key=ALI_API_KEY,  # 阿里云 API Key
    # base_url=URL,
)
# llm = ChatOpenAI(model=MODEL, temperature=0)


# def filter_dict(original_dict, *keys):
#     # 确保"dataframe_brief"和"middledataframe_brief"始终包含在结果中
#     mandatory_keys = ["dataframe_brief", "middle_dataframe_brief", "messages"]
#     # 生成新的字典：首先加入必须包含的键，然后根据情况添加其他指定的键
#     result = {key: original_dict[key]
#               for key in mandatory_keys if key in original_dict}
#     # 添加用户指定的键，忽略不存在的键
#     for key in keys:
#         if key in original_dict:
#             result[key] = original_dict[key]
#     return result
def filter_dict(original_dict):
    # 定义不需要包含在结果中的键
    excluded_keys = ["dataframe", "middle_dataframe"]
    # 生成新的字典：排除特定的键，然后根据情况添加其他指定的键
    result = {key: value for key, value in original_dict.items()
              if key not in excluded_keys}
    # 如果有额外的键被指定，则确保这些键对应的值也被包含（即使它们在excluded_keys中）

    return result

# class data_transform_response(BaseModel):
#     middle_dataframe: str = Field()
#     middle_dataframe_brief: str = Field()


class ChartMeta(BaseModel):
    """图表元数据布局配置"""
    width: str = Field(..., description="图表宽度占主界面的百分比，如'80%'")
    height: str = Field(..., description="图表高度占主界面的百分比，如'60%'")
    left: str = Field(..., description="图表左上角相对左边界的定位，使用CSS百分比定位，如'10%'")
    top: str = Field(..., description="图表左上角相对上边界的定位，使用CSS百分比定位，如'5%'")


class Graph_Result(BaseModel):
    """可视化图表配置规范"""
    name: str = Field(..., description="图表类型")
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

    # @validator("z")
    # def validate_z(cls, v, values):
    #     if v and values["name"] != "scatter":
    #         raise ValueError("z轴仅适用于散点图")
    #     return v

    # @validator("interactionKey")
    # def validate_interaction_key(cls, v, values):
    #     if v and v not in [values.get("x"), values.get("y")]:
    #         raise ValueError("interactionKey必须存在于x或y轴中")
    #     return v


class State(MessagesState):
    next: str
    messages: Annotated[list[AnyMessage], add_messages]
    input: str
    cur_plan: str
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
    reserve_charts: List[str]
    cur_insight: str
    graph_layout: str
    path: List[str]
    graph_result: List[Graph_Result]


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


def make_supervisor_node(llm: BaseChatModel,
                         members: list[str],
                         system_prompt: str | None = None,
                         name="no") -> str:
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

    def supervisor_node(state1: State) -> Command[Literal[*members, "__end__"]]:
        global has_error
        global has_layout
        """An LLM-based router."""
        with open(CACHEBRIEF, "r") as file:
            data = json.load(file)
            middle_dataframe_brief = pd.DataFrame(data).to_string()

        with open(CACHESTATE, 'rb') as f:
            state = pickle.load(f)

        a = system_prompt.format(
            user_question=state.get("user_question", ""),
            dataframe_brief=state.get("dataframe_brief", ""),
            middle_dataframe_brief=middle_dataframe_brief,
            cur_graph_grammar=state.get("cur_graph_grammar", ""),
            cur_plan=state.get("cur_plan", ""),
            is_data_transformed=is_data_transformed,
            path=state.get("path", ""),
        )

        messages = [
            {"role": "system", "content": a},
        ] + state["messages"]
        response = llm.with_structured_output(Router).invoke(messages)
        goto = response["next"]

        if not has_error and goto == "FINISH" and name == "teams":
            goto = "error_corrector"
            has_error = True
        elif not has_layout and goto == "FINISH" and name == "teams":
            goto = "layout_team"
            has_layout = True
        elif goto == "FINISH":
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


# llm = ChatOpenAI(model=MODEL, temperature=0)
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
                                          response_format=Task_extension
                                          )


def task_extension_node(state1: State) -> Command[Literal["supervisor"]]:
    # dataframe_brief = state["dataframe_brief"]
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入任务扩展")
    with open(CACHESTATE, 'rb') as f:
        state = pickle.load(f)
    result = task_extension_agent.invoke(filter_dict(state))
    a = result['structured_response'].user_question
    state["user_question"] = result['structured_response'].user_question
    state["path"].append("task_extension")
    state["messages"].append(AIMessage(content=result["messages"]
                                       [-1].content, name="task_extension"))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state, f)
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


class Reserve_charts(BaseModel):
    """Plan to follow in future"""
    reserve_charts: List[str] = Field(
        description="reserved charts for dashboard"
    )


graph_filter_prompt_raw = ChatPromptTemplate.from_messages(
    [
        ("system", graph_filter_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
graph_filter_agent = create_react_agent(llm,
                                        tools=[],
                                        state_schema=State,
                                        prompt=graph_filter_prompt_raw,
                                        response_format=Reserve_charts
                                        )


def graph_filter_node(state1: State) -> Command[Literal["supervisor"]]:
    # dataframe_brief = state["dataframe_brief"]
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入图表过滤")
    with open(CACHESTATE, 'rb') as f:
        state = pickle.load(f)
    result = graph_filter_agent.invoke(state)
    # state["reserve_charts"] = result['structured_response'].reserve_charts
    state["path"].append("graph_filter")
    state["messages"].append(AIMessage(content=result["messages"]
                                       [-1].content, name="graph_filter"))

    reserve_charts_ids = result['structured_response'].reserve_charts

    old_reserve_charts = state["reserve_charts"]
    print("原始视图ids", old_reserve_charts)
    if len(old_reserve_charts) != 0:
        filtered_reserve_charts = [
            item for item in old_reserve_charts if item['id'] in reserve_charts_ids]
        print("新视图ids", filtered_reserve_charts)
        state["reserve_charts"] = filtered_reserve_charts
    else:
        state["reserve_charts"] = []
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state, f)
    return Command(
        update={
            "messages": [
                AIMessage(content=result["messages"]
                          [-1].content, name="graph_filter")
            ],
            "reserve_charts": result['structured_response'].reserve_charts
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


class Plan(BaseModel):
    """Plan to follow in future"""
    steps: List[str] = Field(
        description="different steps to follow, should be in sorted order"
    )


# llm = ChatOpenAI(model=MODEL, temperature=0)
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


def planner_node(state1: State) -> Command[Literal["supervisor"]]:
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入任务计划")

    with open(CACHESTATE, 'rb') as f:
        state = pickle.load(f)
    result = planner_agent.invoke(filter_dict(state))
    state["cur_plan"] = ' '.join(map(
        lambda x: f"{x[0]+1}.{x[1]};", enumerate(result['structured_response'].steps)))
    state["path"].append("planner")
    state["messages"].append(AIMessage(content=result["messages"]
                                       [-1].content, name="planner"))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state, f)
    return Command(
        update={
            "messages": [
                AIMessage(content=result["messages"]
                          [-1].content, name="planner")
            ],
            "cur_plan": ' '.join(map(lambda x: f"{x[0]+1}.{x[1]};", enumerate(result['structured_response'].steps)))
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


# llm = ChatOpenAI(model=MODEL, temperature=0)
data_transform_prompt_raw_extract = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_extract_raw),
        ("placeholder", "{messages}"),
    ]
)


# [extract_columns, groupby_column, filter_dataframe, rename_columns]
data_transform_agent_extract = create_react_agent(
    llm,
    tools=[extract_columns],
    state_schema=State,
    prompt=(data_transform_prompt_raw_extract)
)


def data_transform_node_extract(state: State) -> Command[Literal["supervisor"]]:
    global is_data_transformed
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state["middle_dataframe_brief"] = middle_dataframe
    state["path"].append("data_transform1")
    result = data_transform_agent_extract.invoke(state)
    is_data_transformed = "YES"
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


data_transform_prompt_raw_groupby = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_groupby_raw),
        ("placeholder", "{messages}"),
    ]
)
data_transform_agent_groupby = create_react_agent(
    llm,
    tools=[groupby_column],
    state_schema=State,
    prompt=(data_transform_prompt_raw_groupby)
)


def data_transform_node_groupby(state: State) -> Command[Literal["supervisor"]]:
    global is_data_transformed
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state["middle_dataframe_brief"] = middle_dataframe
    result = data_transform_agent_groupby.invoke(state)
    is_data_transformed = "YES"
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


data_transform_prompt_raw_filter = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_filter_raw),
        ("placeholder", "{messages}"),
    ]
)
data_transform_agent_filter = create_react_agent(
    llm,
    tools=[filter_dataframe],
    state_schema=State,
    prompt=(data_transform_prompt_raw_filter)
)


def data_transform_node_filter(state: State) -> Command[Literal["supervisor"]]:
    global is_data_transformed
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state["middle_dataframe_brief"] = middle_dataframe
    result = data_transform_agent_filter.invoke(state)
    is_data_transformed = "YES"
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


llm_no_parallel = llm.bind_tools([extract_columns,
                                  filter_dataframe], parallel_tool_calls=False)
data_transform_prompt_raw1 = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
data_transform_agent = create_react_agent(
    llm_no_parallel,
    tools=[extract_columns,
           filter_dataframe],
    state_schema=State,
    prompt=(data_transform_prompt_raw1)
)


def data_transform_node(state1: State) -> Command[Literal["supervisor"]]:
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入第一数据转换")
    global is_data_transformed
    with open(CACHESTATE, 'rb') as f:
        state = pickle.load(f)
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state["middle_dataframe_brief"] = middle_dataframe
    state["path"].append("data_transform1")
    result = data_transform_agent.invoke(state)
    is_data_transformed = "YES"
    state["messages"].append(AIMessage(content=result["messages"]
                                       [-1].content, name="data_transform"))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state, f)
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="data_transform")
            ],
        },

        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


# llm = ChatOpenAI(model=MODEL, temperature=0)
search_agent = create_react_agent(llm, tools=[tavily_tool], state_schema=State)


def search_node(state: State) -> Command[Literal["supervisor"]]:
    result = search_agent.invoke(filter_dict(state))
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


# llm = ChatOpenAI(model=MODEL, temperature=0)
class df_static_response(BaseModel):
    """Plan to follow in future"""
    cur_insight: str = Field(
        description="current data insight"
    )


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
                                     ),
                                     response_format=df_static_response)


def df_static_node(state1: State) -> Command[Literal["supervisor"]]:
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入数据统计")
    with open(CACHESTATE, 'rb') as f:
        state = pickle.load(f)
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state["path"].append("df_static")
    state["middle_dataframe_brief"] = middle_dataframe
    result = df_static_agent.invoke(state)
    state["cur_insight"] += result['structured_response'].cur_insight
    state["messages"].append(AIMessage(content=result["messages"]
                                       [-1].content, name="df_static"))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state, f)
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="df_static")
            ],
            "cur_insight": result['structured_response'].cur_insight
        },
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


data_analysize_supervisor_node = make_supervisor_node(
    llm, ["data_transform1", "graph_filter", "task_extension", "planner", "search", "df_static"], system_prompt=data_analyze_supervisor_raw)

# build
data_analysize_builder = StateGraph(State)
data_analysize_builder.add_node("supervisor", data_analysize_supervisor_node)
# data_analysize_builder.add_node(
#     "data_transform_extract", data_transform_node_extract)
# data_analysize_builder.add_node(
#     "data_transform_groupby", data_transform_node_groupby)
# data_analysize_builder.add_node(
#     "data_transform_filter", data_transform_node_filter)
data_analysize_builder.add_node("data_transform1", data_transform_node)
data_analysize_builder.add_node("graph_filter", graph_filter_node)
data_analysize_builder.add_node("task_extension", task_extension_node)
data_analysize_builder.add_node("planner", planner_node)
data_analysize_builder.add_node("df_static", df_static_node)
data_analysize_builder.add_node("search", search_node)
data_analysize_builder.add_edge(START, "supervisor")
data_analysize_graph = data_analysize_builder.compile()

##########################################################################################
# graph drawing Team

# messages: str = Field()
# llm = ChatOpenAI(model=MODEL, temperature=0)
data_transform_prompt_raw = ChatPromptTemplate.from_messages(
    [
        ("system", data_transform_prompt_raw),
        ("placeholder", "{messages}"),
    ]
)
data_transform_agent = create_react_agent(
    llm_no_parallel,
    tools=[extract_columns,
           filter_dataframe],
    state_schema=State,
    prompt=(data_transform_prompt_raw)
)


def data_transform_node(state: State) -> Command[Literal["supervisor"]]:
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入第二数据转换")
    global is_data_transformed
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state1["path"].append("data_transform")
    state1["middle_dataframe_brief"] = middle_dataframe
    result = data_transform_agent.invoke(state1)
    is_data_transformed = "YES"
    state1["messages"].append(AIMessage(content=result["messages"]
                                        [-1].content, name="data_transform"))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state1, f)
    return Command(
        update={
            "messages": [
                HumanMessage(content=result["messages"]
                             [-1].content, name="data_transform")
            ],
        },

        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


# llm = ChatOpenAI(model=MODEL, temperature=0)


class Graph_Grammar_response(BaseModel):
    """Plan to follow in future"""
    cur_graph_grammar: Any = Field(
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
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入语法生成")
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    state1["path"].append("graph_grammar")
    state1["middle_dataframe_brief"] = middle_dataframe
    result = graph_grammar_agent.invoke(state1)
    state1["cur_graph_grammar"] = result['structured_response'].cur_graph_grammar
    state1["messages"].append(AIMessage(content=result["messages"]
                                        [-1].content, name="graph_grammar"))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state1, f)
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

# llm = ChatOpenAI(model=MODEL)

teams_supervisor_node = make_supervisor_node(
    llm, ["data_analysize_team", "diagram_writing_team", "error_corrector"],
    teams_supervisor_raw, name="teams")


def call_data_analysize_team(state: State) -> Command[Literal["supervisor"]]:
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    state1["middle_dataframe_brief"] = middle_dataframe
    response = data_analysize_graph.invoke(state1)
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    state1["messages"].append(HumanMessage(
        content=response["messages"][-1].content, name="data_analysize_team"
    ))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state1, f)
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
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_string()
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    state1["middle_dataframe_brief"] = middle_dataframe
    response = diagram_writing_graph.invoke(state1)
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    state1["messages"].append(HumanMessage(
        content=response["messages"][-1].content, name="diagram_writing_team"
    ))
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state1, f)
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


# class Graph_Result_Wrapper(BaseModel):
#     reply:str
#     graphs_grammar: List[Graph_Result]
#     recommendation:List[str]
class Graph_Result_Wrapper(BaseModel):
    reply: str
    graphs_grammar: List
    recommendation: List[str]


error_corrector_agent = create_react_agent(
    llm,
    tools=[],
    state_schema=State,
    prompt=(
        error_corrector_prompt_raw
    ),
    response_format=Graph_Result_Wrapper
)


def call_error_corrector_node(state: State) -> Command[Literal["supervisor"]]:
    global has_error
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入纠错")
    has_error = True
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    result = error_corrector_agent.invoke(filter_dict(state1))
    state1["graph_result"] = {"reply": result['structured_response'].reply,
                              "graphs_grammar": result['structured_response'].graphs_grammar,
                              "recommendation": result['structured_response'].recommendation}

    state1["messages"].append(AIMessage(
        content=result["messages"][-1].content, name="error_corrector"
    ))
    state1["path"].append("error_corrector")
    graphs_plus_id = state1["graph_result"]
    # graphs_plus_id = json.loads(graphs_plus_id_str)
    for item in graphs_plus_id["graphs_grammar"]:
        if isinstance(item, dict):  # 确保当前项是字典
            item['id'] = str(uuid.uuid4().hex)[:13]
    state1["graph_result"] = json.dumps(graphs_plus_id)

    result = [{"id": item["id"], "description": item["description"]}
              for item in graphs_plus_id["graphs_grammar"] if isinstance(item, dict) and "id" in item and "description" in item]
    reserve_charts = state["reserve_charts"]+result
    state1["reserve_charts"] = reserve_charts
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state1, f)
    return Command(
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


class Layout_Result(BaseModel):
    id: str
    description: str
    meta: ChartMeta


class Layout_Result_Wrapper(BaseModel):
    graph_layout: List[Layout_Result]


layout_agent = create_react_agent(
    llm,
    tools=[],
    state_schema=State,
    prompt=(
        graph_layout_prompt_raw
    ),
    response_format=Layout_Result_Wrapper
)


def call_layout_node(state: State) -> Command[Literal["supervisor"]]:
    global has_layout
    print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
    print("进入layout")
    has_layout = True
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    result = layout_agent.invoke(filter_dict(state1))
    graph_layout_str = result['structured_response'].graph_layout
    state1["path"].append("layout_team")
    state1['graph_layout'] = graph_layout_str
    state1["messages"].append(AIMessage(
        content=result["messages"][-1].content, name="layout_team"
    ))

    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state1, f)
    return Command(
        # We want our workers to ALWAYS "report back" to the supervisor when done
        goto="supervisor",
    )


# Define the graph.
super_builder = StateGraph(State)
super_builder.add_node("supervisor", teams_supervisor_node)
super_builder.add_node("data_analysize_team", call_data_analysize_team)
super_builder.add_node("diagram_writing_team", call_diagram_writing_team)
super_builder.add_node("error_corrector", call_error_corrector_node)
super_builder.add_node("layout_team", call_layout_node)
super_builder.add_edge(START, "supervisor")

super_graph = super_builder.compile()


def stream_graph_updates(user_input: str, path: str, cur_graphs):
    global has_error
    global has_layout
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
    if df is not None:
        # 将整个df转换为字符串格式并写入到"./cache/cache.txt"文件中
        df.to_json(CACHE, orient='records', indent=4)  # 'orient' 参数可以根据需要调整

        # 将df的前3行转换为JSON格式并写入到CACHEBRIEF文件中
        df.head(3).to_json(CACHEBRIEF, orient='records',
                            indent=4)  # 'orient' 参数可以根据需要调整
    else:
        print("未能加载数据，请检查文件路径是否正确。")
    df_brief = df.head(3)
    state["dataframe"] = df.to_json(orient='records')
    state["middle_dataframe"] = df.to_json(orient='records')
    state["dataframe_brief"] = df_brief.to_json(orient='records')
    state["middle_dataframe_brief"] = df_brief.to_json(orient='records')
    state["graph_grammar_introduction"] = graph_grammar_introduction
    state["user_question"] = "None"
    state["cur_graph_grammar"] = "None"
    state["cur_plan"] = "None"
    state["graph_result"] = "None"
    state["already_graphs"] = "None"
    state["cur_insight"] = "None"
    state["graph_layout"] = "None"
    state["path"] = []

    cur_graphs = json.loads(cur_graphs)
    # 提取所有的id并保存到列表中
    reserve_charts = [
        {"id": item['id'], "description":item['description']} for item in cur_graphs]
    state["reserve_charts"] = reserve_charts
    with open(CACHESTATE, 'wb') as f:
        pickle.dump(state, f)

    for s in super_graph.stream(
        state,
        {"recursion_limit": 150},
        stream_mode="values",
    ):
        print(s["messages"][-1])
        print("----------------------------------------")

    print("responseresponseresponseresponseresponseresponseresponseresponseresponseresponse")
    has_error = FALSE
    has_layout = FALSE
    with open(CACHE, "r") as file:
        data = json.load(file)
        middle_dataframe = pd.DataFrame(data).to_json(
            orient='records', force_ascii=False)
    with open(CACHEBRIEF, "r") as file:
        data = json.load(file)
        middle_dataframe_biref = pd.DataFrame(data).to_json(
            orient='records', force_ascii=False)
    with open(CACHESTATE, 'rb') as f:
        state1 = pickle.load(f)
    print(middle_dataframe_biref)
    print(state1['graph_result'])
    graph_id = str(uuid.uuid4())[:13]
    print(graph_id)
    print(state1["reserve_charts"])

    # print(event['error_correction']["response"])
    # cleaned_json = re.sub(r'[\x00-\x1f]', '',
    #                       event['error_correction']["response"])
    # print("******************************************")
    # print(cleaned_json)
    # result = json.loads(cleaned_json)
    # result["analyze_data"] = state["middle_dataframe"]
    # json_str = json.dumps(result, ensure_ascii=False, indent=4)
    graph_result = json.loads(state1['graph_result'])
    result = {"middle_dataframe": middle_dataframe,
              "reply": graph_result["reply"],
              "graphs_grammar": graph_result["graphs_grammar"],
              "recommendation": graph_result["recommendation"],
              "graph_layout": state1["graph_layout"]}
    # json_str = json.dumps(result, ensure_ascii=False, indent=4)
    return result
    return None


def main():
    path = "./uploads/nba1.csv"
    # user_input = "我上传了文件，请你首先先自行描述一下数据，挖掘一些潜在的insight"
    while True:
        user_input = input("User: ")
        if user_input.lower() in ["quit", "exit", "q"]:
            print("Goodbye!")
            break
        stream_graph_updates(user_input, path, "[]")


if __name__ == "__main__":
    main()
# 我提供给你的数据是什么
# 我上传了文件，请你首先先自行描述一下数据，挖掘一些潜在的insight
# 我想看看25岁以下球员命中率与三分球命中率的关系

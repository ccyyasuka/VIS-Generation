# 定义一些 Mock 工具函数
import openai
import json
from langgraph.graph.message import add_messages, AnyMessage
import uuid
from langgraph.prebuilt import tools_condition, ToolNode
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from datetime import datetime
from langchain_core.runnables import Runnable, RunnableConfig
from typing import Annotated, Optional
from typing_extensions import TypedDict


def search_flights(flight_number: Optional[float] = None,
                   date: Optional[str] = None) -> list:
    """
    Search for trip recommendations based on Flight number and date.

    Args:
        flight_number: The flight number of the flight. Defaults to None.
        date: The date of the flight. Defaults to None.

    Returns:
        list[dict]: A list of the exact time the flight leaves.
    """
    return "起飞时间是2024-12-28 10:30:00"


def lookup_policy(state):
    """
    这是一个示例自定义工具函数的文档字符串。
    """
    return "公司的取消政策：票务可以在航班前 24 小时内免费取消。"


def book_hotel(state):
    """
    这是一个示例自定义工具函数的文档字符串。
    """
    return "已预订一个 3 星级酒店，入住日期为明天。"


def cancel_ticket(state):
    """
    这是一个示例自定义工具函数的文档字符串。
    """
    return "航班已成功取消。"


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


# 设置 OpenAI API 密钥

# 定义状态


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


class Assistant:
    def __init__(self, runnable: Runnable):
        self.runnable = runnable

    def __call__(self, state: State, config: RunnableConfig):
        while True:
            passenger_id = config.get("passenger_id", None)
            state = {**state, "user_info": passenger_id}
            result = self.runnable.invoke(state)
            additional_kwargs = result.additional_kwargs
            # 如果大型语言模型返回了一个空响应，我们将重新提示它给出一个实际的响应。
            # 如果返回的 result 包含 function_call，则根据 function_call 来执行相应的函数
            if 'function_call' in additional_kwargs:

                function_call = additional_kwargs['function_call']
                function_name = function_call.get('name')
                arguments = json.loads(function_call.get('arguments', '{}'))
                print(f"调用了工具函数{function_name}")
                # 动态调用函数（通过 eval）
                try:
                    # 构造函数调用的字符串，并通过 eval 执行
                    response = eval(f"{function_name}(**arguments)")
                except Exception as e:
                    response = f"调用 {function_name} 时出错: {e}"

                # 更新 result 内容并返回
                result.content = response
                break
            else:
                # 如果没有 function_call，继续默认的处理逻辑
                if not result.content or isinstance(result.content, list) and not result.content[0].get("text"):
                    messages = state["messages"] + [("user", "请给出一个真实的输出。")]
                    state = {**state, "messages": messages}
                else:
                    break
        return {"messages": result}


# 创建助手实例
# llm = Assistant(model="gpt-4", temperature=1)
llm = ChatOpenAI(model="gpt-4", temperature=0.2)

# 定义提示模板
primary_assistant_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "你是一个为瑞士航空提供帮助的客户支持助手。"
            "使用提供的工具来搜索航班、公司政策和其他信息以帮助回答用户的查询。"
            "在搜索时，要有毅力。如果第一次搜索没有结果，就扩大你的查询范围。"
            "如果搜索结果为空，不要放弃，先扩大搜索范围。"
            "\n\n当前用户：\n<User>\n{user_info}\n</User>"
            "\n当前时间：{time}。",
        ),
        ("placeholder", "{messages}"),
    ]
).partial(time=datetime.now())

part_1_tools = [
    search_flights,
    lookup_policy,
    book_hotel,
    cancel_ticket,
    # 添加其他工具...
]

part_1_assistant_runnable = primary_assistant_prompt | llm.bind_functions(
    functions=part_1_tools)


# 定义图

builder = StateGraph(State)

# 定义节点
builder.add_node("assistant", Assistant(part_1_assistant_runnable))
builder.add_node("action", ToolNode(part_1_tools))

# 定义控制流
builder.set_entry_point("assistant")
builder.add_conditional_edges(
    "assistant",
    tools_condition,
    {"action": "action", END: END},
)
builder.add_edge("action", "assistant")

# 添加检查点器
# memory = SqliteSaver.from_conn_string(":memory:")
# part_1_graph = builder.compile(checkpointer=memory)


tutorial_questions = [
    "你好，我的航班是什么时候？",
    "我的航班号是1111,在12月18号出发",
    "我可以把我的航班改签到更早的时间吗？我想今天晚些时候离开。",
]

thread_id = str(uuid.uuid4())

config = {
    "configurable": {
        "passenger_id": "3442 587242",
        "thread_id": thread_id,
    }
}

_printed = set()


def _print_event(event, _printed, max_length=1500):
    current_state = event.get("dialog_state")
    if current_state:
        print(f"当前状态: ", current_state[-1])
    message = event.get("messages")
    if message:
        if isinstance(message, list):
            message = message[-1]
        if message.id not in _printed:
            msg_repr = message.pretty_repr(html=True)
            if len(msg_repr) > max_length:
                msg_repr = msg_repr[:max_length] + " ... （内容已截断）"
            print(msg_repr)
            _printed.add(message.id)


with SqliteSaver.from_conn_string(":memory:") as checkpointer:
    part_1_graph = builder.compile(checkpointer=checkpointer)
    # app.invoke(...)
    for question in tutorial_questions:
        events = part_1_graph.stream(
            {"messages": ("user", question)}, config, stream_mode="values"
        )
        for event in events:
            _print_event(event, _printed)

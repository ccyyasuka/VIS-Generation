import pandas as pd
from typing import Optional, List, Dict, Any
from langchain_core.tools import tool
from langgraph.types import Command
from typing_extensions import Annotated, TypedDict
from langgraph.prebuilt import InjectedState
from langchain_core.messages import ToolMessage
from langchain_core.tools.base import InjectedToolCallId
from langchain_community.tools.tavily_search import TavilySearchResults
import time
CACHE="./cache/cache.json"
CACHEBRIEF="./cache/cache_brief.json"
tavily_tool = TavilySearchResults(max_results=5)


@tool
def get_column_names(state: Annotated[dict, InjectedState],
                     analysis_type: str) -> List[str]:
    """
    Get all column names from a pandas DataFrame stored in the state.

    Args:
        analysis_type (str): Indicates which DataFrame to use. Use 'initial' for the original dataframe and 'processing' for the intermediate dataframe.

    Returns:
        List[str]: A list of column names from the DataFrame.
    """
    print("00000000000000000000000000get_column_names")
    # print(state)
    if analysis_type == "initial":
        dataframe = pd.read_json(state["dataframe"])
    else:
        with open(CACHE, "r") as file:
            middle_dataframe = file.read()
        dataframe = pd.read_json(middle_dataframe)
    # print(dataframe.columns.tolist())
    # 返回所有列名
    
    return dataframe.columns.tolist()


@tool
def show_dataframe_head(state: Annotated[dict, InjectedState], analysis_type: str) -> List[List[Any]]:
    """
    Show the first 5 rows of a pandas DataFrame stored in the state.

    Args:
        analysis_type (str): Indicates which DataFrame to use. Use 'initial' for the original dataframe and 'processing' for the intermediate dataframe.

    Returns:
        List[List[Any]]: A list of lists representing the first 5 rows of the DataFrame.
    """
    print("00000000000000000000000000show_dataframe_head")
    # print(state)
    

    # 根据analysis_type从state中读取DataFrame
    if analysis_type == "initial":
        dataframe = pd.read_json(state["dataframe"])
    else:
        with open(CACHE, "r") as file:
            middle_dataframe = file.read()
        dataframe = pd.read_json(middle_dataframe)

    # 获取DataFrame的前5行
    head_rows = dataframe.head().values.tolist()
    # print(head_rows)

    # 返回前5行数据
    return head_rows


@tool
def calculate_statistics(
    state: Annotated[dict, InjectedState],
    column_name: str,
    analysis_type: str,
    methods: List[str] = ["mean", "variance",
                          "std_dev", "min", "max", "median"],
) -> Dict[str, float]:
    """
    Calculate statistics for a specific column in a pandas DataFrame stored in the state.

    Args:
        column_name (str): The name of the column to calculate statistics for.
        analysis_type (str): Indicates which DataFrame to use. Use 'initial' for the original dataframe and 'processing' for the intermediate dataframe.
        methods (List[str], optional): A list of statistical methods to compute. Defaults to ["mean", "variance", "std_dev", "min", "max", "median"].

    Returns:
        Dict[str, float]: A dictionary of calculated statistics with method names as keys and computed values as float values.
    """
    print("00000000000000000000000000calculate_statistics")
    
    if analysis_type == "initial":
        dataframe = pd.read_json(state["dataframe"])
    else:
        with open(CACHE, "r") as file:
            middle_dataframe = file.read()
        dataframe = pd.read_json(middle_dataframe)
    # 确保列名存在于数据中
    if column_name not in dataframe.columns:
        raise ValueError(f"Column '{column_name}' not found in the DataFrame.")

    # 计算统计值
    results = {}

    if "mean" in methods:
        results["mean"] = dataframe[column_name].mean()

    if "variance" in methods:
        results["variance"] = dataframe[column_name].var()

    if "std_dev" in methods:
        results["std_dev"] = dataframe[column_name].std()

    if "min" in methods:
        results["min"] = dataframe[column_name].min()

    if "max" in methods:
        results["max"] = dataframe[column_name].max()

    if "median" in methods:
        results["median"] = dataframe[column_name].median()

    if "sum" in methods:
        results["sum"] = dataframe[column_name].sum()

    if "count" in methods:
        results["count"] = dataframe[column_name].count()

    if "kurtosis" in methods:
        results["kurtosis"] = dataframe[column_name].kurtosis()
    return results


@tool
def calculate_pairwise_statistics(
    state: Annotated[dict, InjectedState],
    column1: str,
    column2: str,
    analysis_type: str,
    methods: List[str] = ["pearson", "covariance", "spearman",
                          "kendall", "correlation", "covariance_matrix"]
) -> Dict[str, float]:
    """
    Calculate statistics for a pair of columns in a pandas DataFrame stored in the state.

    Args:
        column1 (str): The name of the first column for pairwise statistics.
        column2 (str): The name of the second column for pairwise statistics.
        analysis_type (str): Indicates which DataFrame to use. Use 'initial' for the original dataframe and 'processing' for the intermediate dataframe.
        methods (List[str], optional): A list of statistical methods to compute for the pair of columns. Defaults to ["pearson", "covariance", "spearman", "kendall", "correlation", "covariance_matrix"].

    Returns:
        Dict[str, float]: A dictionary of calculated statistics with method names as keys and computed values as float values or other relevant data types.
    """
    print("00000000000000000000000000calculate_pairwise_statistics")
    
    if analysis_type == "initial":
        dataframe = pd.read_json(state["dataframe"])
    else:
        with open(CACHE, "r") as file:
            middle_dataframe = file.read()
        dataframe = pd.read_json(middle_dataframe)
    # 确保列名存在于数据中
    if column1 not in dataframe.columns or column2 not in dataframe.columns:
        raise ValueError(
            f"Columns '{column1}' and/or '{column2}' not found in the DataFrame.")

    # 提取两个列的数据
    col1_data = dataframe[column1]
    col2_data = dataframe[column2]

    # 计算统计值
    results = {}

    # 皮尔逊相关系数
    if "pearson" in methods:
        results["pearson"] = col1_data.corr(col2_data, method="pearson")

    # 协方差
    if "covariance" in methods:
        results["covariance"] = col1_data.cov(col2_data)

    # Spearman 等级相关系数
    if "spearman" in methods:
        results["spearman"] = col1_data.corr(col2_data, method="spearman")

    # Kendall Tau 相关系数
    if "kendall" in methods:
        results["kendall"] = col1_data.corr(col2_data, method="kendall")

    # 相关性（计算列之间的相关系数）
    if "correlation" in methods:
        results["correlation"] = col1_data.corr(col2_data)

    # 协方差矩阵
    if "covariance_matrix" in methods:
        covariance_matrix = dataframe[[column1, column2]].cov()
        results["covariance_matrix"] = covariance_matrix.to_dict()

    # 计算皮尔逊相关系数的p值（对于显著性测试）
    if "pearson_p_value" in methods:
        from scipy.stats import pearsonr
        corr, p_value = pearsonr(col1_data, col2_data)
        results["pearson_p_value"] = p_value

    return results


# ##################################################################################

@tool
def remove_nans(
    tool_call_id: Annotated[str, InjectedToolCallId],
    # analysis_type: str,
    column_names: List[str]
) -> Dict[str, str]:
    """
    Remove rows with NaN values in specified columns of a pandas DataFrame stored in the state.

    Args:
        tool_call_id: Annotated[str, InjectedToolCallId]: tool call id.
        
        column_names (List[str]): A list of column names to check for NaNs and remove rows accordingly.

    Returns:
        Dict[str, str]: A dictionary indicating the success of the operation and a message.
    """
    # # 从state中读取DataFrame
    # if analysis_type == "initial":
    #     dataframe = pd.read_json(state["dataframe"])
    # else:
    #     dataframe = pd.read_json(state["middle_dataframe"])
    print("00000000000000000000000000remove_nans")
    
    with open(CACHE, "r") as file:
        middle_dataframe = file.read()
    dataframe = pd.read_json(middle_dataframe)
    # 确保所有提供的列名都存在于数据中
    non_existent_columns = [
        col for col in column_names if col not in dataframe.columns]
    if non_existent_columns:
        raise ValueError(
            f"Columns {non_existent_columns} not found in the DataFrame.")

    # 对于每个指定的列，去除含有NaN值的行
    original_row_count = len(dataframe)
    for column in column_names:
        dataframe = dataframe.dropna(subset=[column])

    if dataframe is not None:
        # 将整个df转换为字符串格式并写入到"./cache/cache.txt"文件中
        with open(CACHE, "w") as file:
            file.write(dataframe.to_string(index=False))
            
        # 将df的前10行转换为字符串格式并写入到"./cache/cache_brief.txt"文件中
        with open(CACHEBRIEF, "w") as file:
            file.write(dataframe.head(10).to_string(index=False))

    print("写回成功")
    return {
            # update the state keys
            # "middle_dataframe": dataframe.to_json(orient='records'),
            # "middle_dataframe_brief": df_brief.to_json(orient='records'),
            # update the message history
            "messages": [ToolMessage("Null value in dataframe successfully removed", tool_call_id=tool_call_id)]
        }
    # 将清理后的DataFrame转换回JSON字符串并更新到state
    # return Command(
    #     update={
    #         # update the state keys
    #         "middle_dataframe": dataframe.to_json(orient='records'),
    #         "middle_dataframe_brief": df_brief.to_json(orient='records'),
    #         # update the message history
    #         "messages": [ToolMessage("Null value in dataframe successfully removed", tool_call_id=tool_call_id)]
    #     }
    # )


@tool
def extract_columns(
    tool_call_id: Annotated[str, InjectedToolCallId],
    
    # analysis_type: str,
    column_names: List[str]
) -> Dict[str, str]:
    """
    Extract specified columns from a pandas DataFrame stored in the state.

    Args:
        tool_call_id: Annotated[str, InjectedToolCallId]: tool call id.
        
        column_names (List[str]): A list of column names to extract from the DataFrame.

    Returns:
        Dict[str, str]: A dictionary indicating the success of the operation and a message.
    """
    # 从state中读取DataFrame
    # if analysis_type == "initial":
    #     dataframe = pd.read_json(state["dataframe"])
    # else:
    #     dataframe = pd.read_json(state["middle_dataframe"])
    print("00000000000000000000000000extract_columns")
    
    # with open(CACHE, "r") as file:
    #     middle_dataframe = file.read()
    dataframe = pd.read_json(CACHE)
    # 确保所有提供的列名都存在于数据中
    non_existent_columns = [
        col for col in column_names if col not in dataframe.columns]
    if non_existent_columns:
        raise ValueError(
            f"Columns {non_existent_columns} not found in the DataFrame.")

    # 提取指定的列
    dataframe = dataframe[column_names]
    df_brief = dataframe.head(10)
    # 将提取后的DataFrame转换回JSON字符串并更新到state
    if dataframe is not None:
        # 将整个df转换为字符串格式并写入到"./cache/cache.txt"文件中
        dataframe.to_json(CACHE, orient='records', indent=4)  # 'orient' 参数可以根据需要调整
    
        # 将df的前10行转换为JSON格式并写入到CACHEBRIEF文件中
        dataframe.head(10).to_json(CACHEBRIEF, orient='records', indent=4) 
    print("写回成功")
    return {
            # update the state keys
            # "middle_dataframe": extracted_dataframe.to_json(orient='records'),
            # "middle_dataframe_brief": df_brief.to_json(orient='records'),
            # update the message history
            "messages": [ToolMessage("Columns successfully extracted from dataframe", tool_call_id=tool_call_id)]
        }
    


@tool
def groupby_column(
    tool_call_id: Annotated[str, InjectedToolCallId],
    # analysis_type: str,
    column_name: str,
    groupby_condition: str,
    aggregation: Dict[str, Any]
) -> Dict[str, str]:
    """
    Group a DataFrame by a specified column and apply aggregation based on a condition.

    Args:
        tool_call_id: Annotated[str, InjectedToolCallId]: tool call id.
        column_name (str): The column name to group by.
        groupby_condition (str): A condition to filter the DataFrame before grouping (e.g., "column_name > 10").
        aggregation (Dict[str, Any]): A dictionary specifying the aggregation operations to apply (e.g., {"column_name": "sum"}).

    Returns:
        Dict[str, str]: A dictionary indicating the success of the operation and a message.
    """
    # 从state中读取DataFrame
    # if analysis_type == "initial":
    #     dataframe = pd.read_json(state["dataframe"])
    # else:
    #     dataframe = pd.read_json(state["middle_dataframe"])
    print("00000000000000000000000000groupby_column")
    
    dataframe = pd.read_json(CACHE)
    # 检查指定的列是否存在
    if column_name not in dataframe.columns:
        raise ValueError(f"Column {column_name} not found in the DataFrame.")

    # 根据条件过滤DataFrame
    filtered_dataframe = dataframe.query(groupby_condition)

    # 对过滤后的DataFrame进行分组和聚合操作
    dataframe = filtered_dataframe.groupby(
        column_name).agg(aggregation).reset_index()
    df_brief = dataframe.head(10)
    if dataframe is not None:
        # 将整个df转换为字符串格式并写入到"./cache/cache.txt"文件中
        dataframe.to_json(CACHE, orient='records', indent=4)  # 'orient' 参数可以根据需要调整
    
        # 将df的前10行转换为JSON格式并写入到CACHEBRIEF文件中
        dataframe.head(10).to_json(CACHEBRIEF, orient='records', indent=4) 
    # 将分组后的DataFrame转换回JSON字符串并更新到state
    print("写回成功")
    return {
            # update the state keys
            # "middle_dataframe": grouped_dataframe.to_json(orient='records'),
            # "middle_dataframe_brief": df_brief.to_json(orient='records'),
            # update the message history
            "messages": [ToolMessage("DataFrame successfully grouped and aggregated", tool_call_id=tool_call_id)]
        }


# @tool
def filter_dataframe(
    tool_call_id: Annotated[str, InjectedToolCallId],
    # analysis_type: str,
    filter_condition: str
) -> Dict[str, str]:
    """
    Filter a DataFrame based on a specified condition.

    Args:
        tool_call_id: Annotated[str, InjectedToolCallId]: tool call id.
        filter_condition (str): A condition to filter the DataFrame (e.g., "column_name > 10").

    Returns:
        Dict[str, str]: A dictionary indicating the success of the operation and a message.
    """
    # # 根据analysis_type从state中读取DataFrame
    # if analysis_type == "initial":
    #     dataframe = pd.read_json(state["dataframe"])
    # else:
    #     dataframe = pd.read_json(state["middle_dataframe"])
    print("00000000000000000000000000filter_dataframe")
    
    # with open(CACHE, "r") as file:
    #     middle_dataframe = file.read()
    dataframe = pd.read_json(CACHE)
    # 使用给定的过滤条件过滤DataFrame
    try:
        dataframe = dataframe.query(filter_condition)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error during filtering: {str(e)}"
        }
    df_brief = dataframe.head(10)
    if dataframe is not None:
        # 将整个df转换为字符串格式并写入到"./cache/cache.txt"文件中
        dataframe.to_json(CACHE, orient='records', indent=4)  # 'orient' 参数可以根据需要调整
    
        # 将df的前10行转换为JSON格式并写入到CACHEBRIEF文件中
        dataframe.head(10).to_json(CACHEBRIEF, orient='records', indent=4) 
    # 将过滤后的DataFrame转换回JSON字符串并更新到state
    print("写回成功")
    return {
            # 更新状态键值
            # "middle_dataframe": filtered_dataframe.to_json(orient='records'),
            # "middle_dataframe_brief": df_brief.to_json(orient='records'),
            # 更新消息历史
            "messages": [ToolMessage("DataFrame successfully filtered", tool_call_id=tool_call_id)]
        }
    # return Command(
    #     update={
    #         # 更新状态键值
    #         "middle_dataframe": filtered_dataframe.to_json(orient='records'),
    #         "middle_dataframe_brief": df_brief.to_json(orient='records'),
    #         # 更新消息历史
    #         "messages": [ToolMessage("DataFrame successfully filtered", tool_call_id=tool_call_id)]
    #     }
    # )


@tool
def rename_columns(
    tool_call_id: Annotated[str, InjectedToolCallId],
    state: Annotated[dict, InjectedState],
    # analysis_type: str,
    rename_mapping: Dict[str, str]
) -> Dict[str, str]:
    """
    Rename specified columns in a DataFrame.

    Args:
        tool_call_id: Annotated[str, InjectedToolCallId]: tool call id.
        state (Dict[str, Any]): A dictionary containing the key "dataframe" with a pandas DataFrame.
        rename_mapping (Dict[str, str]): A dictionary mapping of old column names to new column names.

    Returns:
        Dict[str, str]: A dictionary indicating the success of the operation and a message.
    """
    # 从state中读取DataFrame
    # if analysis_type == "initial":
    #     dataframe = pd.read_json(state["dataframe"])
    # else:
    #     dataframe = pd.read_json(state["middle_dataframe"])
    print("00000000000000000000000000rename_columns")
    with open(CACHE, "r") as file:
        middle_dataframe = file.read()
    dataframe = pd.read_json(middle_dataframe)
    
    
    # 检查所有待重命名的列是否存在
    for old_name in rename_mapping.keys():
        if old_name not in dataframe.columns:
            raise ValueError(f"Column {old_name} not found in the DataFrame.")

    # 重命名DataFrame中的列
    dataframe.rename(columns=rename_mapping, inplace=True)
    df_brief = dataframe.head(10)
    # 将更新后的DataFrame转换回JSON字符串并更新到state
    if dataframe is not None:
        # 将整个df转换为字符串格式并写入到"./cache/cache.txt"文件中
        with open(CACHE, "w") as file:
            file.write(dataframe.to_string(index=False))
            
        # 将df的前10行转换为字符串格式并写入到"./cache/cache_brief.txt"文件中
        with open(CACHEBRIEF, "w") as file:
            file.write(dataframe.head(10).to_string(index=False))
    print("写回成功")
    return {
            # 更新状态键值
            # "middle_dataframe": dataframe.to_json(orient='records'),
            # "middle_dataframe_brief": df_brief.to_json(orient='records'),
            # 更新消息历史
            "messages": [ToolMessage("DataFrame successfully updated with renamed columns", tool_call_id=tool_call_id)]
        }


# @tool
# def sort_by_column(
#     tool_call_id: Annotated[str, InjectedToolCallId],
#     state: Annotated[dict, InjectedState],
#     # analysis_type: str,
#     column_name: str,
#     ascending: bool = True
# ) -> Dict[str, str]:
#     """
#     Sort a DataFrame by a specified column.

#     Args:
#         tool_call_id: Annotated[str, InjectedToolCallId]: tool call id.
#         state (Dict[str, Any]): A dictionary containing the key "dataframe" with a pandas DataFrame.
#         analysis_type (str): Indicates which DataFrame to use. Use 'initial' for the original dataframe and 'processing' for the intermediate dataframe.
#         column_name (str): The column name to sort by.
#         ascending (bool): Whether to sort in ascending order. Default is True.

#     Returns:
#         Dict[str, str]: A dictionary indicating the success of the operation and a message.
#     """
#     # 从state中读取DataFrame
#     # if analysis_type == "initial":
#     #     dataframe = pd.read_json(state["dataframe"])
#     # else:
#     #     dataframe = pd.read_json(state["middle_dataframe"])
#     print("00000000000000000000000000sort_by_column")
#     dataframe = pd.read_json(state["middle_dataframe"])
#     
#     # 检查指定的列是否存在
#     if column_name not in dataframe.columns:
#         raise ValueError(f"Column {column_name} not found in the DataFrame.")

#     # 根据指定列名对DataFrame进行排序
#     sorted_dataframe = dataframe.sort_values(
#         by=column_name, ascending=ascending).reset_index(drop=True)
#     df_brief = sorted_dataframe.head(10)

#     return {
#             # 更新状态键值
#             "middle_dataframe": sorted_dataframe.to_json(orient='records'),
#             "middle_dataframe_brief": df_brief.to_json(orient='records'),
#             # 更新消息历史
#             "messages": [ToolMessage(f"DataFrame successfully sorted by {column_name}", tool_call_id=tool_call_id)]
#         }
#     # 将排序后的DataFrame转换回JSON字符串并更新到state
#     return Command(
#         update={
#             # 更新状态键值
#             "middle_dataframe": sorted_dataframe.to_json(orient='records'),
#             "middle_dataframe_brief": df_brief.to_json(orient='records'),
#             # 更新消息历史
#             "messages": [ToolMessage(f"DataFrame successfully sorted by {column_name}", tool_call_id=tool_call_id)]
#         }
#     )


if __name__ == "__main__":
    # test_data = """[{"Player":"Jayson Tatum","POS":"SF","Team":"BOS","Age":25.0,"GP":74.0,"W":52.0,"L":22.0,"Min":2732.2,"PTS":2225.0,"FGM":727.0,"FGA":1559.0,"\\u6295\\u7bee\\u547d\\u4e2d\\u7387(FG%)":46.6,"3PM":240.0,"3PA":686.0,"\\u4e09\\u5206\\u547d\\u4e2d\\u7387(3P%)":35.0,"FTM":531.0,"FTA":622.0,"FT%":85.4,"OREB":78.0,"DREB":571.0,"REB":649.0,"AST":342.0,"TOV":213.0,"STL":78.0,"BLK":51.0,"PF":160.0,"FP":3691.0,"DD2":31.0,"TD3":1.0,"+\\/-":470.0},{"Player":"Joel Embiid","POS":"C","Team":"PHI","Age":29.0,"GP":66.0,"W":43.0,"L":23.0,"Min":2284.1,"PTS":2183.0,"FGM":728.0,"FGA":1328.0,"\\u6295\\u7bee\\u547d\\u4e2d\\u7387(FG%)":54.8,"3PM":66.0,"3PA":200.0,"\\u4e09\\u5206\\u547d\\u4e2d\\u7387(3P%)":33.0,"FTM":661.0,"FTA":771.0,"FT%":85.7,"OREB":113.0,"DREB":557.0,"REB":670.0,"AST":274.0,"TOV":226.0,"STL":66.0,"BLK":112.0,"PF":205.0,"FP":3706.0,"DD2":39.0,"TD3":1.0,"+\\/-":424.0},{"Player":"Luka Doncic","POS":"PG","Team":"DAL","Age":24.0,"GP":66.0,"W":33.0,"L":33.0,"Min":2390.5,"PTS":2138.0,"FGM":719.0,"FGA":1449.0,"\\u6295\\u7bee\\u547d\\u4e2d\\u7387(FG%)":49.6,"3PM":185.0,"3PA":541.0,"\\u4e09\\u5206\\u547d\\u4e2d\\u7387(3P%)":34.2,"FTM":515.0,"FTA":694.0,"FT%":74.2,"OREB":54.0,"DREB":515.0,"REB":569.0,"AST":529.0,"TOV":236.0,"STL":90.0,"BLK":33.0,"PF":166.0,"FP":3747.0,"DD2":36.0,"TD3":10.0,"+\\/-":128.0}]
    # """
    # state = {}
    # state["dataframe"] = test_data
    # calculate_pairwise_statistics(
    #     state,
    #     "FGM",
    #     "FGA",
    #     "initial",
    #     ["pearson", "covariance", "spearman",
    #      "kendall", "correlation", "covariance_matrix"]
    # )
    filter_dataframe("aaa","Age < 25")

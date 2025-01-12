import pandas as pd
from typing import Optional, List, Dict
from langchain_core.tools import tool


@tool
def get_column_names(file_path: str) -> List[str]:
    """
    Get all column names from an Excel or CSV file.

    Args:
        file_path (str): The path to the Excel or CSV file.

    Returns:
        List[str]: A list of column names from the file.
    """
    # file_path = ".\\uploads\\" + file_path
    # 检查文件扩展名来判断文件类型
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        # 读取Excel文件
        df = pd.read_excel(file_path)
    elif file_path.endswith(".csv"):
        # 读取CSV文件
        df = pd.read_csv(file_path)
    else:
        raise ValueError(
            "Unsupported file format. Please provide an Excel (.xlsx/.xls) or CSV (.csv) file.")
    print(df.columns.tolist())
    # 返回所有列名
    return df.columns.tolist()


@tool
def calculate_statistics(
    file_path: str,
    column_name: str,
    methods: List[str] = ["mean", "variance",
                          "std_dev", "min", "max", "median"]
) -> Dict[str, float]:
    """
    Calculate statistics for a specific column in an Excel or CSV file.

    Args:
        file_path (str): The path to the Excel or CSV file.
        column_name (str): The name of the column to calculate statistics for.
        methods (List[str], optional): A list of statistical methods to compute. Defaults to ["mean", "variance", "std_dev", "min", "max", "median"].

    Returns:
        Dict[str, float]: A dictionary of calculated statistics with method names as keys and computed values as float values.
    """
    # file_path = ".\\uploads\\" + file_path
    # 检查文件扩展名来判断文件类型
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        # 读取Excel文件
        df = pd.read_excel(file_path)
    elif file_path.endswith(".csv"):
        # 读取CSV文件
        df = pd.read_csv(file_path)
    else:
        raise ValueError(
            "Unsupported file format. Please provide an Excel (.xlsx/.xls) or CSV (.csv) file.")

    # 确保列名存在于数据中
    if column_name not in df.columns:
        raise ValueError(f"Column '{column_name}' not found in the file.")

    # 计算统计值
    results = {}

    if "mean" in methods:
        results["mean"] = df[column_name].mean()

    if "variance" in methods:
        results["variance"] = df[column_name].var()

    if "std_dev" in methods:
        results["std_dev"] = df[column_name].std()

    if "min" in methods:
        results["min"] = df[column_name].min()

    if "max" in methods:
        results["max"] = df[column_name].max()

    if "median" in methods:
        results["median"] = df[column_name].median()

    if "sum" in methods:
        results["sum"] = df[column_name].sum()

    if "count" in methods:
        results["count"] = df[column_name].count()

    if "kurtosis" in methods:
        results["kurtosis"] = df[column_name].kurtosis()

    if "skewness" in methods:
        results["skewness"] = df[column_name].skew()

    return results


@tool
def calculate_pairwise_statistics(
    file_path: str,
    column1: str,
    column2: str,
    methods: List[str] = ["pearson", "covariance", "spearman",
                          "kendall", "correlation", "covariance_matrix"]
) -> Dict[str, float]:
    """
    Calculate statistics for a pair of columns in an Excel or CSV file.

    Args:
        file_path (str): The path to the Excel or CSV file.
        column1 (str): The name of the first column for pairwise statistics.
        column2 (str): The name of the second column for pairwise statistics.
        methods (List[str], optional): A list of statistical methods to compute for the pair of columns. Defaults to ["pearson", "covariance", "spearman", "kendall", "correlation", "covariance_matrix"].

    Returns:
        Dict[str, float]: A dictionary of calculated statistics with method names as keys and computed values as float values or other relevant data types.
    """
    # file_path = ".\\uploads\\" + file_path
    # 检查文件扩展名来判断文件类型
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        # 读取Excel文件
        df = pd.read_excel(file_path)
    elif file_path.endswith(".csv"):
        # 读取CSV文件
        df = pd.read_csv(file_path)
    else:
        raise ValueError(
            "Unsupported file format. Please provide an Excel (.xlsx/.xls) or CSV (.csv) file.")

    # 确保列名存在于数据中
    if column1 not in df.columns or column2 not in df.columns:
        raise ValueError(
            f"Columns '{column1}' and/or '{column2}' not found in the file.")

    # 提取两个列的数据
    col1_data = df[column1]
    col2_data = df[column2]

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
        covariance_matrix = df[[column1, column2]].cov()
        results["covariance_matrix"] = covariance_matrix.to_dict()

    # 计算皮尔逊相关系数的p值（对于显著性测试）
    if "pearson_p_value" in methods:
        from scipy.stats import pearsonr
        corr, p_value = pearsonr(col1_data, col2_data)
        results["pearson_p_value"] = p_value

    return results

import pandas as pd
import json

data = [
    {"Product_ID":1052,"Sale_Date":"2023/2/3","Sales_Rep":"Bob","Region":"North","Sales_Amount":5053.97},
    {"Product_ID":1093,"Sale_Date":"2023/4/21","Sales_Rep":"Bob","Region":"West","Sales_Amount":4384.02},
    {"Product_ID":1015,"Sale_Date":"2023/9/21","Sales_Rep":"David","Region":"South","Sales_Amount":4631.23},
    {"Product_ID":1072,"Sale_Date":"2023/8/24","Sales_Rep":"Bob","Region":"South","Sales_Amount":2167.94},
    {"Product_ID":1061,"Sale_Date":"2023/3/24","Sales_Rep":"Charlie","Region":"East","Sales_Amount":3750.2},
    {"Product_ID":1021,"Sale_Date":"2023/2/11","Sales_Rep":"Charlie","Region":"West","Sales_Amount":3761.15},
    {"Product_ID":1083,"Sale_Date":"2023/4/11","Sales_Rep":"Bob","Region":"West","Sales_Amount":618.31},
    {"Product_ID":1087,"Sale_Date":"2023/1/6","Sales_Rep":"Eve","Region":"South","Sales_Amount":7698.92},
    {"Product_ID":1075,"Sale_Date":"2023/6/29","Sales_Rep":"David","Region":"South","Sales_Amount":4223.39},
    {"Product_ID":1075,"Sale_Date":"2023/10/9","Sales_Rep":"Charlie","Region":"West","Sales_Amount":8239.58},
    {"Product_ID":1088,"Sale_Date":"2023/11/16","Sales_Rep":"Eve","Region":"North","Sales_Amount":8518.45},
    {"Product_ID":1100,"Sale_Date":"2023/8/14","Sales_Rep":"Bob","Region":"West","Sales_Amount":2198.74},
    {"Product_ID":1024,"Sale_Date":"2023/11/11","Sales_Rep":"Eve","Region":"West","Sales_Amount":6607.8},
    {"Product_ID":1003,"Sale_Date":"2023/12/31","Sales_Rep":"Alice","Region":"South","Sales_Amount":4775.59},
    {"Product_ID":1022,"Sale_Date":"2023/8/17","Sales_Rep":"Charlie","Region":"South","Sales_Amount":8813.55},
    {"Product_ID":1053,"Sale_Date":"2023/10/16","Sales_Rep":"Bob","Region":"North","Sales_Amount":2235.83},
    {"Product_ID":1002,"Sale_Date":"2023/5/30","Sales_Rep":"David","Region":"North","Sales_Amount":6810.35},
    {"Product_ID":1088,"Sale_Date":"2023/10/4","Sales_Rep":"Bob","Region":"East","Sales_Amount":6116.75},
    {"Product_ID":1030,"Sale_Date":"2023/7/17","Sales_Rep":"David","Region":"West","Sales_Amount":3023.48},
    {"Product_ID":1038,"Sale_Date":"2023/3/11","Sales_Rep":"Bob","Region":"South","Sales_Amount":1452.35}
]

df = pd.DataFrame(data)

# 汇总销售额
grouped = df.groupby(['Sales_Rep', 'Region'])['Sales_Amount'].sum().reset_index()

# 将结果转换为字典格式
result = grouped.to_dict(orient='records')

# 输出结果

json_data = json.dumps(result, indent=4)

# 保存到本地文件
with open("sales_data_result.json", "w") as f:
    f.write(json_data)

print("数据已成功保存为 'sales_data.json'")
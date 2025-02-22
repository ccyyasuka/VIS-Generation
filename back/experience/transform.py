import pandas as pd

# 读取前20行数据
df = pd.read_csv(r'C:\Users\14666\Desktop\dataset\sales_data.csv', nrows=20)
df_small = pd.read_csv(r'C:\Users\14666\Desktop\dataset\sales_data.csv', nrows=3)
# 将DataFrame转换为JSON列表格式
json_data = df.to_json(orient='records', lines=False, force_ascii=False)
json_data_small = df_small.to_json(orient='records', lines=False, force_ascii=False)
# 打印JSON数据
print(json_data)

# 如果需要将JSON数据保存到文件中
with open('sales_data.json', 'w', encoding='utf-8') as f:
    f.write(json_data)
    
with open('sales_data_small.json', 'w', encoding='utf-8') as f:
    f.write(json_data_small)
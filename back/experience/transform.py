import pandas as pd

# 读取前20行数据，并删除存在空值的行
df = pd.read_csv(r'lung.csv', nrows=25).dropna()
df_small = pd.read_csv(r'lung.csv', nrows=6).dropna()
# 将DataFrame转换为JSON列表格式
json_data = df.to_json(orient='records', lines=False, force_ascii=False)
json_data_small = df_small.to_json(orient='records', lines=False, force_ascii=False)

# 如果需要将JSON数据保存到文件中
with open('lung.json', 'w', encoding='utf-8') as f:
    f.write(json_data)
    
with open('lungSmall.json', 'w', encoding='utf-8') as f:
    f.write(json_data_small)
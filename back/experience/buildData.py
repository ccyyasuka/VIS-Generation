import pandas as pd

# 读取csv文件
df = pd.read_csv('nbanew.csv')

# 筛选条件：2023-24赛季，常规赛，三分球命中数大于20
filtered_df = df[(df['year'] == '2023-24') & 
                 (df['Season_type'] == 'Playoffs') & 
                 (df['FG3M'] > 5)]

# 按三分球命中率降序排列并选择前10名
top_players = filtered_df.sort_values(by='FG3_PCT', ascending=False).head(30)

# 将结果保存为json文件
top_players.to_json('top_3pt_Playoffs_players_30.json', orient='records', indent=4)

print("数据已成功保存到top_players.json")
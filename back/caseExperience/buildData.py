import pandas as pd
import json

# 读取CSV文件
df = pd.read_csv(
    r'F:\D\my_vis_code\VIS-Generation\back\caseExperience\nba.csv')



# # 筛选出2023-24赛季常规赛的数据
# regular_2023_24 = df[(df['year'] == '2023-24') &
#                      (df['Season_type'] == 'Regular')]

# # 过滤出三分球命中数大于20的球员，并按三分球命中率排序，选取前10名
# top_3pm_players = regular_2023_24[regular_2023_24['FG3M'] > 20].sort_values(
#     by='FG3_PCT', ascending=False).head(10)

# # 将筛选后的数据转换为字典格式，方便保存为JSON
# result_dict = top_3pm_players.to_dict(orient='records')

# # 将结果保存为JSON文件
# with open('top_players_2023_24_regular.json', 'w') as json_file:
#     json.dump(result_dict, json_file, indent=4)

# print("已成功保存到top_players_2023_24_regular.json")

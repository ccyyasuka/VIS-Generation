import pandas as pd

# def count_words(cell_value):
#     """
#     计算给定字符串中的单词数。
#     忽略空格和换行符。
#     """
#     if cell_value is None or pd.isna(cell_value):
#         return 0
#     # 移除两端的空白字符，并用单个空格替换连续的空白字符（包括换行符）
#     cleaned_text = ' '.join(str(cell_value).split())
#     words = cleaned_text.split(' ')
#     return len(words)

# # 加载Excel文件
# input_file = 'wordCount.xlsx'  # 修改为你的Excel文件路径
# df = pd.read_excel(input_file)

# # 假设需要处理的列为第一列和第二列
# columns_to_process = df.columns[:2]  # 获取前两列

# # 对选定的每列进行操作
# for column in columns_to_process:
#     new_column_name = f'{column}_单词数'
#     df[new_column_name] = df[column].apply(count_words)

# # 将修改后的DataFrame保存回Excel文件
# output_file = 'wordCountRes.xlsx'  # 修改为你想要保存的Excel文件路径
# df.to_excel(output_file, index=False)




# 读取Excel文件
file_path = 'wordCountRes.xlsx'  # 替换为你的文件路径
# sheet_names = ['Sheet2']

# # 创建一个空字典来存储每种视图的成功次数和总次数
# view_counts = {'柱': [0, 0], '折线': [0, 0], '散点': [0, 0], '饼': [0, 0], 'stack': [0, 0]}

# # 遍历每个工作表
# for sheet_name in sheet_names:
#     df = pd.read_excel(file_path, sheet_name=sheet_name)
    
#     # 遍历每一行
#     for index, row in df.iterrows():
#         view_type = row['样式']
#         success = row['成功？']
        
#         # 处理复合类型的视图
#         if '，' in view_type:
#             view_types = view_type.split('，')
#             for v in view_types:
#                 v = v.strip()  # 去除前后空格
#                 if success == 1:
#                     view_counts[v][0] += 1  # 成功次数
#                 view_counts[v][1] += 1  # 总次数
#         else:
#             if success == 1:
#                 view_counts[view_type][0] += 1  # 成功次数
#             view_counts[view_type][1] += 1  # 总次数

# # 计算成功率并打印结果
# for view_type, counts in view_counts.items():
#     success_rate = counts[0] / counts[1] if counts[1] != 0 else 0
#     print(f'{view_type} 的成功率是: {success_rate:.2%}')






# sheet_names = ['Sheet1', 'Sheet2']

# # 遍历每个sheet并分别计算成功率
# for sheet in sheet_names:
#     # 读取当前sheet的数据
#     df = pd.read_excel(file_path, sheet_name=sheet)
    
#     # 计算成功率
#     # 假设数据包含列 '难度' 和 '成功？'，其中 '成功？' 列1代表成功，0代表失败或未尝试
#     difficulty_success_rate = df.groupby('难度')['成功？'].agg(['sum', 'count']).reset_index()
#     difficulty_success_rate['成功率'] = difficulty_success_rate['sum'] / difficulty_success_rate['count']
    
#     # 打印当前sheet的结果
#     print(f"Sheet: {sheet}")
#     print(difficulty_success_rate[['难度', '成功率']])
#     print("\n")









sheet_names = ['Sheet1', 'Sheet2']  # 根据实际情况修改sheet名称

# 遍历每个sheet并分别计算每种难度对应的单词数的平均值
for sheet in sheet_names:
    # 读取当前sheet的数据
    df = pd.read_excel(file_path, sheet_name=sheet)
    
    # 按“难度”列对数据进行分组，并计算每个难度级别下的单词数的平均值
    difficulty_avg_word_count = df.groupby('难度')['单词数'].mean().reset_index()
    
    # 打印当前sheet的结果
    print(f"Sheet: {sheet}")
    print(difficulty_avg_word_count)
    print("\n")

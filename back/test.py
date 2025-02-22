import pandas as pd
import uuid
import json
# 创建一个字典，将提供的数据转换为DataFrame
# data = {
#     "Player": ["Jayson Tatum", "Joel Embiid", "Luka Doncic"],
#     "POS": ["SF", "C", "PG"],
#     "Team": ["BOS", "PHI", "DAL"],
#     "Age": [25.0, 29.0, 24.0],
#     "GP": [74.0, 66.0, 66.0],
#     "PTS": [2225.0, 2183.0, 2138.0],
#     "FG%": [46.6, 54.8, 49.6],
#     "3P%": [35.0, 33.0, 34.2],
#     "FT%": [85.4, 85.7, 74.2],
#     "REB": [649.0, 670.0, 569.0],
#     "AST": [342.0, 274.0, 529.0],
#     "+/-": [470.0, 424.0, 128.0]
# }
# 统计图表在可视化图表库中的语法如下：
#             统计图表：
#             {
#                 name: "chart_type",
#                 description:"视图的介绍，例如：销量随时间的变化关系，是折线图",
#                 meta: {
#                     width: "图表宽度相对于主界面的百分比",
#                     height: "图表高度相对于主界面的百分比",
#                     left: "图表左上角像素相对于左边界的定位，使用CSS百分比定位",
#                     top: "图表左上角像素相对于上边界的定位，使用CSS百分比定位"
#                 },
#                 x: "数据列",
#                 y: "数据列",
#                 z: "数据列（仅适用于散点图）",
#                 interactionType: "交互信号的ID，例如filter_01",
#                 interactionKey: "交互信号对应的数据列。此数据列必须在x或y中",
#                 allowedInteractionType: "可接受交互信号的ID，存在交互信号时，必须有可接受的交互信号。"
#                 legandBy: "将数据进行分组展现的数据列名"
#                 transform: {
#                     type: "数据转换的方式，包括filter和groupBy",
#                     config: {
#                     dimension: '针对哪个数据列进行数据转换',
#                     condition: '包括<,>,=,asc,desc,sum,avg,count',
#                     value: '数据转换的标准，例如<25，那么value就是25，是一个number类型',
#                     },
#                 },
#             },
#             chart_type 包括 'Scatter' （散点图）、'ArcDiagram' （弧线图）、'Donat' （甜甜圈图）、'Line' （折线图）、'BarRight' （横向条形图）、'BarVertical' （纵向条形图）。
#             以下是一个示例输出：
#             {
#                 graphs_grammar: [
#                     {
#                     name: "ArcDiagram",
#                     description:"销量随时间的变化关系，是折线图",
#                     meta: {
#                         width: "60%",
#                         height: "60%",
#                         left: "15%",
#                         top: "5%"
#                     },
#                     interactionType: "filter_01",
#                     interactionKey: "height",
#                     allowedInteractionType: "filter_02"
#                     },
#                     {
#                     name: "BarRight",
#                     meta: {
#                         width: "40%",
#                         height: "20%",
#                         left: "15%",
#                         top: "5%"
#                     },
#                     x: "year",
#                     y: "height",
#                     interactionType: "filter_02",
#                     interactionKey: "height",
#                     allowedInteractionType: "filter_01"
#                     legandBy: "label"
#                     transform: {
#                         type: "filter",
#                         config: {
#                         dimension: 'height',
#                         condition: '<',
#                         value: 180,
#                         },
#                     },
#                     }
#                 ]
#             }
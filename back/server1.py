from unittest import mock
from analyze import analyze_dataframe
from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from openai import OpenAI
import pandas as pd
import os
import json
import re
import time
from generateMock import generate_mock
from graph_helper import stream_graph_updates

app = Flask(__name__)
#
# 启用CORS，允许所有源访问（或你可以指定特定的源）
CORS(app)
UPLOAD_FOLDER = r'.\uploads'
MOCK = True

responses = [
    "你好，我是智能助手。",
    "你今天过得怎么样？",
    "今天天气真不错！",
    "我可以帮助你进行数据分析。",
    "你还需要其他帮助吗？",
    "这是一个有趣的问题，让我来思考一下。",
    "你的问题很有挑战性！",
    "我认为我们可以继续讨论这个话题。",
]
API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(
    # This is the default and can be omitted
    api_key=API_KEY
)
ROUND = 0


@app.route('/chat', methods=['POST'])
def chat():
    global ROUND
    if (MOCK):
        time.sleep(20)
        with open(r".\caseExperience\top_players_2023_24_regular.json", 'r', encoding='utf-8') as file:
            data_dict = json.load(file)
        graph_data = json.dumps(data_dict, ensure_ascii=False, indent=4)
        reply = """The analysis of the top three-point shooters and their related abilities highlights the exceptional performance of 8 players during the 2023-24 NBA season.  These players not only excel in three-point shooting but also demonstrate strong overall abilities in various aspects of the game, contributing significantly to their teams' success."""
        recommendation = ["""Consider analyzing the impact of these players' performances on their teams during the season.""",
                          """Explore the correlation between three-point shooting and other abilities such as assists and rebounds.""", "Compare these players' performances with other top players in the league.", "FINISH"]
        graphs_grammar = [
            {
                "name": 'BarVertical',
                "description": '不同支付方式的销售额趋势',
                "title": "Bar Chart of Players' Three Point Field Goal Percentage",
                "id": '111',
                "x": 'PLAYER',
                "y": 'FG3_PCT',
                "interactionType": 'filter_01',
                "interactionKey": 'PLAYER',
                "allowedInteractionType": 'filter_01',
                "tooltip": {
                    "open": True,
                    "text": 'The three point field goal Percentage of {x} is {y}.',
                },
            },
            {
                "name": 'BarVertical',
                "description": '不同支付方式的销售额趋势',
                "title": "Bar Chart of Players' Assists",
                "id": '222',
                # "meta": {
                #     "width": '45%',
                #     "height": '45%',
                #     "left": '3%',
                #     "top": '3%',
                # },
                "x": 'PLAYER',
                "y": 'AST',
                "interactionType": 'filter_01',
                "interactionKey": 'PLAYER',
                "allowedInteractionType": 'filter_01',
                "tooltip": {
                    "open": True,
                    "text": 'The assists of {x} is {y}.',
                },
            },

            {
                "name": 'BarVertical',
                "description": '不同支付方式的销售额趋势',
                "title": "Bar Chart of Players' Turnovers",
                "id": '333',
                # "meta": {
                #     "width": '45%',
                #     "height": '45%',
                #     "left": '3%',
                #     "top": '3%',
                # },
                "x": 'PLAYER',
                "y": 'TOV',
                "interactionType": 'filter_01',
                "interactionKey": 'PLAYER',
                "allowedInteractionType": 'filter_01',
                "tooltip": {
                    "open": True,
                    "text": 'The turnovers of {x} is {y}.',
                },
            },
            {
                "name": 'BarVertical',
                "description": '不同支付方式的销售额趋势',
                "title": "Bar Chart of Players' Assist to Turnover Ratio",
                "id": '444',
                "meta": {
                    "width": '45%',
                    "height": '45%',
                    "left": '3%',
                    "top": '3%',
                },
                "x": 'PLAYER',
                "y": 'AST_TOV',
                "interactionType": 'filter_01',
                "interactionKey": 'PLAYER',
                "allowedInteractionType": 'filter_01',
                "tooltip": {
                    "open": True,
                    "text": 'The assist to turnover ratio of {x} is {y}.',
                },
            },
        ]
        graph_layout = [{
            "id": "111",
            "meta": {
                "width": '45%',
                "height": '45%',
                "left": '2%',
                "top": '5%',
            },
        },
            {
            "id": "222",
            "meta": {
                "width": '45%',
                "height": '45%',
                "left": '55%',
                "top": '5%',
            },
        },
            {
            "id": "333",
            "meta": {
                "width": '45%',
                "height": '45%',
                "left": '5%',
                "top": '50%',
            },
        },
            {
            "id": "444",
            "meta": {
                "width": '45%',
                "height": '45%',
                "left": '55%',
                "top": '50%',
            },
        },
        ]

        return jsonify({
            'role': 'system',
            'status': '成功',
            'graph_data': graph_data,
            'reply': reply,
            'graphs_grammar': graphs_grammar,
            "recommendation": recommendation,
            "graph_layout": graph_layout
        })
        # if ROUND == 0:
        #     ROUND += 1
        #     return jsonify({
        #         'role': 'system',
        #         'status': '成功',
        #         'graph_data': "[]",
        #         'reply': "I have shown the history of the 10 players with the highest three-point percentage during the regular season.",
        #         'graphs_grammar': "[]",
        #         "recommendation": """["What is the most relevant to three-point shooting?", "What's the number of 3-pointers made?", "FINISH"]""",
        #         "graph_layout": "[]"
        #     })
        # if ROUND == 1:
        #     ROUND += 1
        #     return jsonify({
        #         'role': 'system',
        #         'status': '成功',
        #         'graph_data': "[]",
        #         'reply': "The playoffs are more important for a team to win the championship, and I showed the three-point shooting performance of these players in the playoffs. And the three-point shooting of these players in the postseason in recent years has shown.",
        #         'graphs_grammar': "[]",
        #         "recommendation": """["What else did they do in the playoffs?", "What other offensive stats are worth exploring?", "FINISH"]""",
        #         "graph_layout": "[]"
        #     })
        # if ROUND == 2:
        #     ROUND += 1
        #     return jsonify({
        #         'role': 'system',
        #         'status': '成功',
        #         'graph_data': "[]",
        #         'reply': "Creating fouls and assists are crucial offensive tactics in basketball games. I have displayed the performance of players with higher three-point shooting percentages using a scatter plot.",
        #         'graphs_grammar': "[]",
        #         "recommendation": """["What statistics are most associated with assists?", "What is their assist-to-turnover ratio?", "FINISH"]""",
        #         "graph_layout": "[]"
        #     })

    user_input = request.json.get("message", "")
    file_path = request.json.get("filePath", "")
    cur_graphs = request.json.get("graphConfig", "")
    if not isinstance(cur_graphs, str):
        cur_graphs = json.dumps(cur_graphs)
    file_path = os.path.join(UPLOAD_FOLDER, file_path)
    res = stream_graph_updates(
        user_input+". Don't use Scatter plot. Preserve an existing view.", file_path, cur_graphs)
    content_dict = res
    graph_data = content_dict.get('middle_dataframe', [])
    reply = content_dict.get('reply', 'No reply provided')
    graphs_grammar = content_dict.get(
        'graphs_grammar', [])
    recommendation = content_dict.get(
        'recommendation', [])
    graph_layout = content_dict.get(
        'graph_layout', [])
    converted_graph_layout = [
        {
            "id": layout.id,
            "description": layout.description,
            "meta": {
                "width": layout.meta.width,
                "height": layout.meta.height,
                "left": layout.meta.left,
                "top": layout.meta.top
            }
        }
        for layout in graph_layout
    ]

    return jsonify({
        'role': 'system',
        'status': '成功',
        'graph_data': graph_data,
        'reply': reply,
        'graphs_grammar': graphs_grammar,
        "recommendation": recommendation,
        "graph_layout": converted_graph_layout
    })
    # content_dict = json.loads(res.content)

    # return jsonify({
    #     'role': 'system',
    #     'status': '成功',
    #     'summary': content_dict["reply"],
    #     'analyze_result': content_dict["graphs_grammar"],
    #     'recommendation': content_dict["recommendation"]})

    # print("***************************************")
    # print(user_input)
    # print("***************************************")

    # gpt_resp = client.chat.completions.create(
    #     model='gpt-4o-mini',
    #     messages=user_input,
    #     timeout=30,
    #     n=1
    # )
    # print(gpt_resp)
    # clean_responce = ""
    # if gpt_resp.choices and gpt_resp.choices[0]:
    #     clean_responce: str = gpt_resp.choices[0].message.content.strip()
    # print("clean_responceclean_responceclean_responce")
    # print(clean_responce)
    # return jsonify({
    #     "role": "system",
    #     "content": clean_responce
    # })


@app.route('/preview', methods=['POST'])
def preview_file():
    print("previewpreviewpreviewpreviewpreview")
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    if file.filename.endswith('.csv'):
        df = pd.read_csv(file, encoding='ANSI')
    elif file.filename.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file)
    else:
        return jsonify({'error': '不支持的文件类型'}), 415

    # 将DataFrame转换为JSON列表
    json_data = df.to_dict(orient='records')

    return jsonify(json_data), 200


@app.route('/upload', methods=['POST'])
def upload_file():
    global ROUND
    # if (MOCK):
    #     time.sleep(1)
    #     return jsonify({
    #         'role': 'system',
    #         'status': '成功',
    #         'graph_data': "[]",
    #         'reply': "This dataset is an nba player performance dataset, what do you need?",
    #         'graphs_grammar': [],
    #         "recommendation": ["Explore the relationship between 3-point shooting percentage and free throw shooting percentage", "Explore the relationship between 3-point shooting percentage and rebounding", "FINISH"],
    #         "graph_layout": []
    #     })
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    file_path = request.form.get('filePath')
    file_path = os.path.join(UPLOAD_FOLDER, file_path)
    file.save(file_path)
    user_input = "I have uploaded the file, please describe the data yourself, mine some potential insights, and visualise them. Please just use Scatter ang give me one plot."
    cur_graphs = "[]"

    res = stream_graph_updates(user_input, file_path, cur_graphs)
    print("resresresresresresresresresresresresresresres")

    # try:
    #     # 尝试将 res.content 解析为 JSON
    #     content_dict = json.loads(res)

    #     # 如果解析成功，确保所需键存在
    #     reply = content_dict.get('reply', 'No reply provided')
    #     graphs_grammar = content_dict.get('graphs_grammar', [])
    #     recommendation = content_dict.get('recommendation', [])

    # except json.JSONDecodeError:
    #     # 如果解析失败，则假设 res.content 是纯文本
    #     content_dict = {
    #         'reply': res.content,
    #         'graphs_grammar': [],
    #         'recommendation': []
    #     }
    #     reply = res.content
    #     graphs_grammar = []
    #     recommendation = []
    #     return jsonify({'status': '成功',
    #                     'summary': res.content,
    #                     'analyze_result': [],
    #                     'recommendation': []})

    content_dict = res
    graph_data = content_dict.get('middle_dataframe', [])
    reply = content_dict.get('reply', 'No reply provided')
    graphs_grammar = content_dict.get(
        'graphs_grammar', [])
    recommendation = content_dict.get(
        'recommendation', [])
    graph_layout = content_dict.get(
        'graph_layout', [])
    # graphs_grammar["data"] = graph_data
    # graphs_grammar["id"] = graph_id
    # graphs_grammar = json.dumps(graphs_grammar)
    # recommendation = content_dict.get('recommendation', [])
    # reserve_charts_ids = content_dict.get('reserve_charts_ids', [])
    converted_graph_layout = [
        {
            "id": layout.id,
            "description": layout.description,
            "meta": {
                "width": layout.meta.width,
                "height": layout.meta.height,
                "left": layout.meta.left,
                "top": layout.meta.top
            }
        }
        for layout in graph_layout
    ]
    print({
        'role': 'system',
        'status': '成功',
        'reply': reply,
        'graphs_grammar': graphs_grammar,
        "recommendation": recommendation,
        "graph_layout": converted_graph_layout
    })

    return jsonify({
        'role': 'system',
        'status': '成功',
        'graph_data': graph_data,
        'reply': reply,  # string
        'graphs_grammar': graphs_grammar,  # dict[]
        "recommendation": recommendation,  # str[]
        "graph_layout": converted_graph_layout  # dict[]
    })


    # except Exception as e:
    #     return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)

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
ROUND = 1


@app.route('/chat', methods=['POST'])
def chat():
    global ROUND
    user_input = request.json.get("message", "")
    file_path = request.json.get("filePath", "")
    cur_graphs = request.json.get("graphConfig", "")
    if not isinstance(cur_graphs, str):
        cur_graphs = json.dumps(cur_graphs)
    file_path = os.path.join(UPLOAD_FOLDER, file_path)
    if (MOCK):
        time.sleep(1)
        return jsonify({
            'role': 'system',
            'status': '成功',
            'graph_data': "[]",
            'reply': "reply",
            'graphs_grammar': "[]",
            "recommendation": """["a", "b", "c"]""",
            "graph_layout": "[]"
        })

    res = stream_graph_updates(user_input, file_path, cur_graphs)
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

    try:
        # 基于文件扩展名使用合适的读取方法
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return jsonify({'error': '不支持的文件类型'}), 415

        # 将DataFrame转换为JSON列表
        json_data = df.to_dict(orient='records')

        return jsonify(json_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/upload', methods=['POST'])
def upload_file():
    global ROUND
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    file_path = request.form.get('filePath')
    file_path = os.path.join(UPLOAD_FOLDER, file_path)
    file.save(file_path)
    user_input = "我上传了文件，请你首先先自行描述一下数据，挖掘一些潜在的insight"
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
        'reply': reply,
        'graphs_grammar': graphs_grammar,
        "recommendation": recommendation,
        "graph_layout": converted_graph_layout
    })


    # except Exception as e:
    #     return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)

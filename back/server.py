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
client = OpenAI(
    # This is the default and can be omitted
    api_key=API_KEY
)
ROUND = 1


@app.route('/chat', methods=['POST'])
def chat():
    global ROUND
    user_input = request.json.get("message", "")
    print("***************************************")
    print(user_input)
    print("***************************************")

    if (MOCK):
        mock_res = generate_mock(ROUND)
        ROUND += 1
        summary = mock_res['summary']
        result = mock_res['result']
        recommendation = mock_res['recommendation']
        return jsonify({
            "role": "assistant",
            "content": summary,
            "draw_graph": result
        })

    gpt_resp = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=user_input,
        timeout=30,
        n=1
    )
    print(gpt_resp)
    clean_responce = ""
    if gpt_resp.choices and gpt_resp.choices[0]:
        clean_responce: str = gpt_resp.choices[0].message.content.strip()
    print("clean_responceclean_responceclean_responce")
    print(clean_responce)
    return jsonify({
        "role": "system",
        "content": clean_responce
    })


@app.route('/upload', methods=['POST'])
def upload_file():
    global ROUND
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    chat_content = request.form.get('chatContent')
    if chat_content:
        try:
            chat_content = json.loads(chat_content)  # 将 JSON 字符串转换为字典
        except json.JSONDecodeError:
            return jsonify({'error': 'chatContent 格式错误'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    if MOCK:

        df = pd.read_excel(file_path)
        columns = [{'title': col, 'dataType': str(
            df[col].dtype)} for col in df.columns]
        mock_res = generate_mock(ROUND)
        ROUND += 1
        summary = mock_res['summary']
        result = mock_res['result']
        recommendation = mock_res['recommendation']
        return jsonify({'status': '成功',
                        'columns': columns,
                        'data': df.head().to_dict(orient='records'),
                        'summary': summary,
                        'analyze_result': result,
                        'recommendation': recommendation})

    # try:
    # 使用pandas读取excel文件
    df = pd.read_excel(file_path)
    analyze_result = analyze_dataframe(df, client)
    print("analyze_result,analyze_result,analyze_result")

    json_str_match = re.search(
        r'```json\n(.*?)\n```', analyze_result, re.DOTALL)
    if json_str_match:
        json_str = json_str_match.group(1)  # 提取 JSON 字符串
        analyze_data = json.loads(json_str)  # 将 JSON 字符串解析为字典

        # 输出结果以确认解析是否成功
        print("Summary:", analyze_data.get("summary"))
        print("Result:", analyze_data.get("result"))
        print("Recommendation:", analyze_data.get("recommendation"))
    else:
        print("No JSON content found in analyze_result['content'].")
    print(analyze_result)
    print("**************************************")
    print(json_str_match)
    print(000000000000000000000000000)
    analyze_data = json.loads(json_str_match)
    print(111111111111)
    print(analyze_data)
    # 提取字段
    summary = analyze_data.get("summary", "")
    result = analyze_data.get("result", [])
    recommendation = analyze_data.get("recommendation", [])
    print(222222222222222)

    # 获取列名和列的数据类型
    columns = [{'title': col, 'dataType': str(
        df[col].dtype)} for col in df.columns]
    print(3333333333333333333)

    # 返回列名和列的数据类型
    return jsonify({'status': '成功',
                    'columns': columns,
                    'data': df.head().to_dict(orient='records'),
                    'summary': summary,
                    'analyze_result': result,
                    'recommendation': recommendation})
    # except Exception as e:
    #     return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

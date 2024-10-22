from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from openai import OpenAI
import pandas as pd
import os
app = Flask(__name__)
# 启用CORS，允许所有源访问（或你可以指定特定的源）
CORS(app)
UPLOAD_FOLDER = r'.\uploads'
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


@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get("message", "")
    print("***************************************")
    print(user_input)
    print("***************************************")

    # 随机选择一个回复
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

    return jsonify({
        "role": user_input,
        "content": clean_responce
    })


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # 使用pandas读取excel文件
        df = pd.read_excel(file_path)

        # 获取列名和列的数据类型
        columns = [{'title': col, 'dataType': str(
            df[col].dtype)} for col in df.columns]

        # 返回列名和列的数据类型
        return jsonify({'status': '成功', 'columns': columns, 'data': df.head().to_dict(orient='records')})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

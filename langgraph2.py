import os
from openai import OpenAI
client = OpenAI(
    # This is the default and can be omitted
    api_key=os.getenv("OPENAI_API_KEY"),
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Say this is a test",
        }
    ],
    model="gpt-4o",
)

print(chat_completion.choices[0].message.content)
# os.environ["OPENAI_API_KEY"] = "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"
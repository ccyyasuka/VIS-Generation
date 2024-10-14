import React, { useEffect, useState } from 'react'
import style from './chat.module.css'
import { Input, Button, Card, Avatar } from 'antd'

function Chat() {
  const [chatContent, setChatContent] = useState([
    { role: 'system', content: '你好，请问你是谁' },
    { role: 'assistant', content: '我是你的智能可视化分析助手' },
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSend = async () => {
    if (inputValue.trim() === '') return

    const newChat = { role: 'system', content: inputValue }

    // 更新用户输入
    setChatContent((prev) => [...prev, newChat])
    setInputValue('')

    try {
      // 向后端发送请求，获取机器人的回复
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: [...chatContent, newChat] }), // 发送完整聊天记录
      })
      const data = await response.json()
      const botResponse = { role: 'assistant', content: data.content }

      // 更新机器人回复
      setChatContent((prev) => [...prev, botResponse])
    } catch (error) {
      console.error('Error fetching response:', error)
    }
  }

  return (
    <div className={style.main}>
      <div className={style.head}>对话框</div>
      <div className={style.talkFrame}>
        {chatContent.map((content, index) =>
          content.role === 'system' ? (
            <div
              key={index}
              className={style.talk}
              style={{ marginLeft: 'auto' }}>
              <Card style={{ width: 200 }}>
                <p>{content.content}</p>
              </Card>
              <Avatar src="https://api.dicebear.com/9.x/adventurer/svg?seed=Kiki" />
            </div>
          ) : (
            <div
              key={index}
              className={style.talk}
              style={{ marginRight: 'auto' }}>
              <Avatar src="https://robohash.org/yixingzhang" />
              <Card style={{ width: 200 }}>
                <p>{content.content}</p>
              </Card>
            </div>
          )
        )}
      </div>
      <div className={style.ques}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSend}
        />
        <Button type="primary" onClick={handleSend}>
          发送
        </Button>
      </div>
    </div>
  )
}

export default Chat

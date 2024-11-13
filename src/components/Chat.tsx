import React, { useState } from 'react'
import style from './chat.module.css'
import { Input, Button, Card, Avatar } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from './redux/store'
import { sendChatMessage } from './redux/dataSlice'

function Chat() {
  const [inputValue, setInputValue] = useState('')
  const dispatch = useDispatch<AppDispatch>()
  const { loading, chatContent } = useSelector((state: any) => state.data)
  console.log('chatContentchatContent', chatContent)

  const handleSend = () => {
    if (inputValue.trim() === '') return
    dispatch(sendChatMessage(inputValue))
    setInputValue('') // Clear the input field after sending
  }

  return (
    <div className={style.main}>
      <div className={style.head}>对话框</div>
      <div className={style.talkFrame}>
        {chatContent.map(
          (curContent: { role: string; content: string }, index: number) =>
            curContent.role === 'system' ? (
              <div
                key={index}
                className={style.talk}
                style={{ marginLeft: 'auto' }}>
                <Card style={{ width: 200 }}>
                  <p>{curContent.content}</p>
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
                  <p>{curContent.content}</p>
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
        <Button type="primary" onClick={handleSend} loading={loading}>
          发送
        </Button>
      </div>
    </div>
  )
}

export default Chat

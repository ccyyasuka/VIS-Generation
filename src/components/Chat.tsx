import React, { useState, useRef, useEffect } from 'react'
import style from './chat.module.css'
import { Input, Button, Card, Avatar } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from './redux/store'
import { sendChatMessage, updateKV } from './redux/dataSlice'

function Chat() {
  const [inputValue, setInputValue] = useState('')
  const dispatch = useDispatch<AppDispatch>()
  const { loading, chatContent } = useSelector((state: any) => state.data)
  console.log('chatContentchatContent', chatContent)
  const talkFrameRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    console.log('talkFrameRef.current', talkFrameRef.current)
    if (talkFrameRef.current) {
      console.log(
        'talkFrameRef.current',
        talkFrameRef.current.scrollTop,
        talkFrameRef.current.scrollHeight
      )
      talkFrameRef.current.scrollTop = talkFrameRef.current.scrollHeight
    }
  }
  const handleSend = () => {
    if (inputValue.trim() === '') return
    chatContent[chatContent.length-1].recommendation=[]
    dispatch(updateKV({
      chatContent: chatContent
    }))
    dispatch(sendChatMessage(inputValue))
    
    
    setInputValue('') // Clear the input field after sending
    scrollToBottom()
  }
  useEffect(() => {
    scrollToBottom()
  }, [chatContent])

  return (
    <div className={style.main}>
      <div className={style.head}>对话框</div>
      <div className={style.talkFrame} ref={talkFrameRef}>
        {chatContent.map(
          (
            curContent: {
              role: string
              summary: string
              recommendation?: string[]
            },
            index: number
          ) =>
            curContent.role === 'user' ? (
              <div
                key={index}
                className={style.talk}
                style={{ marginLeft: 'auto' }}>
                <Card style={{ width: 200 }}>
                  <p>{curContent.summary}</p>
                </Card>
                <Avatar src="https://api.dicebear.com/9.x/adventurer/svg?seed=Kiki" />
              </div>
            ) : (
              <div
                key={index}
                className={style.talk}
                style={{ marginRight: 'auto' }}>
                <Avatar src="https://robohash.org/yixingzhang" />
                <div className={style.cardsWrapper}>
                  <Card style={{ width: 200 }}>
                    <p>{curContent.summary}</p>
                  </Card>
                  {curContent.recommendation && (
                    <div style={{ marginTop: '10px' }}>
                      {curContent.recommendation.map((recom, i) => (
                        <Card
                          onClick={() => setInputValue(recom)}
                          hoverable={true}
                          key={i}
                          style={{ width: 100, marginTop: '5px' }}>
                          <p>{recom}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
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

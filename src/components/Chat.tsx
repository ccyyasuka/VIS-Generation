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
    // chatContent[chatContent.length-1].recommendation=[]
    // dispatch(updateKV({
    //   chatContent: chatContent
    // }))
    dispatch(sendChatMessage(inputValue))

    setInputValue('') // Clear the input field after sending
    scrollToBottom()
  }
  useEffect(() => {
    scrollToBottom()
  }, [chatContent])

  return (
    <div className={style.main}>
      <div className={style.head}>Chat View</div>
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
                style={{
                  marginLeft: 'auto',
                  width: '100%',
                  justifyContent: 'flex-end',
                }}>
                <div className={style.chatCard + ' ' + style.chatCardUser}>
                  {curContent.summary}
                </div>
                <Avatar src="https://api.dicebear.com/9.x/adventurer/svg?seed=Kiki" />
              </div>
            ) : (
              <div
                key={index}
                className={style.talk}
                style={{
                  marginRight: 'auto',
                  width: '100%',
                  justifyContent: 'flex-start',
                }}>
                <Avatar src="https://robohash.org/yixingzhang" />
                <div className={style.cardsWrapper}>
                  {/* <Card style={{ width: 200 }}>
                    <p>{curContent.summary}</p>
                  </Card> */}
                  <div className={style.chatCard + ' ' + style.chatCardBot}>
                    {curContent.summary}
                  </div>
                  {curContent.recommendation &&
                    curContent.recommendation.length > 0 && (
                      <div>
                        {curContent.recommendation.map((recom, i) => (
                          <div
                            className={
                              style.chatCard + ' ' + style.chatCardRecom
                            }
                            onClick={() => setInputValue(recom)}
                            key={i}>
                            {recom}
                          </div>
                          // <Card
                          //   onClick={() => setInputValue(recom)}
                          //   hoverable={true}
                          //   key={i}
                          //   style={{ width: 100, marginTop: '5px' }}>
                          //   <p>{recom}</p>
                          // </Card>
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
          Send
        </Button>
      </div>
    </div>
  )
}

export default Chat

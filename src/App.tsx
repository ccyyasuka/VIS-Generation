import React, { useState, useRef, useEffect } from 'react'
import logo from './logo.svg'
import style from './App.module.css'
import MainView from './components/MainView'
import Chat from './components/Chat'
import Upload from './components/Upload'
import { TableView } from './components/Table'
import { Provider } from 'react-redux'
// import { store } from './components/plots/redux/store'
import store from './components/redux/store'
function App() {
  const [offset, setOffset] = useState({ left: '0px', top: '0px' })
  const appRef = useRef<HTMLDivElement | null>(null) // 引用整个 app 容器
  const mainViewRef = useRef<HTMLDivElement | null>(null) // 引用 MainView 容器
  useEffect(() => {
    if (appRef.current && mainViewRef.current) {
      const appRect = appRef.current.getBoundingClientRect()
      const mainViewRect = mainViewRef.current.getBoundingClientRect()

      // 计算 MainView 相对于 APP 的偏移
      setOffset({
        left: `${mainViewRect.left - appRect.left}px`,
        top: `${mainViewRect.top - appRect.top}px`,
      })
    }
  }, [])
  console.log('offsetoffsetoffset', offset)
  return (
    <div className={style.app} ref={appRef}>
      <Provider store={store}>
        <div className={style.file}>
          <div className={style.controlBar} ref={mainViewRef}>
            <Upload />
          </div>

          <div className={style.table} ref={mainViewRef}>
            <TableView></TableView>
          </div>
        </div>
        <div className={style.middle}>
          <div className={style.mainView} ref={mainViewRef}>
            <MainView offset={offset} />
          </div>
        </div>

        <div className={style.chat}>
          <Chat />
        </div>
      </Provider>
    </div>
  )
}

export default App

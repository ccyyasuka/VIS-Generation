import React from 'react'
import logo from './logo.svg'
import style from './App.module.css'
import MainView from './components/MainView'
import Chat from './components/Chat'
import Upload from './components/Upload'
import { Provider } from 'react-redux'
// import { store } from './components/plots/redux/store'
import store from './components/redux/store'
function App() {
  return (
    <div className={style.app}>
      <Provider store={store}>
        <div className={style.file}>
          <Upload />
        </div>
        <div className={style.chat}>
          <Chat />
        </div>
        <div className={style.mainView}>
          <MainView />
        </div>
      </Provider>
    </div>
  )
}

export default App

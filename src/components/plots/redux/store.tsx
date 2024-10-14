// store.tsx
// import { createStore, combineReducers, applyMiddleware } from 'redux';
// import messageReducer from './reducer/messageReducer';

// const rootReducer = combineReducers({
// 	message: messageReducer,
// });
// export type AppState = ReturnType<typeof rootReducer>;

// export const store = createStore(rootReducer);

import React, { ReactNode } from 'react'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import messageReducer from './reducer/messageReducer'
import { Provider } from 'react-redux'
const rootReducer = combineReducers({
  message: messageReducer,
})
export type AppState = ReturnType<typeof rootReducer>

// 创建单例模式的 store
let store: ReturnType<typeof createStore> | undefined

export const initializeStore = () => {
  if (!store) {
    store = createStore(rootReducer)
  }
  return store
}
export const ReduxProviderWrapper = ({ children }: { children: ReactNode }) => {
  const storeInstance = initializeStore() // 调用 store 单例
  return <Provider store={storeInstance}>{children}</Provider>
}

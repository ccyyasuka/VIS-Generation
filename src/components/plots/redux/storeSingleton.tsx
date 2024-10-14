import { createStore } from 'redux';
import { combineReducers } from 'redux';
import messageReducer from './reducer/messageReducer';
import { Provider } from 'react-redux';
import React, { ReactNode } from 'react';

// 生成 store 的单例
let store: any;

const rootReducer = combineReducers({
  plot: messageReducer,
});

const initializeStore = () => {
  if (!store) {
    store = createStore(rootReducer);
  }
  return store;
};

// 包装每个组件时，自动提供 Redux store
export const ReduxProviderWrapper = ({ children }: { children: ReactNode }) => {
  const storeInstance = initializeStore();
  return <Provider store={storeInstance}>{children}</Provider>;
};

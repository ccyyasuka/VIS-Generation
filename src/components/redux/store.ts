import { createStore, applyMiddleware, combineReducers } from 'redux'
import { thunk } from 'redux-thunk' // 显式导入 thunk
import dataReducer from './dataSlice'

const rootReducer = combineReducers({
  data: dataReducer,
})

const store = createStore(rootReducer, applyMiddleware(thunk))

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch

export default store

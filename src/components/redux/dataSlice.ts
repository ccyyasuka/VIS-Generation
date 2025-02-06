import { Dispatch } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { RootState } from './store'
import { uuid } from '../tools'
// 定义 State 类型
export interface DataState {
  iniData: any
  originData:any
  selectColumns: string[]
  selectedRows: string[]
  dataPath: string
  loading: boolean
  error: string | null
  chatContent: { role: string; summary: string }[]
  selectedData: any
  config: any
}

// 初始状态
const initialState: DataState = {
  iniData: [],
  originData: null,
  selectColumns: [],
  selectedRows: [],
  dataPath: '',
  loading: false,
  error: null,
  chatContent: [
    { role: 'user', summary: '你好，请问你是谁' },
    { role: 'assistant', summary: '我是你的智能可视化分析助手' },
  ],
  selectedData: null,
  config: null,
}

// Action Type
const UPDATE_KV = 'data/updateKV'
const UPDATE_CONFIG_POSITION = 'data/updateConfigPosition'
// 通用 Action Creator
export const updateKV = (updates: Record<string, any>) => ({
  type: UPDATE_KV,
  payload: updates,
})
export const updateConfigPosition = (
  id: string,
  left: string,
  top: string
) => ({
  type: UPDATE_CONFIG_POSITION,
  payload: { id, left, top },
})
// Thunk Action：用于上传文件并设置 iniData
export const uploadFileAndSetData = (
  file: File
): ThunkAction<
  Promise<{ status: string; data: any }>,
  RootState,
  unknown,
  any
> => {
  return async (dispatch: Dispatch, getState: () => { data: DataState }) => {
    dispatch(updateKV({ loading: true, error: null }))
    const newChat = { role: 'user', summary: '上传了文件' }

    try {
      const { chatContent } = getState().data
      dispatch(
        updateKV({
          loading: true,
          error: null,
          chatContent: [...chatContent, newChat],
        })
      )
      const [pureName, kuozhan] = file.name.split('.')

      const filePath = pureName + '-' + uuid() + '.' + kuozhan
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filePath', filePath)
      const previewResponse = await fetch('http://localhost:5000/preview', {
        method: 'POST',
        body: formData,
      })
      if (!previewResponse.ok) {
        throw new Error('上传失败')
      }
      let originData = await previewResponse.json()
      console.log('selectedData0205', originData)
      dispatch(
        updateKV({
          originData: originData,
        })
      )

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      console.log('response.jsonresponse.jsonresponse.json', data)
      const {
        status,
        columns,
        data: dataSelf,
        summary: summary,
        analyze_result: analyzeResult,
        recommendation: recommendation,
        analyze_data:analyzeData
      } = data
      dispatch(
        updateKV({
          loading: false,
          iniData: { status, columns, dataSelf },
          chatContent: [
            ...chatContent,
            newChat,
            { role: 'assistant', summary: summary, recommendation:recommendation },
          ],
          selectedData:analyzeData,
          config: analyzeResult,
          dataPath:filePath
        })
      )
      return { status: '成功', data }
    } catch (error) {
      dispatch(
        updateKV({
          loading: false,
          error: (error as Error).message || '文件上传失败',
        })
      )
      return Promise.reject(error)
    }
  }
}

// Thunk Action: 发送对话消息
export const sendChatMessage = (inputValue: string) => {
  return async (dispatch: Dispatch, getState: () => { data: DataState }) => {
    try {
      const { chatContent,dataPath } = getState().data
      const newChat = { role: 'user', summary: inputValue }
      dispatch(
        updateKV({
          loading: true,
          error: null,
          chatContent: [...chatContent, newChat],
        })
      )

      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue,filePath:dataPath }),
      })

      const data = await response.json()
      console.log('datadatadatadatadata000000', data)
      dispatch(
        updateKV({
          loading: false,
          chatContent: [...chatContent, newChat, data],
          config: data.draw_graph,
          selectedData:data.analyze_data,
        })
      )
    } catch (error) {
      dispatch(updateKV({ loading: false, error: '发送消息失败' }))
    }
  }
}

// Reducer
const dataReducer = (state = initialState, action: any): DataState => {
  switch (action.type) {
    case UPDATE_KV:
      return {
        ...state,
        ...action.payload, // 批量更新状态
      }
    case UPDATE_CONFIG_POSITION:
      const { id, left, top } = action.payload
      return {
        ...state,
        config: state.config.map((item: any) =>
          item?.id === id
            ? {
                ...item,
                meta: {
                  ...item.meta,
                  left,
                  top,
                },
              }
            : item
        ),
      }
    default:
      return state
  }
}

export default dataReducer

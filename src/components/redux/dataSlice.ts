import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// 定义 State 类型
export interface DataState {
  iniData: any
  selectColumns: string[]
  selectedRows: string[]
  dataPath: string
  loading: boolean
  error: string | null
  chatContent: { role: string; content: string }[] // 管理 chatContent
  selectedData: any
  config: any
}

// 初始状态
const initialState: DataState = {
  iniData: [],
  selectColumns: [],
  selectedRows: [],
  dataPath: '',
  loading: false,
  error: null,
  chatContent: [
    // 初始化对话内容
    { role: 'system', content: '你好，请问你是谁' },
    { role: 'assistant', content: '我是你的智能可视化分析助手' },
  ],
  selectedData: [
    { label: '2022', value: 20 },
    { label: '2023', value: 10 },
    { label: '2024', value: 60 },
  ],
  config: undefined,
}

// 异步的 thunk action，用于获取初始数据
// export const fetchIniData = createAsyncThunk('data/fetchIniData', async () => {
//   const response = await fetch('https://api.example.com/data')
//   const data = await response.json()
//   return data
// })

// 异步的 thunk action，用于上传文件并设置iniData
export const uploadFileAndSetData = createAsyncThunk(
  'data/uploadFileAndSetData',
  async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const data = await response.json()
    return data
  }
)

// Thunk to send a chat message and handle response
export const sendChatMessage = createAsyncThunk(
  'data/sendChatMessage',
  async (inputValue: string, { getState }) => {
    const { chatContent } = (getState() as { data: DataState }).data
    const newChat = { role: 'system', content: inputValue }

    const response = await fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: [...chatContent, newChat] }),
    })

    const data = await response.json()

    return {
      newChat,
      botResponse: {
        role: data.role,
        content: data.content,
      },
      drawGraph: data.draw_graph,
    }
  }
)

// 创建 Slice
const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setSelectColumns(state, action: PayloadAction<string[]>) {
      state.selectColumns = action.payload
    },
    setSelectedRows(state, action: PayloadAction<string[]>) {
      state.selectedRows = action.payload
    },
    setChatContent(
      state,
      action: PayloadAction<{ role: string; content: string }[]>
    ) {
      state.chatContent = action.payload
    },
    // 添加 setSelectedData action
    setSelectedData(state, action: PayloadAction<any[]>) {
      // state.selectedData = action.payload
    },
  },
  extraReducers: (builder) => {
    // 文件上传
    builder
      .addCase(uploadFileAndSetData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        uploadFileAndSetData.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.loading = false
          state.iniData = action.payload
        }
      )
      .addCase(uploadFileAndSetData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '文件上传失败'
      })

    // 发送对话消息
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false
        console.log('actionactionaction000', action.payload.newChat,
        action.payload.botResponse,)
        state.chatContent = [
          ...state.chatContent,
          action.payload.newChat,
          action.payload.botResponse,
        ]
        state.config = action.payload.drawGraph
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '发送消息失败'
      })
  },
})

export const {
  setSelectColumns,
  setSelectedRows,
  setChatContent,
  setSelectedData,
} = dataSlice.actions

export default dataSlice.reducer

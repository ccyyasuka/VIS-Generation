import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface DataState {
  iniData: any
  selectColumns: string[]
  selectedRows: string[]
  loading: boolean
  error: string | null
}

const initialState: DataState = {
  iniData: [],
  selectColumns: [],
  selectedRows: [],
  loading: false,
  error: null,
}

// 异步的 thunk action，用于获取数据
export const fetchIniData = createAsyncThunk('data/fetchIniData', async () => {
  // 假设从 API 获取数据
  const response = await fetch('https://api.example.com/data')
  const data = await response.json()
  return data // 这个返回值会传递给 fulfilled 的 action
})

// 异步的 thunk action，用于上传文件并设置iniData
export const uploadFileAndSetData = createAsyncThunk(
  'data/uploadFileAndSetData',
  async (file: File) => {
    console.log('aaaaa')
    const formData = new FormData()
    formData.append('file', file)

    // 发起 POST 请求上传文件
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const data = await response.json()
    return data // 返回的数据会传递给 fulfilled 的 action
  }
)

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
  },
  // 处理异步操作的额外 reducer
  extraReducers: (builder) => {
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
          console.log('action.payload', action.payload)
        }
      )
      .addCase(uploadFileAndSetData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '文件上传失败'
      })
  },
})
export const { setSelectColumns, setSelectedRows } = dataSlice.actions

export default dataSlice.reducer

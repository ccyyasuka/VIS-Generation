import React, { useState, ChangeEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadFileAndSetData } from './redux/dataSlice'
import { AppDispatch } from './redux/store' // 导入 AppDispatch 类型
// import { DataState } from './redux/dataSlice'
function Upload() {
  // 使用指定了类型的 dispatch
  const dispatch = useDispatch<AppDispatch>()
  const [file, setFile] = useState<File | null>(null)
  const parseData = useSelector((state: any) => state.data.iniData).data
  console.log('parseData', parseData)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null
    setFile(selectedFile)
  }

  const handleUpload = () => {
    if (!file) {
      alert('请上传文件')
      return
    }
    // 使用带有类型的 dispatch 来处理异步 action
    dispatch(uploadFileAndSetData(file))
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
      <button onClick={handleUpload}>上传Excel</button>
      {parseData && (
        <div>{(parseData as Array<string>).map((item) => <div>{item.toString()}</div>)}</div>
      )}
    </div>
  )
}

export default Upload

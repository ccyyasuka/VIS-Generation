import React, { useState, ChangeEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadFileAndSetData } from './redux/dataSlice'
import { AppDispatch } from './redux/store' // 导入 AppDispatch 类型
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps, RadioChangeEvent } from 'antd'
import { message, Upload, Table, Radio, Space } from 'antd'
// import { DataState } from './redux/dataSlice'
const { Dragger } = Upload

function FileUpload() {
  // 使用指定了类型的 dispatch
  const dispatch = useDispatch<AppDispatch>()
  const [file, setFile] = useState<File | null>(null)
  const parseData = useSelector((state: any) => state.data.iniData).data
  const [columns, setColumns] = useState<{ title: string; dataType: string }[]>(
    []
  )
  const [formattedColumns, setFormattedColumns] = useState<
    { title: string; dataIndex: string; key: string }[]
  >([])
  const [data, setData] = useState<object[]>([])
  const columnsForDetails = [
    { title: '列名', dataIndex: 'title', key: 'title' },
    { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
  ]
  const [viewMode, setViewMode] = useState<'字段详情' | '数据概览'>('字段详情')

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
  const handleViewModeChange = (e: RadioChangeEvent) => {
    setViewMode(e.target.value)
  }

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: ({ file, onSuccess, onError, onProgress }) => {
      dispatch(uploadFileAndSetData(file as File))
        .unwrap()
        .then((result) => {
          if (result.status === '成功') {
            message.success('文件上传成功')
            // 设置表格列和数据
            const curFormattedColumns = result.columns.map((col: any) => ({
              title: col.title,
              dataIndex: col.title, // 根据列名绑定数据索引
              key: col.title,
            }))
            setFormattedColumns(curFormattedColumns)
            setColumns(result.columns)
            setData(result.data)
            // debugger
            console.log(result.columns)
            console.log(result.data)
            onSuccess?.({ code: '200' })
            onProgress?.({ percent: 100 })
          } else {
            message.error('文件上传失败')
            onError?.(new Error('上传失败'))
          }
        })
        .catch(() => {
          onError?.(new Error('上传失败'))
          message.error('文件上传失败')
        })
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    progress: {
      strokeColor: {
        '0%': '#108ee9',
        '100%': '#87d068',
      },
      strokeWidth: 3,
      format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
    },
  }

  return (
    <div>
      <Space direction="vertical" size="large">
        {/* 切换栏 */}
        <Radio.Group value={viewMode} onChange={handleViewModeChange}>
          <Radio.Button value="字段详情">字段详情</Radio.Button>
          <Radio.Button value="数据概览">数据概览</Radio.Button>
        </Radio.Group>

        {/* 上传区域 */}
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        </Dragger>

        {/* 表格显示，根据viewMode展示不同的内容 */}
        {viewMode === '字段详情' ? (
          <Table
            columns={columnsForDetails}
            dataSource={columns}
            rowKey="title"
          />
        ) : (
          <Table columns={formattedColumns} dataSource={data} rowKey="id" />
        )}
      </Space>
    </div>
  )
}

export default FileUpload

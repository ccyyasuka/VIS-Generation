import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadFileAndSetData, updateKV } from './redux/dataSlice'
import { AppDispatch } from './redux/store'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps, RadioChangeEvent } from 'antd'
import { message, Upload, Table, Radio, Space, Button } from 'antd'
import type { TableProps } from 'antd'

const { Dragger } = Upload
type TableRowSelection<T extends object = object> =
  TableProps<T>['rowSelection']

function FileUpload() {
  const dispatch = useDispatch<AppDispatch>()
  const iniData = useSelector((state: any) => state.data.iniData)
  const [viewMode, setViewMode] = useState<'字段详情' | '数据概览'>('字段详情')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const columnsForOverview = [
    { title: '列名', dataIndex: 'title', key: 'title' },
    { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
  ]

  const columnsForDetail = iniData?.data?.[0]
    ? Object.keys(iniData.data[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key,
      }))
    : []

  const handleViewModeChange = (e: RadioChangeEvent) => {
    setViewMode(e.target.value)
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys)
  }

  const rowSelection: TableRowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  }

  const handleJsonFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string)
        dispatch(
          updateKV({
            selectedData: content.data,
            config: content.curConfig,
          })
        )
        message.success('JSON 数据加载成功')
      } catch (error) {
        message.error('加载 JSON 数据时出错')
      }
    }

    reader.readAsText(file)
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      try {
        const result = await dispatch(uploadFileAndSetData(file as File) as any)
        if (result.status === '成功') {
          message.success('文件上传成功')
          onSuccess?.({ code: '200' })
          onProgress?.({ percent: 100 })
        } else {
          message.error('文件上传失败')
          onError?.(new Error('上传失败'))
        }
      } catch (error) {
        message.error('文件上传失败')
        onError?.(error as Error)
      }
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

  const handleSelectData = () => {
    const filteredData = iniData.dataSelf.filter((item: any) =>
      selectedRowKeys.includes(item.label)
    )
    dispatch(updateKV({ selectedData: filteredData }))
    message.success('数据已选择')
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
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        </Dragger>

        {/* 表格显示 */}
        {viewMode === '字段详情' ? (
          <Table
            rowSelection={rowSelection}
            columns={columnsForOverview}
            dataSource={iniData.columns}
            rowKey="title"
          />
        ) : (
          <Table
            columns={columnsForDetail}
            dataSource={iniData.dataSelf}
            rowKey="title"
          />
        )}

        {/* 选择按钮 */}
        <Button type="primary" onClick={handleSelectData}>
          选择
        </Button>
        <Button
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            // 使用 addEventListener 来绑定事件，确保正确的事件类型
            input.addEventListener('change', handleJsonFileSelect)
            input.click()
          }}
          type="primary"
          style={{ marginTop: '20px' }}>
          加载 JSON 配置
        </Button>
      </Space>
    </div>
  )
}

export default FileUpload

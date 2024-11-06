import React, { useState, ChangeEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadFileAndSetData, setSelectedData } from './redux/dataSlice' // 导入 setSelectedData action
import { AppDispatch } from './redux/store' // 导入 AppDispatch 类型
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps, RadioChangeEvent } from 'antd'
import { message, Upload, Table, Radio, Space, Button } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { concat } from 'lodash'

const { Dragger } = Upload
type TableRowSelection<T extends object = object> =
  TableProps<T>['rowSelection']

function FileUpload() {
  const dispatch = useDispatch<AppDispatch>()
  const [file, setFile] = useState<File | null>(null)
  const iniData = useSelector((state: any) => state.data.iniData) // 获取iniData
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const columnsForOverview = [
    { title: '列名', dataIndex: 'title', key: 'title' },
    { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
  ]
  const columnsForDetail = []
  if (iniData?.data?.[0]) {
    for (let item of Object.keys(iniData.data[0])) {
      columnsForDetail.push({ title: item, dataIndex: item })
    }
  }

  const [viewMode, setViewMode] = useState<'字段详情' | '数据概览'>('字段详情')

  const handleViewModeChange = (e: RadioChangeEvent) => {
    setViewMode(e.target.value)
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log('newSelectedRowKeys', newSelectedRowKeys)
    setSelectedRowKeys(newSelectedRowKeys)
  }

  const rowSelection: TableRowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  }

  // 上传的 props
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    customRequest: ({ file, onSuccess, onError, onProgress }) => {
      dispatch(uploadFileAndSetData(file as File))
        .unwrap()
        .then((result) => {
          if (result.status === '成功') {
            message.success('文件上传成功')
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

  // 点击 "选择" 按钮时筛选数据
  const handleSelectData = () => {
    // 使用 selectedRowKeys 从 iniData 中筛选出匹配的数据
    const filteredData = iniData.data.filter((item: any) =>
      selectedRowKeys.includes(item.label)
    )

    // 更新 selectedData
    dispatch(setSelectedData(filteredData))
    message.success('数据已选择')
  }
  console.log(
    'columnsForOverviewcolumnsForOverviewcolumnsForOverview',
    columnsForOverview,
    iniData.columns
  )

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
            columns={columnsForDetail} // 根据需要调整列
            dataSource={iniData.data} // 数据概览
            rowKey="title"
          />
        )}

        {/* 选择按钮 */}
        <Button type="primary" onClick={handleSelectData}>
          选择
        </Button>
      </Space>
    </div>
  )
}

export default FileUpload

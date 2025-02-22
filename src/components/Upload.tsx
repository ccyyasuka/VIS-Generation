import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { uploadFileAndSetData, updateKV } from './redux/dataSlice'
import { AppDispatch } from './redux/store'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps, RadioChangeEvent } from 'antd'
import { message, Upload, Table, Radio, Space, Button } from 'antd'
import type { TableProps } from 'antd'
import style from './upload.module.css'
import { saveAs } from 'file-saver'
const { Dragger } = Upload
type TableRowSelection<T extends object = object> =
  TableProps<T>['rowSelection']

function FileUpload() {
  const dispatch = useDispatch<AppDispatch>()
  const iniData = useSelector((state: any) => state.data.iniData)
  const [viewMode, setViewMode] = useState<'字段详情' | '数据概览'>('字段详情')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])


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
    progress: {
      strokeColor: {
        '0%': '#108ee9',
        '100%': '#87d068',
      },
      strokeWidth: 3,
      format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
    },
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
  
  const handleFileUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls,.json' // 根据需要设置接受的文件类型
    input.addEventListener('change', handleFileSelect)
    input.click()
  }

  const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    try {
      const result = await dispatch(uploadFileAndSetData(file as File) as any)
      if (result.status === '成功') {
        message.success('文件上传成功')
      } else {
        message.error('文件上传失败')
      }
    } catch (error) {
      message.error('文件上传失败')
    }
  }

  const { selectedData, config } = useSelector((state: any) => state.data)
  const handleDownload = () => {
    const content = JSON.stringify({ config }, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    saveAs(blob, 'data_and_config.json')
  }

  return (
    <div className={style.controlBar}>
      <div className={style.head}>控制栏</div>
      <div className={style.main}>
        <Button
          type="primary"
          icon={<InboxOutlined />}
          onClick={handleFileUploadClick}
          style={{ marginTop: '20px' }}>
          点击上传文件
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

        <Button
          onClick={handleDownload}
          type="primary"
          style={{ marginTop: '20px' }}>
          导出当前视图
        </Button>
      </div>
    </div>
  )
}

export default FileUpload

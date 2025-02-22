import React, { useState, useRef, useEffect } from 'react'
import { Table } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import style from './table.module.css'
interface OriginalDataItem {
  [key: string]: any
}

interface DataSourceItem extends OriginalDataItem {
  key: string
}

interface ColumnDefinition {
  title: string
  dataIndex: string
  key: string
}
export const TableView = () => {
  const { originData, config } = useSelector((state: any) => state.data)
  console.log('TableVieworiginData', originData)

  function transformData(data: OriginalDataItem[]): {
    dataSource: DataSourceItem[]
    columns: ColumnDefinition[]
  } {
    const dataSource: DataSourceItem[] = data.map((item, index) => ({
      key: String(index + 1),
      ...item,
    }))

    const columns: ColumnDefinition[] = Object.keys(data[0]).map((key) => ({
      title: key,
      dataIndex: key,
      key: key,
    }))

    return { dataSource, columns }
  }
  if (originData) {
    const { dataSource, columns } = transformData(originData)
    return (
      <>
        <Table dataSource={dataSource} columns={columns} />;
      </>
    )
  }

  return <>
  <div className={style.head}>数据视图1</div>
  </>
}

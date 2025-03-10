import React, { useState, useRef, useEffect } from 'react'
import Chart from './plots/Chart'
import { useDispatch, useSelector } from 'react-redux'
import { DownloadOutlined } from '@ant-design/icons'
import { style } from 'd3'
import { saveAs } from 'file-saver'
import testdata from '../testData/sales_data.json'
import regularData from '../testData/top_3pt_regular_players.json'
import playoffData from '../testData/top_3pt_Playoffs_players.json'
import timeSeriesData from '../testData/top_players_3PCT_every_year.json'
import playoffData30 from '../testData/top_3pt_Playoffs_players_30.json'

// type DataItem = {
//   label: string
//   value: number
// }
interface MainViewProps {
  offset: { left: string; top: string }
}
type ConfigItem = {
  name: string
  id: string
  description: string
  title: string
  meta: {
    width: string
    height: string
    left: string
    top: string
  }
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
  transform?: {
    type: string
    config: {
      dimension: string
      condition: string
      value?: number
    }
  }
  xAxis?: {
    xAxisLabel?: string // x轴名称
    format?: string // x轴坐标格式化函数
    angle?: number // x轴标签旋转角度
    tickSize?: number // x轴刻度线大小
  }
  yAxis?: {
    yAxisLabel?: string // y轴名称
    format?: string // y轴坐标格式化函数
    angle?: number // y轴标签旋转角度
    tickSize?: number // y轴刻度线大小
  }
  legend?: { open: boolean; legendPosition: string; legendOrientation: string }
  tooltip?: { open: boolean; text: string }
  color?: string[]
  [key: string]: any
}
const MainView: React.FC<MainViewProps> = ({ offset }) => {
  const handleDownload = () => {
    const content = JSON.stringify({ curConfig }, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    saveAs(blob, 'data_and_config.json')
  }
  const { left, top } = offset
  // 偏移值

  const { selectedData, config } = useSelector((state: any) => state.data)
  // // console.log('selectedData, config', selectedData, config)
  const data: any[] = selectedData

  // debugger
  const curConfig: ConfigItem[] = config
  // console.log('curConfig', curConfig)

  // console.log('datadatadatadata11111', data, curConfig)
  // 统计数据测试样例
  // const data1: any = testdata

  const data1: any = {
    nodes: [
      { id: 'Myriel', group: 1 },
      { id: 'Napoleon', group: 1 },
      { id: 'Mlle.Baptistine', group: 1 },
      { id: 'Mme.Magloire', group: 1 },
      { id: 'CountessdeLo', group: 1 },
      { id: 'Valjean', group: 2 },
      { id: 'Marguerite', group: 3 },
      { id: 'Tholomyes', group: 3 },
      { id: 'Fantine', group: 3 },
      { id: 'Mme.Thenardier', group: 4 },
      { id: 'Cosette', group: 5 },
      { id: 'Javert', group: 4 },
      { id: 'Marius', group: 8 },
      { id: 'Gavroche', group: 8 },
      { id: 'Enjolras', group: 8 },
      { id: 'Combeferre', group: 8 },
    ],
    links: [
      { source: 'Napoleon', target: 'Myriel', value: 1 },
      { source: 'Mlle.Baptistine', target: 'Myriel', value: 8 },
      { source: 'Mme.Magloire', target: 'Myriel', value: 10 },
      { source: 'Valjean', target: 'Myriel', value: 5 },
      { source: 'Fantine', target: 'Tholomyes', value: 3 },
      { source: 'Mme.Thenardier', target: 'Fantine', value: 2 },
      { source: 'Cosette', target: 'Valjean', value: 31 },
      { source: 'Javert', target: 'Valjean', value: 17 },
      { source: 'Marius', target: 'Cosette', value: 21 },
      { source: 'Enjolras', target: 'Marius', value: 7 },
      { source: 'Combeferre', target: 'Marius', value: 5 },
      { source: 'Gavroche', target: 'Valjean', value: 1 },
    ],
  }

  const data2: any = [
    { year: '2019', height: 11, weight: 22, value: 54, category: 'A' },
    { year: '2020', height: 10, weight: 160, value: 90, category: 'A' },
    { year: '2021', height: 170, weight: 29, value: 62, category: 'A' },
    { year: '2022', height: 190, weight: 120, value: 20, category: 'A' },
    { year: '2023', height: 180, weight: 160, value: 10, category: 'A' },
    { year: '2024', height: 190, weight: 220, value: 60, category: 'A' },
    { year: '2019', height: 11, weight: 12, value: 54, category: 'C' },
    { year: '2020', height: 10, weight: 60, value: 90, category: 'C' },
    { year: '2021', height: 190, weight: 129, value: 62, category: 'C' },
    { year: '2022', height: 80, weight: 10, value: 20, category: 'C' },
    { year: '2023', height: 180, weight: 60, value: 10, category: 'C' },
    { year: '2024', height: 280, weight: 20, value: 60, category: 'C' },
  ]
  const b = {
    id: 'aa',
    title: 'aa',
    description: 'aa',
    allowedInteractionType: '',
    interactionType: '',
    interactionKey: '',
  }
  // const curConfig: ConfigItem[] = [
  //   {
  //     id: 'aa',
  //     title: 'aa',
  //     description: 'aa',
  //     allowedInteractionType: '',
  //     interactionType: '',
  //     interactionKey: '',
  //     name: 'BarVertical',
  //     data: [
  //       { 'Disease Type': 'Asthma', Recovered: 'No', Count: 1 },
  //       { 'Disease Type': 'Asthma', Recovered: 'Yes', Count: 1 },
  //       { 'Disease Type': 'Bronchitis', Recovered: 'No', Count: 1 },
  //       { 'Disease Type': 'Bronchitis', Recovered: 'Yes', Count: 2 },
  //       { 'Disease Type': 'COPD', Recovered: 'Yes', Count: 1 },
  //       { 'Disease Type': 'Lung Cancer', Recovered: 'No', Count: 1 },
  //       { 'Disease Type': 'Lung Cancer', Recovered: 'Yes', Count: 1 },
  //       { 'Disease Type': 'Pneumonia', Recovered: 'Yes', Count: 3 },
  //     ],
  //     meta: {
  //       width: '60%',
  //       height: '60%',
  //       left: '20%',
  //       top: '10%',
  //     },
  //     x: 'Disease Type',
  //     y: 'Count',
  //     legendBy: 'Recovered',
  //     legend: {
  //       open: true,
  //       legendPosition: 'top-right',
  //       legendOrientation: 'horizontal',
  //     },
  //     tooltip: {
  //       open: true,
  //       text: '{x} - {Recovered}: {y} patients',
  //     },
  //   },
  // ]

  // 地图数据测试样例

  if (curConfig) {
    const renderComponents = curConfig.map(
      (item: ConfigItem, index: number) => (
        <Chart key={index} item={item} left={left} top={top} />
      )
    )

    return (
      <div>
        {renderComponents}
        {/* <div
          className="download"
          style={{
            position: 'absolute',
            left: '95%',
            top: '95%',
            cursor: 'pointer',
          }}
          onClick={handleDownload}>
          <DownloadOutlined />
        </div> */}
      </div>
    )
  }

  return <div></div>
}

export default MainView

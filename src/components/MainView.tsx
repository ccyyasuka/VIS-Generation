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
  // console.log('selectedData, config', selectedData, config)
  const data: any[] = selectedData

  // 后端传来的数据
  const curConfig: ConfigItem[] = config
  console.log('curConfig', curConfig)

  console.log('datadatadatadata11111', data, curConfig)

  // 讲解：以下注释是绘制图表用的样例数据，上面的代码是从后端接收数据。
  // const data1: any = {
  //   nodes: [
  //     { id: 'Myriel', group: 1 },
  //     { id: 'Napoleon', group: 1 },
  //     { id: 'Mlle.Baptistine', group: 1 },
  //     { id: 'Mme.Magloire', group: 1 },
  //     { id: 'CountessdeLo', group: 1 },
  //     { id: 'Valjean', group: 2 },
  //     { id: 'Marguerite', group: 3 },
  //     { id: 'Tholomyes', group: 3 },
  //     { id: 'Fantine', group: 3 },
  //     { id: 'Mme.Thenardier', group: 4 },
  //     { id: 'Cosette', group: 5 },
  //     { id: 'Javert', group: 4 },
  //     { id: 'Marius', group: 8 },
  //     { id: 'Gavroche', group: 8 },
  //     { id: 'Enjolras', group: 8 },
  //   ],
  //   links: [
  //     { source: 'Napoleon', target: 'Myriel', value: 1 },
  //     { source: 'Mlle.Baptistine', target: 'Myriel', value: 8 },
  //     { source: 'Mme.Magloire', target: 'Myriel', value: 10 },
  //     { source: 'Valjean', target: 'Myriel', value: 5 },
  //     { source: 'Fantine', target: 'Tholomyes', value: 3 },
  //     { source: 'Mme.Thenardier', target: 'Fantine', value: 2 },
  //     { source: 'Cosette', target: 'Valjean', value: 31 },
  //     { source: 'Javert', target: 'Valjean', value: 17 },
  //     { source: 'Marius', target: 'Cosette', value: 21 },
  //     { source: 'Enjolras', target: 'Marius', value: 7 },
  //     { source: 'Gavroche', target: 'Valjean', value: 1 },
  //   ],
  // }

  // const data2: any = [
  //   { year: '2019', height: 51, weight: 22, value: 54 },
  //   { year: '2020', height: 80, weight: 160, value: 90 },
  //   { year: '2021', height: 70, weight: 29, value: 62 },
  //   { year: '2022', height: 90, weight: 120, value: 20 },
  //   { year: '2023', height: 80, weight: 160, value: 10 },
  //   { year: '2024', height: 90, weight: 220, value: 60 },
  // ]
  // const curConfig: ConfigItem[] = [
  // 讲解：[]中可以有很多个{},每个{}对应一个视图
  //   {
  //     id: 'aa',//讲解：每一个图表都有一个自己的id方便大模型识别
  //     title: "Every year's item height situation",//讲解：图表题目
  //     description: 'aa',//讲解：图表简介，方便大模型理解
  //     allowedInteractionType: 'ycy14582',//讲解：需要说明该图表运行允许接收的交互信号是什么
  //     interactionType: '1441abc',//讲解：需要说明该图表发出的交互信号是什么
  //     interactionKey: 'height',//讲解：需要说明该交互信号作用在哪个可视化通道上
  //     name: 'ArcDiagram',//讲解：说明绘制什么可视化图表
  //     data: data1,
  //     meta: {        //讲解：指明这个可视化图表在视图中的相对位置
  //       width: '80%',
  //       height: '80%',
  //       left: '5%',
  //       top: '5%',
  //     },
  //     x: 'year',
  //     y: 'height',
  //     legendBy: 'category',
  //     legend: {
  //       open: true,
  //       legendPosition: 'top-right',
  //       legendOrientation: 'horizontal',
  //     },
  //     tooltip: {
  //       open: true,
  //       text: '{x} 年的高度是 {y}',
  //     },
  //   },
  // ]

  if (curConfig) {
    // 讲解：将配置项curConfig传给Chart组件，chart组件内部使用Easychart进行绘制，
    // left和top是可视化系统用来拖拽图表的，单纯研究Easychart可以不管这个参数
    const renderComponents = curConfig.map(
      (item: ConfigItem, index: number) => (
        <Chart key={index} item={item} left={left} top={top} />
      )
    )

    return <div>{renderComponents}</div>
  }

  return <div></div>
}

export default MainView

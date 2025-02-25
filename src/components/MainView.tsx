import React, { useState, useRef, useEffect } from 'react'
// import BarRight from './plots/BarRight'
// import BarVertical from './plots/BarVertical'
// import Line from './plots/Line'
// import Pie from './plots/Pie'
// import Scatter from './plots/Scatter'
// import Donat from './plots/Donat'
// import ForceDirect from './plots/ForceDirect'
// import ArcDiagram from './plots/ArcDiagram'
// import Area from './plots/Area'
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

  debugger
  const curConfig: ConfigItem[] = config
  console.log('curConfig', curConfig)

  // console.log('datadatadatadata11111', data, curConfig)
  // 统计数据测试样例
  // const data1: any = testdata
  const data2: any = [
    { year: '2019', height: 11, weight: 22, value: 54, category: 'A' },
    { year: '2020', height: 10, weight: 160, value: 90, category: 'A' },
    { year: '2021', height: 170, weight: 29, value: 62, category: 'A' },
    { year: '2022', height: 190, weight: 120, value: 20, category: 'A' },
    { year: '2023', height: 180, weight: 160, value: 10, category: 'A' },
    { year: '2024', height: 190, weight: 220, value: 60, category: 'A' },
    { year: '2019', height: 11, weight: 22, value: 54, category: 'C' },
    { year: '2020', height: 10, weight: 160, value: 90, category: 'C' },
    { year: '2021', height: 190, weight: 29, value: 62, category: 'C' },
    { year: '2022', height: 80, weight: 120, value: 20, category: 'C' },
    { year: '2023', height: 180, weight: 160, value: 10, category: 'C' },
    { year: '2024', height: 280, weight: 220, value: 60, category: 'C' },
  ]

  // 地图数据测试样例
  // const data: any = {
  //   nodes: [
  //     {id: "Myriel", group: 1},
  //     {id: "Napoleon", group: 1},
  //     {id: "Mlle.Baptistine", group: 1},
  //     {id: "Mme.Magloire", group: 1},
  //     {id: "CountessdeLo", group: 1},
  //     {id: "Valjean", group: 2},
  //     {id: "Marguerite", group: 3},
  //     {id: "Tholomyes", group: 3},
  //     {id: "Fantine", group: 3},
  //     {id: "Mme.Thenardier", group: 4},
  //     {id: "Cosette", group: 5},
  //     {id: "Javert", group: 4},
  //     {id: "Marius", group: 8},
  //     {id: "Gavroche", group: 8},
  //     {id: "Enjolras", group: 8},
  //     {id: "Combeferre", group: 8}
  //   ],
  //   links: [
  //     {source: "Napoleon", target: "Myriel", value: 1},
  //     {source: "Mlle.Baptistine", target: "Myriel", value: 8},
  //     {source: "Mme.Magloire", target: "Myriel", value: 10},
  //     {source: "Valjean", target: "Myriel", value: 5},
  //     {source: "Fantine", target: "Tholomyes", value: 3},
  //     {source: "Mme.Thenardier", target: "Fantine", value: 2},
  //     {source: "Cosette", target: "Valjean", value: 31},
  //     {source: "Javert", target: "Valjean", value: 17},
  //     {source: "Marius", target: "Cosette", value: 21},
  //     {source: "Enjolras", target: "Marius", value: 7},
  //     {source: "Combeferre", target: "Marius", value: 5},
  //     {source: "Gavroche", target: "Valjean", value: 1}
  // ]
  // }

  // const data: any = [
  //   { year: '2022', height: 80, weight: 120, value: 20,tag:'a' },
  //   { year: '2022', height: 180, weight: 160, value: 10,tag:'b' },
  //   { year: '2022', height: 280, weight: 220, value: 60,tag:'c' },
  //   { year: '2023', height: 40, weight: 120, value: 20,tag:'a' },
  //   { year: '2023', height: 20, weight: 160, value: 10,tag:'b' },
  //   { year: '2023', height: 180, weight: 220, value: 60,tag:'c' },
  //   { year: '2024', height: 90, weight: 120, value: 20,tag:'a' },
  //   { year: '2024', height: 30, weight: 160, value: 10,tag:'b' },
  //   { year: '2024', height: 110, weight: 220, value: 60,tag:'c' },
  // ]

  // // 历史行为习惯
  // // assistant api 大模型选择参数
  // const curConfig: ConfigItem[] = [
  //   // {
  //   //   name: 'ArcDiagram',
  //   //   meta: {
  //   //     width: '60%',
  //   //     height: '60%',
  //   //     left: '15%',
  //   //     top: '5%',
  //   //   },
  //   //   interactionType: 'filter',
  //   //   interactionKey: 'height',
  //   //   allowedInteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'BarRight',
  //   //   meta: {
  //   //     width: '40%',
  //   //     height: '20%',
  //   //     left: '15%',
  //   //     top: '5%',
  //   //   },
  //   //   x: 'year',
  //   //   y: 'height',
  //   //   interactionType: 'filter',
  //   //   interactionKey: 'height',
  //   //   allowedInteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'Line',
  //   //   description: '不同支付方式的销售额趋势',
  //   //   id: 'trrrr',
  //   //   data: testdata,
  //   //   meta: {
  //   //     width: '40%',
  //   //     height: '40%',
  //   //     left: '5%',
  //   //     top: '5%',
  //   //   },
  //   //   x: 'Sale_Date',
  //   //   y: 'Sales_Amount',
  //   //   interactionType: 'filter_01',
  //   //   interactionKey: 'Sale_Date',
  //   //   allowedInteractionType: 'filter_02',
  //   //   legendBy: 'Payment_Method',
  //   //   // transform: {
  //   //   //   type: 'groupBy',
  //   //   //   config: {
  //   //   //     dimension: 'Payment_Method',
  //   //   //     condition: 'sum',
  //   //   //     // value: "Sales_Amount"
  //   //   //   },
  //   //   // },
  //   //   legend: {
  //   //     open: true,
  //   //     legendPosition: 'top',
  //   //     legendOrientation: 'horizontal',
  //   //   },
  //   //   tooltip: {
  //   //     open: true,
  //   //     text: '{x}的销售额是{y}',
  //   //   },
  //   // },
  //   // {
  //   //   name: 'Line',
  //   //   description: '不同支付方式的销售量趋势',
  //   //   id: 'aasdasdcf',
  //   //   data: testdata,
  //   //   meta: {
  //   //     width: '60%',
  //   //     height: '50%',
  //   //     left: '20%',
  //   //     top: '45%',
  //   //   },
  //   //   x: 'Sale_Date',
  //   //   y: 'Quantity_Sold',
  //   //   interactionType: 'filter_02',
  //   //   interactionKey: 'Sale_Date',
  //   //   allowedInteractionType: 'filter_01',
  //   //   legendBy: 'Payment_Method',
  //   //   // transform: {
  //   //   //   type: 'groupBy',
  //   //   //   config: {
  //   //   //     dimension: 'Payment_Method',
  //   //   //     condition: 'sum',
  //   //   //     // value: "Quantity_Sold"
  //   //   //   },
  //   //   // },
  //   //   legend: {
  //   //     open: true,
  //   //     legendPosition: 'top',
  //   //     legendOrientation: 'horizontal',
  //   //   },
  //   //   tooltip: {
  //   //     open: true,
  //   //     text: '{x}的销售量是{y}',
  //   //   },
  //   // },

  //   {
  //     name: 'Line',
  //     description: '不同支付方式的销售额趋势',
  //     id: 'trrrr',
  //     data: timeSeriesData,
  //     meta: {
  //       width: '45%',
  //       height: '45%',
  //       left: '3%',
  //       top: '3%',
  //     },
  //     x: 'year',
  //     y: 'FG3_PCT',
  //     interactionType: 'filter_01',
  //     interactionKey: 'year',
  //     allowedInteractionType: 'filter_02',
  //     legendBy: 'PLAYER',
  //     // transform: {
  //     //   type: 'groupBy',
  //     //   config: {
  //     //     dimension: 'Payment_Method',
  //     //     condition: 'sum',
  //     //     // value: "Sales_Amount"
  //     //   },
  //     // },
  //     legend: {
  //       open: true,
  //       legendPosition: 'top-right',
  //       legendOrientation: 'vertical',
  //     },
  //     tooltip: {
  //       open: true,
  //       text: '{x}的销售额是{y}',
  //     },
  //   },
  //   {
  //     name: 'BarVertical',
  //     description: '不同支付方式的销售额趋势',
  //     id: 'trrrr',
  //     data: regularData,
  //     meta: {
  //       width: '45%',
  //       height: '45%',
  //       left: '53%',
  //       top: '3%',
  //     },
  //     x: 'PLAYER',
  //     y: 'FG3_PCT',
  //     interactionType: 'filter_01',
  //     interactionKey: 'PLAYER',
  //     allowedInteractionType: 'filter_02',
  //     // legendBy: 'PLAYER',
  //     // transform: {
  //     //   type: 'groupBy',
  //     //   config: {
  //     //     dimension: 'Payment_Method',
  //     //     condition: 'sum',
  //     //     // value: "Sales_Amount"
  //     //   },
  //     // },
  //     legend: {
  //       open: true,
  //       legendPosition: 'top-right',
  //       legendOrientation: 'vertical',
  //     },
  //     tooltip: {
  //       open: true,
  //       text: '{x}的三分命中率是{y}',
  //     },
  //   },
  //   {
  //     name: 'BarVertical',
  //     description: '不同支付方式的销售额趋势',
  //     id: 'trrrr',
  //     data: playoffData,
  //     meta: {
  //       width: '45%',
  //       height: '45%',
  //       left: '3%',
  //       top: '50%',
  //     },
  //     x: 'PLAYER',
  //     y: 'FG3_PCT',
  //     interactionType: 'filter_01',
  //     interactionKey: 'PLAYER',
  //     allowedInteractionType: 'filter_02',
  //     // legendBy: 'PLAYER',
  //     // transform: {
  //     //   type: 'groupBy',
  //     //   config: {
  //     //     dimension: 'Payment_Method',
  //     //     condition: 'sum',
  //     //     // value: "Sales_Amount"
  //     //   },
  //     // },
  //     legend: {
  //       open: true,
  //       legendPosition: 'top-right',
  //       legendOrientation: 'vertical',
  //     },
  //     tooltip: {
  //       open: true,
  //       text: '{x}的三分命中率是{y}',
  //     },
  //   },
  //   {
  //     name: 'Scatter',
  //     description: '不同支付方式的销售额趋势',
  //     id: 'trrrr',
  //     data: playoffData30,
  //     meta: {
  //       width: '45%',
  //       height: '45%',
  //       left: '53%',
  //       top: '50%',
  //     },
  //     x: 'FTA',
  //     y: 'AST',
  //     interactionType: 'filter_01',
  //     interactionKey: 'FTA',
  //     allowedInteractionType: 'filter_02',
  //     // legendBy: 'PLAYER',
  //     // transform: {
  //     //   type: 'groupBy',
  //     //   config: {
  //     //     dimension: 'Payment_Method',
  //     //     condition: 'sum',
  //     //     // value: "Sales_Amount"
  //     //   },
  //     // },
  //     // legend: {
  //     //   open: true,
  //     //   legendPosition: 'top-right',
  //     //   legendOrientation: 'vertical',
  //     // },
  //     tooltip: {
  //       open: true,
  //       text: '{x}的三分命中率是{y}',
  //     },
  //   },
  // ]

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

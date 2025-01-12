import React from 'react'
import BarRight from './plots/BarRight'
import BarVertical from './plots/BarVertical'
import Line from './plots/Line'
import Pie from './plots/Pie'
import Scatter from './plots/Scatter'
import Donat from './plots/Donat'
import ForceDirect from './plots/ForceDirect'
import ArcDiagram from './plots/ArcDiagram'
import Area from './plots/Area'
import { useDispatch, useSelector } from 'react-redux'
// type DataItem = {
//   label: string
//   value: number
// }
type ConfigItem = {
  name: string
  meta: {
    width: string
    height: string
    left: string
    top: string
  }
  interactionType: string
  interactionKey: string
  allowedinteractionType: string
  [key: string]: any
}
const MainView: React.FC = () => {
  const { selectedData, config } = useSelector((state: any) => state.data)
  // console.log('selectedData, config', selectedData, config)
  const data: any[] = selectedData

  const curConfig: ConfigItem[] = config
  console.log('datadatadatadata', data, curConfig)
  // 统计数据测试样例
  // const data: any = [
  //   { year: '2019', height: 11, weight: 22, value: 54 },
  //   { year: '2020', height: 10, weight: 160, value: 90 },
  //   { year: '2021', height: 190, weight: 29, value: 62 },
  //   { year: '2022', height: 80, weight: 120, value: 20 },
  //   { year: '2023', height: 180, weight: 160, value: 10 },
  //   { year: '2024', height: 280, weight: 220, value: 60 },
  // ]

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
  //   //   allowedinteractionType: 'filter',
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
  //   //   allowedinteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'BarVertical',
  //   //   meta: {
  //   //     width: '20%',
  //   //     height: '60%',
  //   //     left: '15%',
  //   //     top: '5%',
  //   //   },
  //   //   x: 'year',
  //   //   y: 'height',
  //   //   interactionType: 'filter',
  //   //   interactionKey: 'height',
  //   //   allowedinteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'Donat',
  //   //   meta: {
  //   //     width: '30%',
  //   //     height: '30%',
  //   //     left: '25%',
  //   //     top: '55%',
  //   //   },
  //   //   x: 'year',
  //   //   y: 'height',
  //   //   interactionType: 'filter',
  //   //   interactionKey: 'height',
  //   //   allowedinteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'Line',
  //   //   meta: {
  //   //     width: '30%',
  //   //     height: '30%',
  //   //     left: '65%',
  //   //     top: '15%',
  //   //   },
  //   //   x: 'year',
  //   //   y: 'height',
  //   //   interactionType: 'filter',
  //   //   interactionKey: 'height',
  //   //   allowedinteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'Scatter',
  //   //   meta: {
  //   //     width: '30%',
  //   //     height: '30%',
  //   //     left: '15%',
  //   //     top: '85%',
  //   //   },
  //   //   x: 'height',
  //   //   y: 'weight',
  //   //   z: 'value',
  //   //   interactionType: 'filter',
  //   //   interactionKey: 'height',
  //   //   allowedinteractionType: 'filter',
  //   // },
  //   // {
  //   //   name: 'Area',
  //   //   meta: {
  //   //     width: '30%',
  //   //     height: '30%',
  //   //     left: '25%',
  //   //     top: '35%',
  //   //   },
  //   //   interactionType: 'filter',
  //   //   allowedinteractionType: 'ByValue',
  //   // },
  // ]

  if (data && curConfig) {
    const renderComponents = curConfig.map(
      (item: ConfigItem, index: number) => {
        let Component = null
        if (item.name === 'BarRight') {
          Component = BarRight
        }
        if (item.name === 'BarVertical') {
          Component = BarVertical
        }
        if (item.name === 'Line') {
          Component = Line
        }
        if (item.name === 'Pie') {
          Component = Pie
        }
        if (item.name === 'Donat') {
          Component = Donat
        }
        if (item.name === 'Scatter') {
          Component = Scatter
        }
        if (item.name === 'ForceDirect') {
          Component = ForceDirect
        }
        if (item.name === 'ArcDiagram') {
          Component = ArcDiagram
        }
        // if (item.name === 'Area') {
        //   Component = Area
        // }

        return Component ? (
          <Component
            key={index}
            data={data as any}
            width={item.meta.width}
            height={item.meta.height}
            left={item.meta.left}
            top={item.meta.top}
            x={item.x}
            y={item.y}
            interactionType={item.interactionType}
            interactionKey={item.interactionKey}
            allowedinteractionType={item.allowedinteractionType}
            {...(item.name === 'Scatter' ? { label: item.label || '' } : {})}
          />
        ) : null
      }
    )

    return <div>{renderComponents}</div>
  }

  return <div></div>

  // return (
  // 	<div>
  // 		<Bar data={data} width="30%" height="20%" position="absolute" left="25%" top="15%" />
  // 		<Line data={data} width="30%" height="20%" position="absolute" left="65%" top="15%" />
  // 		<Pie data={data} width="30%" height="20%" position="absolute" left="25%" top="75%" />
  // 	</div>
  // );
}

export default MainView

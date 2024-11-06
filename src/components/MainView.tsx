import React from 'react'
import BarRight from './plots/BarRight'
import BarVertical from './plots/BarVertical'
import Line from './plots/Line'
import Pie from './plots/Pie'
import Scatter from './plots/Scatter'
import Donat from './plots/Donat'
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
  // const { selectedData, config } = useSelector((state: any) => state.data)
  // const data: DataItem[] = selectedData

  // const curConfig: ConfigItem[] = config

  const data: any = [
    { year: '2022', height: 80, weight: 120, value: 20 },
    { year: '2023', height: 180, weight: 160, value: 10 },
    { year: '2024', height: 280, weight: 220, value: 60 },
  ]
  // // 历史行为习惯
  // // assistant api 大模型选择参数
  const curConfig: ConfigItem[] = [
    // {
    //   name: 'BarRight',
    //   meta: {
    //     width: '40%',
    //     height: '20%',
    //     left: '15%',
    //     top: '5%',
    //   },
    //   x: 'year',
    //   y: 'height',
    //   interactionType: 'filter',
    //   interactionKey: 'height',
    //   allowedinteractionType: 'filter',
    // },
    {
      name: 'BarVertical',
      meta: {
        width: '20%',
        height: '60%',
        left: '15%',
        top: '5%',
      },
      x: 'year',
      y: 'height',
      interactionType: 'filter',
      interactionKey: 'height',
      allowedinteractionType: 'filter',
    },
    {
      name: 'Donat',
      meta: {
        width: '30%',
        height: '30%',
        left: '25%',
        top: '55%',
      },
      x: 'year',
      y: 'height',
      interactionType: 'filter',
      interactionKey: 'height',
      allowedinteractionType: 'filter',
    },
    {
      name: 'Line',
      meta: {
        width: '30%',
        height: '30%',
        left: '65%',
        top: '15%',
      },
      x: 'year',
      y: 'height',
      interactionType: 'filter',
      interactionKey: 'height',
      allowedinteractionType: 'filter',
    },
    {
      name: 'Scatter',
      meta: {
        width: '30%',
        height: '30%',
        left: '15%',
        top: '85%',
      },
      x: 'height',
      y: 'weight',
      z: 'value',
      interactionType: 'filter',
      interactionKey: 'height',
      allowedinteractionType: 'filter',
    },
    // {
    //   name: 'Area',
    //   meta: {
    //     width: '30%',
    //     height: '30%',
    //     left: '25%',
    //     top: '35%',
    //   },
    //   interactionType: 'filter',
    //   allowedinteractionType: 'ByValue',
    // },
  ]

  if (data && curConfig) {
    const renderComponents = curConfig.map((item, index) => {
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
    })

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

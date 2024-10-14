import React from 'react'
import Bar from './plots/Bar'
import Line from './plots/Line'
import Pie from './plots/Pie'
import Scatter from './plots/Scatter'
import Area from './plots/Area'
type DataItem = {
  label: string
  value: number
}
type ConfigItem = {
  name: string
  meta: {
    width: string
    height: string
    left: string
    top: string
  }
  interactionType?: string
  allowedinteractionType?: string
}
const MainView: React.FC = () => {
  const data: DataItem[] = [
    { label: '2022', value: 20 },
    { label: '2023', value: 10 },
    { label: '2024', value: 60 },
  ]
  // 历史行为习惯
  // assistant api 大模型选择参数
  const config: ConfigItem[] = [
    {
      name: 'Bar',
      meta: {
        width: '40%',
        height: '20%',
        left: '15%',
        top: '5%',
      },
      interactionType: 'filter',
      allowedinteractionType: 'ByValue',
    },
    // {
    //   name: 'Pie',
    //   meta: {
    //     width: '30%',
    //     height: '30%',
    //     left: '25%',
    //     top: '55%',
    //   },
    //   interactionType: 'filter',
    //   allowedinteractionType: 'ByValue',
    // },
    {
      name: 'Line',
      meta: {
        width: '30%',
        height: '30%',
        left: '65%',
        top: '15%',
      },
      interactionType: 'filter',
      allowedinteractionType: 'ByValue',
    },
    // {
    //   name: 'Scatter',
    //   meta: {
    //     width: '30%',
    //     height: '30%',
    //     left: '65%',
    //     top: '15%',
    //   },
    //   interactionType: 'filter',
    //   allowedinteractionType: 'ByValue',
    // },
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
  const renderComponents = config.map((item, index) => {
    let Component = null
    if (item.name === 'Bar') {
      Component = Bar
    }
    if (item.name === 'Line') {
      Component = Line
    }
    if (item.name === 'Pie') {
      Component = Pie
    }
    if (item.name === 'Scatter') {
      Component = Scatter
    }
    if (item.name === 'Area') {
      Component = Area
    }

    return Component ? (
      <Component
        key={index}
        data={data as any}
        width={item.meta.width}
        height={item.meta.height}
        position="absolute"
        left={item.meta.left}
        top={item.meta.top}
        interactionType={item.interactionType}
        allowedinteractionType={item.allowedinteractionType}
      />
    ) : null
  })

  return <div>{renderComponents}</div>

  // return (
  // 	<div>
  // 		<Bar data={data} width="30%" height="20%" position="absolute" left="25%" top="15%" />
  // 		<Line data={data} width="30%" height="20%" position="absolute" left="65%" top="15%" />
  // 		<Pie data={data} width="30%" height="20%" position="absolute" left="25%" top="75%" />
  // 	</div>
  // );
}

export default MainView

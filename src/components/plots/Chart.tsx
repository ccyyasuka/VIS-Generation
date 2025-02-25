import React from 'react'
import BarRight from './BarRight'
import BarVertical from './BarVertical'
import Line from './Line'
import Pie from './Pie'
import Scatter from './Scatter'
import Donat from './Donat'
import ForceDirect from './ForceDirect'
import ArcDiagram from './ArcDiagram'
type ConfigItem = {
  name: string
  id: string
  meta: {
    width: string
    height: string
    left: string
    top: string
  }
  description: string
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
  title: string
  transform?: {
    type: string
    config: {
      dimension: string
      condition: string
      value?: number
    }
  }
  xAxis?: {
    label?: string // x轴名称
    format?: string // x轴坐标格式化函数
    angle?: number // x轴标签旋转角度
    tickSize?: number // x轴刻度线大小
  }
  yAxis?: {
    label?: string // y轴名称
    format?: string // y轴坐标格式化函数
    angle?: number // y轴标签旋转角度
    tickSize?: number // y轴刻度线大小
  }
  legend?: { open: boolean; legendPosition: string; legendOrientation: string }
  tooltip?: { open: boolean; text: string }
  color?: string[]
  [key: string]: any
}
interface ChartProps {
  item: ConfigItem
  left: string
  top: string
}

const Chart: React.FC<ChartProps> = ({ item, left, top }) => {
  let Component = null

  // 根据item.name选择对应的图表组件
  switch (item.name) {
    case 'BarRight':
      Component = BarRight
      break
    case 'BarVertical':
      Component = BarVertical
      break
    case 'Line':
      Component = Line
      break
    case 'Pie':
      Component = Pie
      break
    case 'Donat':
      Component = Donat
      break
    case 'Scatter':
      Component = Scatter
      break
    case 'ForceDirect':
      Component = ForceDirect
      break
    case 'ArcDiagram':
      Component = ArcDiagram
      break
    default:
      return null
  }

  return Component ? (
    <Component
      id={item.id}
      data={item.data}
      groupBy={item.legendBy}
      title={item.title}
      width={item.meta.width}
      height={item.meta.height}
      left={item.meta.left}
      top={item.meta.top}
      offsetLeft={left}
      offsetTop={top}
      x={item.x}
      y={item.y}
      z={item.z}
      interactionType={item.interactionType}
      interactionKey={item.interactionKey}
      allowedInteractionType={item.allowedInteractionType}
      transform={item.transform}
      xAxis={item.xAxis}
      yAxis={item.yAxis}
      legend={item.legend}
      tooltip={item.tooltip}
      color={item.color}
      // 如果是Scatter图，则添加label属性
      {...(item.name === 'Scatter' ? { label: item.label || '' } : {})}
    />
  ) : null
}

export default Chart

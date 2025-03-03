import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState } from './redux/store'
import { ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'
import applyTransformations from './tools/transformApply'
import preprocessData from './tools/preprocess'
import calculateMargin from './tools/calMargin'
type scatterDataItem = {
  x: number
  y: number
  label: string | null
  z?: number
  [key: string]: any
}
// const legendAcquiesce = {
//   open: true,
//   legendPosition: 'top-right',
//   legendOrientation: 'vertical',
// }
const xAxisAcquiesce = {
  xAxisLabel: '', // x轴名称
  // format: string // x轴坐标格式化函数
  angle: 0, // x轴标签旋转角度
  tickSize: 6, // x轴刻度线大小
}
const yAxisAcquiesce = {
  yAxisLabel: '', // x轴名称
  // format: string // x轴坐标格式化函数
  angle: 0, // x轴标签旋转角度
  tickSize: 6, // x轴刻度线大小
}
function drawScatterPlot(
  data: scatterDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, //指明原始key
  curInteractionKey: string, //指明是label还是value
  xx: string,
  yy: string,
  title: string,
  xAxis: {
    xAxisLabel?: string // x轴名称
    format?: string // x轴坐标格式化函数
    angle?: number // x轴标签旋转角度
    tickSize?: number // x轴刻度线大小
  } = xAxisAcquiesce,
  yAxis: {
    yAxisLabel?: string // y轴名称
    format?: string // y轴坐标格式化函数
    angle?: number // y轴标签旋转角度
    tickSize?: number // y轴刻度线大小
  } = yAxisAcquiesce,
  legend?: {
    open: boolean
    legendPosition: string
    legendOrientation: string
  },
  tooltip?: { open: boolean; text: string },
  color?: string[]
): void {
  const handleHover = (message: number) => {
    let formattedMessage: string | number = message

    if (typeof message === 'number') {
      // 如果 message 是数字，则格式化为保留两位小数的字符串
      formattedMessage = message.toFixed(2)
    }
    // 如果 message 是字符串，则保持不变

    const highlightMessage: messageType = {
      hoverOrNot: true,
      message: formattedMessage,
      interactionType: interactionType || 'default',
      interactionKey: interactionkey || 'default',
    }

    dispatch(
      ChangeMessageSetting({
        ...highlightMessage,
      })
    )
  }

  const handleLeave = () => {
    dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }))
  }

  const handleHoverThrottled = _.throttle(handleHover, 200)

  if (!element) {
    element = document.body.appendChild(document.createElement('span'))
  } else {
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }

  const container =
    element || document.body.appendChild(document.createElement('span'))

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = calculateMargin(
    legend?.legendPosition,
    legend?.legendOrientation
  )

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const chart = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const groups = Array.from(new Set(data.map((d) => d.label))).filter(
    Boolean
  ) as string[]
  // const labels = Array.from(new Set(data.map((d) => d.label)))

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.x) as number])
    .range([0, innerWidth])

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) as number])
    .range([innerHeight, 0])

  const customColors = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(color || d3.schemeCategory10)

  // chart
  //   .append('g')
  //   .attr('transform', `translate(0,${innerHeight})`)
  //   .call(d3.axisBottom(x))

  // chart.append('g').call(d3.axisLeft(y))
  const uniqueLabels = Array.from(new Set(data.map((d) => d.label))).filter(
    (item) => item !== null
  )
  const colorScale = d3
    .scaleOrdinal(
      color || d3.schemeCategory10 // Default to `d3.schemeCategory10` if no colors provided
    )
    .domain(uniqueLabels as string[])
  chart
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.x))
    .attr('cy', (d) => y(d.y))
    .attr('r', 5)
    .attr('class', 'dots')
    .attr('data-y', (d) => d.y.toFixed(2))
    .attr('data-x', (d) => d.x.toFixed(2))
    .attr('data-label', (d) => d.label)
    .attr('fill', (d) => colorScale(d.label as string))
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d[curInteractionKey as string])
      if (tooltip?.open) {
        const tooltipText = tooltip.text
          .replace('{x}', d.x.toString())
          .replace('{y}', d.y.toFixed(2))
          .replace('{z}', d.label || '{z}')
        tooltipElement
          .html(tooltipText)
          .style('visibility', 'visible')
          .style('top', `${event.pageY + 5}px`)
          .style('left', `${event.pageX + 5}px`)
      }
      d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .attr('r', 8)
        .attr('fill', '#3769b1')
    })
    .on('mousemove', (event) => {
      // 鼠标移动时，更新 tooltip 的位置
      tooltipElement
        .style('top', `${event.clientY + 5}px`) // 跟随鼠标垂直位置
        .style('left', `${event.clientX + 5}px`) // 跟随鼠标水平位置
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      tooltipElement.style('visibility', 'hidden')
      d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .attr('r', 5)
        .attr('fill', colorScale(d.label as string))
    })
  const tooltipElement = d3
    .select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'fixed')
    .style('visibility', 'hidden')
    .style('background', 'rgba(255, 255, 255, 0.8)') // 白色背景，透明度 80%
    .style('color', 'black') // 文字颜色为黑色
    .style('padding', '5px')
    .style('border-radius', '5px')
    .style('font-size', '12px')
    .style('pointer-events', 'none') // 防止 tooltip 阻挡鼠标事件
    .style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.2)')

  if (legend?.open) {
    const legendGroup = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')

    let legendTransform = ''
    switch (legend.legendPosition) {
      case 'top-left':
        legendTransform = `translate(1, 1)`
        break
      case 'top-right':
        legendTransform = `translate(${width - margin.right + 10}, 1)`
        break
      case 'bottom-left':
        legendTransform = `translate(20, ${height - margin.top})`
        break
      case 'bottom-right':
        legendTransform = `translate(20, ${height - margin.top})`
        break
      default:
        legendTransform = `translate(${width - margin.right}, 1)`
    }

    legendGroup.attr('transform', legendTransform)

    // Generate legend items
    const legendItems = legendGroup
      .selectAll('g')
      .data(groups.slice(0, 12))
      .enter()
      .append('g')
      .attr(
        'transform',
        (d, i) =>
          legend.legendOrientation === 'vertical'
            ? `translate(0, ${i * 20})` // 纵向排列
            : `translate(${i * 40}, 0)` // 水平排列
      )

    legendItems
      .append('rect')
      .attr('x', 0)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d) => customColors(d))

    legendItems
      .append('text')
      .attr('x', 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text((d) => {
        const text = d
        // 如果文本超过10个字符，添加省略号
        return text.length > 7 ? text.slice(0, 7) + '...' : text
      })
  }

  if (xAxis) {
    const xAxisFormat = xAxis.format || '{x}' // 默认格式 "{x}"
    const xAxisLabel = xAxis.xAxisLabel || xx // 默认标签 'x'
    const xAxisAngle = xAxis.angle || 0
    const xAxisTickSize = xAxis.tickSize || 6

    chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickFormat((d: any) => {
            // 使用 {x} 格式化
            return xAxisFormat.replace(/{x}/g, d)
          })
          .tickSize(xAxisTickSize)
      )
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('transform', `rotate(${xAxisAngle})`)

    chart
      .append('g')
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 10)
      .style('text-anchor', 'middle')
      .text(xAxisLabel)
      .style('font-size', '14px')
  }

  if (yAxis) {
    // y 轴
    const yAxisFormat = yAxis.format || '{y}' // 默认格式 "{y}"
    const yAxisLabel = yAxis.yAxisLabel || yy // 默认标签 'y'
    const yAxisAngle = yAxis.angle || 0
    const yAxisTickSize = yAxis.tickSize || 6

    chart
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d: any) => {
            // 使用 {y} 格式化
            return yAxisFormat.replace(/{y}/g, d)
          })
          .tickSize(yAxisTickSize)
      )
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('transform', `rotate(${yAxisAngle}) translate(-12, 0)`)

    chart
      .append('g')
      .append('text')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 20)
      .style('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .text(yAxisLabel)
      .style('font-size', '14px')
  }
  if (title) {
    svg
      .append('text')
      .attr('x', width / 2) // 设置x坐标为视图宽度的一半，使文本居中
      .attr('y', margin.top / 2 - 4) // 设置y坐标为顶部外边距的一半，并稍微向上一些以留出空间
      .attr('text-anchor', 'middle') // 文本锚点设置为中间对齐
      .style('font-size', '14px') // 可选：设置字体大小
      .text(title) // 设置文本内容为description
  }
}
type DataItem = {
  [key: string]: any
}
interface ScatterProps {
  data: DataItem[]
  width: string
  height: string
  left: string
  top: string
  x: string
  y: string
  z?: string
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
  groupBy: string | null
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
  title: string
}

const Scatter: React.FC<ScatterProps> = ({
  data,
  width,
  height,
  left,
  top,
  x,
  y,
  z,
  interactionType,
  interactionKey,
  allowedInteractionType,
  groupBy = null,
  transform,
  xAxis,
  yAxis,
  legend,
  tooltip,
  color,
  title,
}) => {
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const chartRef = useRef<HTMLDivElement>(null)
  const transformedData = applyTransformations(data, transform)
  const processedData = preprocessData(transformedData, x, y, groupBy, z)
  const updatedData = processedData.map((item) => ({
    x: item.label, // label 改为 x
    y: item.value, // value 改为 y
    z: item.z, // z 保持不变
    label: item.groupBy, // groupBy 改为 value
  }))

  useEffect(() => {
    if (chartRef.current) {
      let curInteractionKey
      switch (interactionKey) {
        case x:
          curInteractionKey = 'x'
          break
        case y:
          curInteractionKey = 'y'
          break
        default:
          curInteractionKey = 'x'
      }
      drawScatterPlot(
        updatedData,
        chartRef.current,
        dispatch,
        interactionType,
        interactionKey,
        curInteractionKey,
        x,
        y,
        title,
        xAxis,
        yAxis,
        legend,
        tooltip,
        color
      )
    }
  }, [data])

  useEffect(() => {
    if (curMessage === undefined) {
      return
    }
    if (curMessage.interactionKey !== undefined) {
      if (
        !data.length ||
        !Object.keys(data[0]).includes(curMessage.interactionKey)
      ) {
        return
      }
    }

    if (
      !allowedInteractionType ||
      curMessage.interactionType === allowedInteractionType
    ) {
      d3.select(chartRef.current).selectAll('.dots').style('opacity', 0.3)
      d3.select(chartRef.current)
        .selectAll('.dots')
        .filter(function () {
          if (x === curMessage.interactionKey)
            return +d3.select(this).attr('data-x') == curMessage.message
          else if (y === curMessage.interactionKey)
            return +d3.select(this).attr('data-y') == curMessage.message
          else return d3.select(this).attr('data-label') == curMessage.message
        })
        .style('opacity', 1)
    }
  }, [curMessage])
  useEffect(() => {
    if (curMessage.hoverOrNot === undefined) {
      return
    }
    if (!curMessage.hoverOrNot) {
      d3.select(chartRef.current)
        .selectAll('*:not(.tooltip)')
        .style('opacity', 1)
    }
  }, [curMessage.hoverOrNot])

  return (
    <ReduxProviderWrapper>
      <div
        ref={chartRef}
        style={{
          width: width,
          height: height,
          position: 'absolute',
          left: left,
          top: top,
        }}></div>
    </ReduxProviderWrapper>
  )
}
const ScatterWithRedux: React.FC<ScatterProps> = (props) => (
  <ReduxProviderWrapper>
    <Scatter {...props} />
  </ReduxProviderWrapper>
)

const ScatterWithWrapper: React.FC<figWrapperProps & ScatterProps> = ({
  data,
  width,
  height,
  left,
  top,
  offsetLeft,
  offsetTop,
  id,
  x,
  y,
  z,
  interactionType,
  interactionKey,
  allowedInteractionType,
  // allowedinteractionKey
  groupBy = null,
  transform,
  xAxis,
  yAxis,
  legend,
  tooltip,
  color,
  title,
}) => {
  // Calculate new width and height
  const newWidth = `100%`
  const newHeight = `95%`
  const newLeft = '10px'
  const newTop = '10px'

  return (
    <WrapperWithButton
      width={width}
      height={height}
      id={id}
      left={left} // Fixed left position
      top={top} // Fixed top position
      offsetLeft={offsetLeft}
      offsetTop={offsetTop}>
      <ScatterWithRedux
        data={data}
        width={newWidth}
        height={newHeight}
        left={newLeft}
        top={newTop}
        x={x}
        y={y}
        z={z}
        interactionType={interactionType}
        interactionKey={interactionKey}
        allowedInteractionType={allowedInteractionType}
        // allowedinteractionKey={allowedinteractionKey}
        groupBy={groupBy}
        transform={transform}
        xAxis={xAxis}
        yAxis={yAxis}
        legend={legend}
        tooltip={tooltip}
        color={color}
        title={title}
      />
    </WrapperWithButton>
  )
}

export default ScatterWithWrapper

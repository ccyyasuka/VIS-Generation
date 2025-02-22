import * as d3 from 'd3'
import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _, { transform } from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'
import applyTransformations from './tools/transformApply'
import preprocessData from './tools/preprocess'
// 1
type BarDataItem = {
  // qqqq
  label: string
  value: number
  groupBy: string | null
  [key: string]: any
}
const legendAcquiesce = {
  open: true,
  legendPosition: 'top-left',
  legendOrientation: 'vertical',
}
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
// 1
function drawBarChart(
  data: BarDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string,
  curInteractionKey: string,
  xx: string,
  yy: string,
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
  legend: {
    open: boolean
    legendPosition: string
    legendOrientation: string
  } = legendAcquiesce,
  tooltip?: { open: boolean; text: string },
  color?: string[]
): void {
  // ...保持原有的 handleHover 和 handleLeave 函数不变...
  const handleHover = (message: number) => {
    let formattedMessage: string | number = message;

  if (typeof message === 'number') {
    // 如果 message 是数字，则格式化为保留两位小数的字符串
    formattedMessage = message.toFixed(2);
  }
  // 如果 message 是字符串，则保持不变

  const highlightMessage: messageType = {
    hoverOrNot: true,
    message: formattedMessage,
    interactionType: interactionType || 'default',
    interactionKey: interactionkey || 'default',
  };
    dispatch(
      ChangeMessageSetting({
        ...highlightMessage,
      })
    )
  }
  const handleHoverThrottled = _.throttle(handleHover, 200)

  const handleLeave = () => {
    dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }))
  }
  if (!element)
    element = document.body.appendChild(document.createElement('span'))
  else while (element.firstChild) element.removeChild(element.firstChild)

  const container = element
  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 30, right: 30, bottom: 40, left: 60 }

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

  // 新增分组逻辑
  const groups = Array.from(new Set(data.map((d) => d.groupBy))).filter(
    Boolean
  ) as string[]
  const labels = Array.from(new Set(data.map((d) => d.label)))

  // 创建嵌套比例尺
  const x0 = d3
    .scaleBand()
    .domain(labels)
    .range([0, innerWidth])
    .paddingInner(0.1)

  const x1 = d3
    .scaleBand()
    .domain(groups)
    .range([0, x0.bandwidth()])
    .padding(0.05)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])

  // 颜色比例尺
  // 1
  const customColors = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(color || d3.schemeCategory10)

  // 绘制柱子
  chart
    .selectAll('.bar-group')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar-group')
    .attr('x', (d) => x0(d.label)! + x1(d.groupBy!)!)
    .attr('y', (d) => y(d.value))
    .attr('width', x1.bandwidth())
    .attr('height', (d) => innerHeight - y(d.value))
    .attr('fill', (d) => customColors(d.groupBy!))
    .attr('data-value', (d) => d.value.toFixed(2))
    .attr('data-label', (d) => d.label)
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d[curInteractionKey])
      if (tooltip?.open) {
        const tooltipText = tooltip.text
          .replace('{x}', d.label)
          .replace('{y}', d.value.toFixed(2))
        tooltipElement
          .html(tooltipText)
          .style('visibility', 'visible')
          .style('top', `${event.pageY + 5}px`)
          .style('left', `${event.pageX + 5}px`)
      }
      d3.select(event.currentTarget).transition().style('opacity', 1)
      d3.selectAll('.bar-group')
        .filter((n) => n !== d)
        .transition()
        .style('opacity', 0.6)
    })
    .on('mousemove', (event) => {
      // 鼠标移动时，更新 tooltip 的位置
      tooltipElement
        .style('top', `${event.clientY + 5}px`) // 跟随鼠标垂直位置
        .style('left', `${event.clientX + 5}px`) // 跟随鼠标水平位置
    })
    .on('mouseleave', () => {
      handleLeave()
      tooltipElement.style('visibility', 'hidden')
      d3.selectAll('.bar-group').transition().style('opacity', 1)
    })

  // 添加坐标轴
  // chart
  //   .append('g')
  //   .attr('transform', `translate(0,${innerHeight})`)
  //   .call(d3.axisBottom(x0))

  // chart.append('g').call(d3.axisLeft(y))

  // 1
  // ##############################################################################
  // 添加图例（可选）
  if (legend?.open) {
    const legendGroup = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')

    // 控制图例的定位
    let legendTransform = ''
    switch (legend.legendPosition) {
      case 'top-left':
        legendTransform = `translate(5, 1)`
        break
      case 'top-right':
        legendTransform = `translate(${width - 150}, 1)`
        break
      case 'bottom-left':
        legendTransform = `translate(20, ${height - 10})`
        break
      case 'bottom-right':
        legendTransform = `translate(${width - 100}, ${height - 10})`
        break
      default:
        legendTransform = `translate(${width - 150}, 2)`
    }

    legendGroup.attr('transform', legendTransform)

    // 控制图例项的排列方式
    const legendItems = legendGroup
      .selectAll('g')
      .data(groups)
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
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', (d) => customColors(d))

    legendItems
      .append('text')
      .attr('x', 12)
      .attr('y', 7.5)
      .attr('dy', '0.32em')
      .text((d) => {
        const text = d
        // 如果文本超过10个字符，添加省略号
        return text.length > 3 ? text.slice(0, 3) + '...' : text
      })
  }

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

  // 添加坐标轴
  // x 轴
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
          .axisBottom(x0)
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
}

// 1
type DataItem = {
  [key: string]: any
}
interface BarProps {
  data: DataItem[]
  width: string
  height: string
  left: string
  top: string
  x: string
  y: string
  interactionType: string
  interactionKey: string
  allowedinteractionType: string
  // allowedinteractionKey: string
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
}
// 1
const Bar: React.FC<BarProps> = ({
  data,
  width,
  height,
  left,
  top,
  x,
  y,
  interactionType,
  interactionKey,
  allowedinteractionType,
  groupBy = null,
  transform,
  xAxis,
  yAxis,
  legend,
  tooltip,
  color,
}) => {
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const chartRef = useRef<HTMLDivElement>(null)
  // 1
  const transformedData = applyTransformations(data, transform)
  const processedData = preprocessData(transformedData, x, y, groupBy)

  useEffect(() => {
    if (chartRef.current) {
      // 1
      let curInteractionKey = interactionKey === x ? 'label' : 'value'
      drawBarChart(
        processedData,
        chartRef.current,
        dispatch,
        interactionType,
        interactionKey,
        curInteractionKey,
        x,
        y,
        xAxis,
        yAxis,
        legend,
        tooltip,
        color
      )
    }
  }, [data]) // Dependency array: Redraw chart if 'data' changes
  // 处理接收信息
  React.useEffect(() => {
    // qqqq
    console.log('接收到了信息', curMessage)
    console.log(curMessage.interactionType, curMessage.interactionKey)
    if (curMessage === undefined) {
      return
    }
    if (!allowedinteractionType) {
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

    if (curMessage.interactionType === allowedinteractionType) {
      // qqqq
      d3.select(chartRef.current).selectAll('.bars').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.bars')
        .filter(function () {
          if (x === curMessage.interactionKey)
            return +d3.select(this).attr('data-label') === curMessage.message
          else return +d3.select(this).attr('data-value') === curMessage.message
        })
        .style('opacity', 1)
    }
  }, [curMessage])

  // 处理透明度
  React.useEffect(() => {
    // if (!interactiveRef.current) {
    //   return
    // }
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
    <div
      ref={chartRef}
      style={{
        width: width,
        height: height,
        // qqqq
        position: 'absolute',
        left: left,
        top: top,
      }}></div>
  )
}

const BarWithRedux: React.FC<BarProps> = (props) => (
  <ReduxProviderWrapper>
    <Bar {...props} />
  </ReduxProviderWrapper>
)
// 1
const BarWithWrapper: React.FC<figWrapperProps & BarProps> = ({
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
  interactionType,
  interactionKey,
  allowedinteractionType,
  // allowedinteractionKey
  groupBy = null,
  transform,
  xAxis,
  yAxis,
  legend,
  tooltip,
  color,
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
      <BarWithRedux
        data={data}
        width={newWidth}
        height={newHeight}
        left={newLeft}
        top={newTop}
        x={x}
        y={y}
        interactionType={interactionType}
        interactionKey={interactionKey}
        allowedinteractionType={allowedinteractionType}
        // allowedinteractionKey={allowedinteractionKey}
        groupBy={groupBy}
        // 1
        transform={transform}
        xAxis={xAxis}
        yAxis={yAxis}
        legend={legend}
        tooltip={tooltip}
        color={color}
      />
    </WrapperWithButton>
  )
}

export default BarWithWrapper
// export default Bar

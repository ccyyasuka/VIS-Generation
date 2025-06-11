import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'
import applyTransformations from './tools/transformApply'
import preprocessData from './tools/preprocess'
import calculateMargin from './tools/calMargin'

// 数据类型定义
type BarDataItem = {
  label: string
  value: number
  groupBy: string | null
  [key: string]: any
}

// 默认配置
const legendAcquiesce = {
  open: true,
  legendPosition: 'top-right',
  legendOrientation: 'vertical',
}

const xAxisAcquiesce = {
  xAxisLabel: '',
  angle: 0,
  tickSize: 6,
}

const yAxisAcquiesce = {
  yAxisLabel: '',
  angle: 0,
  tickSize: 6,
}

// 绘制柱状图函数
function drawBarChart(
  data: BarDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionKey: string,
  curInteractionKey: string,
  xx: string,
  yy: string,
  title: string,
  xAxis: {
    xAxisLabel?: string
    format?: string
    angle?: number
    tickSize?: number
  } = xAxisAcquiesce,
  yAxis: {
    yAxisLabel?: string
    format?: string
    angle?: number
    tickSize?: number
  } = yAxisAcquiesce,
  legend: {
    open: boolean
    legendPosition: string
    legendOrientation: string
  } = legendAcquiesce,
  tooltip?: { open: boolean; text: string },
  color?: string[]
): void {
  // 处理鼠标悬停事件
  const handleHover = (message: number | string) => {
    const formattedMessage =
      typeof message === 'number' ? message.toFixed(2) : message
    const highlightMessage: messageType = {
      hoverOrNot: true,
      message: formattedMessage,
      interactionType: interactionType || 'default',
      interactionKey: interactionKey || 'default',
    }
    dispatch(ChangeMessageSetting(highlightMessage))
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

  const groups = Array.from(new Set(data.map((d) => d.groupBy))).filter(
    Boolean
  ) as string[]
  const labels = Array.from(new Set(data.map((d) => d.label)))

  const x0 = d3
    .scaleBand()
    .domain(labels)
    .range([0, innerWidth])
    .paddingInner(0.05)

  const x1 = d3
    .scaleBand()
    .domain(groups)
    .range([0, x0.bandwidth()])
    .padding(0.01)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])

  const customColors = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(color || d3.schemeCategory10)
  debugger

  // 绘制柱子

  chart
    .selectAll('.bar-group')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar-group')
    .attr('x', (d) => {
      // 先进行类型判断，确保 d.label 和 d.groupBy 存在
      if (d.label) {
        if (d.groupBy === null) {
          // 当 groupBy 为 null 时，柱子在 x0 上定位
          return x0(d.label)!
        } else {
          // 当 groupBy 不为 null 时，柱子在 x0 和 x1 上定位
          return x0(d.label)! + (d.groupBy ? x1(d.groupBy)! : 0) // 如果 groupBy 为 null，给它一个 0 值
        }
      }
      return 0 // 防止 undefined 错误，返回一个默认位置
    })
    .attr('y', (d) => y(d.value))
    .attr('width', (d) => (d.groupBy ? x1.bandwidth() : x0.bandwidth()))
    .attr('height', (d) => innerHeight - y(d.value))
    .attr('fill', (d) => customColors(d.groupBy!))
    .attr('data-value', (d) => d.value.toFixed(2))
    .attr('data-label', (d) => d.label)
    .on('mouseenter', (event, d) => {
      const currentBar = d3.select(event.currentTarget)
      currentBar.transition().style('opacity', 1)
      d3.select(event.currentTarget.parentNode)
        .selectAll('.bar-group')
        .filter((node) => node !== d)
        .transition()
        .style('opacity', 0.6)
      // 传递完整的交互信息
      handleHoverThrottled(d[curInteractionKey])
      // 添加当前图表的信息到消息中

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
    })
    .on('mousemove', (event, d) => {
      tooltipElement
        .style('top', `${event.clientY + 5}px`) // 跟随鼠标垂直位置
        .style('left', `${event.clientX + 5}px`) // 跟随鼠标水平位置
    })
    .on('mouseleave', () => {
      handleLeave()
      tooltipElement.style('visibility', 'hidden')
    })

  // chart
  //   .selectAll('.bar-group')
  //   .data(data)
  //   .enter()
  //   .append('rect')
  //   .attr('class', 'bar-group')
  //   .attr('x', (d) => (d.label ? (d.groupBy === null ? x0(d.label)! : x0(d.label)! + (d.groupBy ? x1(d.groupBy)! : 0)) : 0)
  //   .attr('y', (d:BarDataItem) => y(d.value))
  //   .attr('width', (d:BarDataItem) => (d.groupBy ? x1.bandwidth() : x0.bandwidth()))
  //   .attr('height', (d:BarDataItem) => innerHeight - y(d.value))
  //   .attr('fill', (d:BarDataItem) => customColors(d.groupBy!))
  //   .attr('data-value', (d:BarDataItem) => d.value.toFixed(2))
  //   .attr('data-label', (d:BarDataItem) => d.label)
  //   .on('mouseenter', (event, d:BarDataItem) => {
  //     handleHoverThrottled(d[curInteractionKey]);
  //     if (tooltip?.open) {
  //       const tooltipText = tooltip.text.replace('{x}', d.label).replace('{y}', d.value.toFixed(2));
  //       tooltipElement
  //         .html(tooltipText)
  //         .style('visibility', 'visible')
  //         .style('top', `${event.pageY + 5}px`)
  //         .style('left', `${event.pageX + 5}px`);
  //     }
  //   })
  //   .on('mousemove', (event, d) => {
  //     tooltipElement
  //       .style('top', `${event.clientY + 5}px`)
  //       .style('left', `${event.clientX + 5}px`);
  //   })
  //   .on('mouseleave', () => {
  //     handleLeave();
  //     tooltipElement.style('visibility', 'hidden');
  //   });

  // 添加图例
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

    const legendItems = legendGroup
      .selectAll('g')
      .data(groups)
      .enter()
      .append('g')
      .attr('transform', (d, i) =>
        legend.legendOrientation === 'vertical'
          ? `translate(0, ${i * 20})`
          : `translate(${i * 40}, 0)`
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
      .text((d) => (d.length > 7 ? d.slice(0, 7) + '...' : d))
  }

  // 添加工具提示
  const tooltipElement = d3
    .select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'fixed')
    .style('visibility', 'hidden')
    .style('background', 'rgba(255, 255, 255, 0.8)')
    .style('color', 'black')
    .style('padding', '5px')
    .style('border-radius', '5px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('box-shadow', '0px 4px 8px rgba(0, 0, 0, 0.2)')

  // 添加坐标轴
  if (xAxis) {
    const xAxisFormat = xAxis.format || '{x}'
    const xAxisLabel = xAxis.xAxisLabel || xx
    const xAxisAngle = xAxis.angle || 0
    const xAxisTickSize = xAxis.tickSize || 6

    const xValues = data.map((d) => d.label)
    const temp = Math.floor(xValues.length / 3)
    const selectedTicks = xValues.filter((d, i) => i % temp === 0)

    chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x0)
          .tickValues(selectedTicks)
          .tickFormat((d) => xAxisFormat.replace(/{x}/g, d))
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
    const yAxisFormat = yAxis.format || '{y}'
    const yAxisLabel = yAxis.yAxisLabel || yy
    const yAxisAngle = yAxis.angle || 0
    const yAxisTickSize = yAxis.tickSize || 6

    chart
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d: any) => yAxisFormat.replace(/{y}/g, d))
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
      .attr('x', width / 2)
      .attr('y', margin.top / 2 - 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text(title)
  }
}

// 组件属性定义
type DataItem = {
  [key: string]: any
}

interface BarProps {
  data: DataItem[]
  title: string
  width: string
  height: string
  left: string
  top: string
  x: string
  y: string
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
    label?: string
    format?: string
    angle?: number
    tickSize?: number
  }
  yAxis?: {
    label?: string
    format?: string
    angle?: number
    tickSize?: number
  }
  legend?: { open: boolean; legendPosition: string; legendOrientation: string }
  tooltip?: { open: boolean; text: string }
  color?: string[]
}

// Bar组件
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

  // debugger
  const transformedData = applyTransformations(data, transform)
  const processedData = preprocessData(transformedData, x, y, groupBy)

  useEffect(() => {
    if (chartRef.current) {
      let curInteractionKey = interactionKey === y ? 'value' : 'label'
      drawBarChart(
        processedData,
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

  React.useEffect(() => {
    if (!curMessage || !curMessage.hoverOrNot) return

    if (
      curMessage.interactionType !== allowedInteractionType ||
      curMessage.interactionKey !== interactionKey
    )
      return

    const currentChart = d3.select(chartRef.current)
    currentChart.selectAll('.bar-group').style('opacity', 0.6)

    currentChart
      .selectAll('.bar-group')
      .filter(function () {
        const element = d3.select(this)
        return interactionKey === y
          ? +element.attr('data-value') === curMessage.message
          : element.attr('data-label') === curMessage.message
      })
      .style('opacity', 1)
  }, [curMessage])

  React.useEffect(() => {
    if (curMessage.hoverOrNot === undefined) return
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
        position: 'absolute',
        left: left,
        top: top,
      }}></div>
  )
}

// 包装组件
const BarWithRedux: React.FC<BarProps> = (props) => (
  <ReduxProviderWrapper>
    <Bar {...props} />
  </ReduxProviderWrapper>
)

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
  const newWidth = `100%`
  const newHeight = `95%`
  const newLeft = '10px'
  const newTop = '10px'

  return (
    <WrapperWithButton
      width={width}
      height={height}
      id={id}
      left={left}
      top={top}
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
        allowedInteractionType={allowedInteractionType}
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

export default BarWithWrapper

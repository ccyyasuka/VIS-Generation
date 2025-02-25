import * as d3 from 'd3'
import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'
import applyTransformations from './tools/transformApply'
import preprocessData from './tools/preprocess'
import calculateMargin from './tools/calMargin'
type LineDataItem = {
  label: string // Typically, this would be a category or time point
  value: number // Value for that point
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
function drawLineChart(
  data: LineDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, // 指明原始key
  curInteractionKey: string, // 指明是label还是value
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
  legend: {
    open: boolean
    legendPosition: string
    legendOrientation: string
  } = legendAcquiesce,
  tooltip?: { open: boolean; text: string },
  color?: string[]
): void {
  if (!element) {
    // 如果没有提供元素，则在 body 中追加一个新的 div
    element = document.body.appendChild(document.createElement('div'))
  } else {
    // 清空元素内容
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }
  const handleHover = (message: number | string) => {
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

  if (!element)
    element = document.body.appendChild(document.createElement('span'))
  else while (element.firstChild) element.removeChild(element.firstChild)

  // 设置图表的尺寸和边距
  const container = element
  const width = container.clientWidth // 使用容器的宽度
  const height = container.clientHeight // 使用容器的高度
  const margin = calculateMargin(
    legend?.legendPosition,
    legend?.legendOrientation
  )

  // 在容器中创建 SVG 元素
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
  const x = d3.scaleBand().domain(labels).range([0, innerWidth]).padding(0.1)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])

  // 颜色比例尺
  const customColors = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(color || d3.schemeCategory10)

  // 按组绘制折线

  groups.forEach((group) => {
    const groupData = data.filter((d) => d.groupBy === group)

    // 添加折线
    chart
      .append('path')
      .datum(groupData)
      .attr('fill', 'none')
      .attr('stroke', customColors(group))
      .attr('stroke-width', 1.5)
      .attr('class', 'lines')
      .attr(
        'd',
        d3
          .line<LineDataItem>()
          .x((d) => (x(d.label) as number) + x.bandwidth() / 2) // 在 band 中居中
          .y((d) => y(d.value))
      )

    // 添加数据点
    chart
      .selectAll(`.points-${group}`)
      .data(groupData)
      .enter()
      .append('circle')
      .attr('cx', (d) => (x(d.label) as number) + x.bandwidth() / 2)
      .attr('cy', (d) => y(d.value))
      .attr('r', 3) // 点的半径
      .attr('fill', customColors(group)) // 点的颜色
      .attr('class', `points points-${group}`)
      .attr('data-value', (d) => d.value.toFixed(2))
      .attr('data-label', (d) => d.label)
      .on('mouseenter', (event, d) => {
        handleHoverThrottled(d[curInteractionKey as string])
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
        svg
          .selectAll('circle')
          .transition()
          .duration(150)
          .style('opacity', function () {
            return this === event.currentTarget ? '1' : '0.618' // 当前点保持不变，其他点透明度为 0.618
          })
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
        svg.selectAll('circle').transition().duration(150).style('opacity', '1') // 恢复透明度
      })
  })

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
        legendTransform = `translate(1, 1)`
        break
      case 'top-right':
        legendTransform = `translate(${width - margin.right}, 1)`
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

    // 假设 x 是时间点的数组，像 ['2021-01-01', '2021-01-02', ...]
    const xValues = data.map((d) => d.label) // 获取所有时间点
    const temp = Math.floor(xValues.length / 3)

    // 选择显示的刻度数量，比如每隔一个或两个点显示一个刻度
    const selectedTicks = xValues.filter((d, i) => i % temp === 0) // 每隔一个时间点显示一个

    chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(selectedTicks) // 使用手动选择的时间点
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
interface LineProps {
  data: DataItem[]
  width: string
  height: string
  left: string
  top: string
  x: string
  y: string
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
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
  title: string
}

const Line: React.FC<LineProps> = ({
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
  const chartRef = useRef<HTMLDivElement>(null)
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const dispatch = useDispatch()
  const transformedData = applyTransformations(data, transform)
  const processedData = preprocessData(transformedData, x, y, groupBy)
  useEffect(() => {
    if (chartRef.current) {
      let curInteractionKey = interactionKey === y ? 'value' : 'label'
      drawLineChart(
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
  }, [data]) // Dependency array: Redraw chart if 'data' changes
  React.useEffect(() => {
    // console.log("debug-data-value", interactionType, message)
    console.log('接收到了信息', curMessage)
    if (curMessage === undefined) {
      return
    }
    console.log(curMessage.interactionType, allowedInteractionType)
    if (!allowedInteractionType) {
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

    if (curMessage.interactionType === allowedInteractionType) {
      // console.log("debug-data-value", message)
      d3.select(chartRef.current).selectAll('.points').style('opacity', 0.3)
      d3.select(chartRef.current).selectAll('.lines').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.points')
        .filter(function () {
          if (x === curMessage.interactionKey)
            return d3.select(this).attr('data-label') === curMessage.message
          else return +d3.select(this).attr('data-value') === curMessage.message
        })
        .style('opacity', 1)
    }
  }, [curMessage])
  React.useEffect(() => {
    // if (!interactiveRef.current) {
    //   return
    // }
    if (curMessage.hoverOrNot === undefined) {
      return
    }
    if (!curMessage.hoverOrNot) {
      // noHighlightElement(interactiveRef.current)
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

const LineWithRedux: React.FC<LineProps> = (props) => (
  <ReduxProviderWrapper>
    <Line {...props} />
  </ReduxProviderWrapper>
)

const BarWithWrapper: React.FC<figWrapperProps & LineProps> = ({
  data,
  width,
  height,
  left,
  top,
  offsetLeft,
  offsetTop,
  x,
  y,
  id,
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
      <LineWithRedux
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

export default BarWithWrapper

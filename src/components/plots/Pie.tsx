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
type PieDataItem = {
  label: string
  value: number
  [key: string]: any
}

function drawPieChart(
  data: PieDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, //指明原始key
  curInteractionKey: string, //指明是label还是value
  xx: string,
  yy: string,
  title: string,
  xAxis?: {
    xAxisLabel?: string // x轴名称
    format?: string // x轴坐标格式化函数
    angle?: number // x轴标签旋转角度
    tickSize?: number // x轴刻度线大小
  },
  yAxis?: {
    yAxisLabel?: string // y轴名称
    format?: string // y轴坐标格式化函数
    angle?: number // y轴标签旋转角度
    tickSize?: number // y轴刻度线大小
  },
  legend?: { open: boolean; legendPosition: string; legendOrientation: string },
  tooltip?: { open: boolean; text: string },
  color?: string[]
): void {
  if (!element) {
    // If no element provided, append a new div to the body
    element = document.body.appendChild(document.createElement('div'))
  } else {
    // Clear the element contents
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }
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

    // if (setHighlightMessage) setHighlightMessage(highlightMessage)
  }
  const handleLeave = () => {
    dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }))
  }
  const handleHoverThrottled = _.throttle(handleHover, 200)
  if (!element)
    element = document.body.appendChild(document.createElement('span'))
  else while (element.firstChild) element.removeChild(element.firstChild)
  const container = element
  const width = container.clientWidth
  const height = container.clientHeight
  const marginTop = 60 // 预留空间给标题
  const radius = Math.min(width, height - marginTop) / 2

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

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const customColors = d3.scaleOrdinal(d3.schemeCategory10)

  const pie = d3
    .pie<PieDataItem>()
    .sort(null)
    .value((d) => d.value)

  const arc = d3
    .arc<d3.PieArcDatum<PieDataItem>>()
    .innerRadius(0)
    .outerRadius(radius)

  const arcs = svg
    .selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc')
  console.log('debug-pie(data)', pie(data))
  arcs
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => customColors(i.toString()))
    .attr('class', 'arcs')
    .attr('data-value', (d) => d.value.toFixed(2))
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d.data[curInteractionKey])
      if (tooltip?.open) {
        const tooltipText = tooltip.text.replace('{y}', d.value.toFixed(2))
        tooltipElement
          .html(tooltipText)
          .style('visibility', 'visible')
          .style('top', `${event.pageY + 5}px`)
          .style('left', `${event.pageX + 5}px`)
      }
      // debugger
      let a = svg.selectAll('.arcs')
      svg
        .selectAll('.arcs')
        .transition()
        .duration(150)
        .style('opacity', function () {
          // debugger
          return this === event.currentTarget ? '1' : '0.618' // 对当前rect保持不变，其他的设置透明度为0.618
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
      svg.selectAll('rect').transition().duration(150).style('opacity', '1') // 保证透明度回到1
    })

  arcs
    .append('text')
    .attr('transform', (d) => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .text((d) => d.data.label)

  if (title) {
    d3.select(container)
      .select('svg')
      .append('text')
      .attr('x', width / 2)
      .attr('y', marginTop / 4) // 让标题在上方居中
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text(title)
  }
}
type DataItem = {
  [key: string]: any
}
interface PieProps {
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

const Pie: React.FC<PieProps> = ({
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
  const chartRef = useRef<HTMLDivElement>(null)
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const dispatch = useDispatch()

  const transformedData = applyTransformations(data, transform)
  const processedData = preprocessData(transformedData, x, y, groupBy)
  useEffect(() => {
    if (chartRef.current) {
      let curInteractionKey = interactionKey === x ? 'label' : 'value'
      drawPieChart(
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
      // console.log("debug-data-value", message)
      d3.select(chartRef.current).selectAll('.arcs').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.arcs')
        .filter(function () {
          console.log(+d3.select(this).attr('data-value'))
          if (x === curMessage.interactionKey)
            return +d3.select(this).attr('data-label') === curMessage.message
          else return +d3.select(this).attr('data-value') == curMessage.message
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

const PieWithRedux: React.FC<PieProps> = (props) => (
  <ReduxProviderWrapper>
    <Pie {...props} />
  </ReduxProviderWrapper>
)

const PieWithWrapper: React.FC<figWrapperProps & PieProps> = ({
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
      <PieWithRedux
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

export default PieWithWrapper

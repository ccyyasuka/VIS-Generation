import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'
type BarDataItem = {
  // qqqq
  label: string
  value: number
  groupBy: string | null
  [key: string]: any
}
// 横向柱状图
function drawBarChart(
  data: BarDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, // 指明原始key
  curInteractionKey: string // 指明是label还是value
): void {
  const handleHover = (message: number) => {
    const highlightMessage: messageType = {
      hoverOrNot: true,
      message: parseFloat(message.toFixed(2)),
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
    // If no element provided, append a new span to the body
    element = document.body.appendChild(document.createElement('span'))
  } else {
    // Clear the element contents
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }

  const container = element

  // Set dimensions and margins of the graph
  const width = container.clientWidth // Use the width of the container
  const height = container.clientHeight // Use the height of the container
  const margin = { top: 20, right: 20, bottom: 40, left: 20 }

  // Create SVG element inside the container
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
  const y0 = d3
    .scaleBand()
    .domain(labels)
    .range([0, innerHeight])
    .paddingInner(0.1)

  const y1 = d3
    .scaleBand()
    .domain(groups)
    .range([0, y0.bandwidth()])
    .padding(0.05)

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([0, innerWidth])

  // 颜色比例尺
  const color = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(d3.schemeCategory10)

  // 绘制柱子
  chart
    .selectAll('.bar-group')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar-group')
    .attr('y', (d) => y0(d.label)! + y1(d.groupBy!)!)
    .attr('x', 0)
    .attr('width', (d) => x(d.value))
    .attr('height', y1.bandwidth())
    .attr('fill', (d) => color(d.groupBy!))
    .attr('data-value', (d) => d.value.toFixed(2))
    .attr('data-label', (d) => d.label)
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d[curInteractionKey as string])
      d3.select(event.currentTarget).transition().style('opacity', 1)
      d3.selectAll('.bar-group')
        .filter((n) => n !== d)
        .transition()
        .style('opacity', 0.6)
    })
    .on('mouseleave', () => {
      handleLeave()
      d3.selectAll('.bar-group').transition().style('opacity', 1)
    })

  // 添加坐标轴
  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  chart.append('g').call(d3.axisLeft(y0))

  // 添加图例（可选）
  const legend = svg
    .append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'start')
    .selectAll('g')
    .data(groups)
    .enter()
    .append('g')
    .attr('transform', (d, i) => `translate(${width - 100},${i * 20})`)

  legend
    .append('rect')
    .attr('x', 0)
    .attr('width', 19)
    .attr('height', 19)
    .attr('fill', color)

  legend
    .append('text')
    .attr('x', 24)
    .attr('y', 9.5)
    .attr('dy', '0.32em')
    .text((d) => d)
}
// qqqq
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
  groupBy: string | null
}
// qqqq
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
}) => {
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const chartRef = useRef<HTMLDivElement>(null)
  // qqqq
  function preprocessData() {
    console.log('item0205', data, x, y)
    return data.map((item) => {
      // 判断 item 中是否有 category 这个键
      if (groupBy && item.hasOwnProperty(groupBy)) {
        return {
          label: item[x].toString(),
          value: item[y] as number,
          groupBy: item[groupBy] as string,
        }
      } else {
        return {
          label: item[x].toString(),
          value: item[y] as number,
          groupBy: null,
        }
      }
    })
  }

  useEffect(() => {
    if (chartRef.current) {
      // qqqq
      let curInteractionKey = interactionKey === x ? 'label' : 'value'
      drawBarChart(
        preprocessData(),
        chartRef.current,
        dispatch,
        interactionType,
        interactionKey,
        curInteractionKey
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
          console.log(+d3.select(this).attr('data-value'))
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
      />
    </WrapperWithButton>
  )
}

export default BarWithWrapper
// export default Bar

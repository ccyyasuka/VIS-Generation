import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
type DataItem = {
  label: string
  value: number
}

function drawBarChart(
  data: DataItem[],
  element?: HTMLSpanElement,
  dispatch?: any,
  interactionType?: string
): void {
  const handleHover = (message: number) => {
    const highlightMessage: messageType = {
      hoverOrNot: true,
      message: parseFloat(message.toFixed(2)),
      interactionType: interactionType || 'default',
    }
    highlightMessage.interactionType = 'ByValue'

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
  if (!element) {
    // If no element provided, append a new span to the body
    element = document.body.appendChild(document.createElement('span'))
  } else {
    // Clear the element contents
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }

  const container =
    element || document.body.appendChild(document.createElement('span'))

  // Set dimensions and margins of the graph
  const width = container.clientWidth // Use the width of the container
  const height = container.clientHeight // Use the height of the container
  const margin = { top: 20, right: 30, bottom: 40, left: 90 }

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

  // Create X axis
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([0, innerWidth])
  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  // Create Y axis
  const y = d3
    .scaleBand()
    .range([0, innerHeight])
    .domain(data.map((d) => d.label))
    .padding(0.1)
  chart.append('g').call(d3.axisLeft(y))

  // Bars
  chart
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', (d) => y(d.label) as number)
    .attr('width', (d) => x(d.value))
    .attr('height', y.bandwidth())
    .attr('fill', '#69b3a2')
    .attr('class', 'bars')
    .attr('data-value', (d) => d.value.toFixed(2))
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d.value)
      svg
        .selectAll('rect')
        .transition()
        .duration(150)
        // .attr('fill', function () {
        // 	return this === event.currentTarget ? '#3769b1' : '#cbd7ed'; // 对当前rect保持不变，其他的设置透明度为0.618
        // }) // 当鼠标悬停时设置颜色为 #3769b1
        .style('opacity', function () {
          return this === event.currentTarget ? '1' : '0.618' // 对当前rect保持不变，其他的设置透明度为0.618
        })
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      svg.selectAll('rect').transition().duration(150).style('opacity', '1') // 保证透明度回到1
    })
}

interface BarProps {
  data: DataItem[]
  width: string
  height: string
  left: string
  top: string
  position: 'absolute' | 'fixed'
  interactionType?: string
  allowedinteractionType?: string
}

const Bar: React.FC<BarProps> = ({
  data,
  width,
  height,
  left,
  top,
  position,
  interactionType,
  allowedinteractionType,
}) => {
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chartRef.current) {
      drawBarChart(data, chartRef.current, dispatch, interactionType)
    }
  }, [data]) // Dependency array: Redraw chart if 'data' changes
  React.useEffect(() => {
    // console.log("debug-data-value", interactionType, message)
    console.log('接收到了信息', curMessage)
    console.log(curMessage.interactionType, allowedinteractionType)
    if (curMessage === undefined) {
      return
    }
    if (!allowedinteractionType) {
      return
    }

    if (curMessage.interactionType === allowedinteractionType) {
      // console.log("debug-data-value", message)
      d3.select(chartRef.current).selectAll('.bars').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.bars')
        .filter(function () {
          console.log(+d3.select(this).attr('data-value'))
          return +d3.select(this).attr('data-value') === curMessage.message
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
    <div
      ref={chartRef}
      style={{
        width: width,
        height: height,
        position: position,
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

export default BarWithRedux
// export default Bar

import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
type DataItem = {
  label: string // Typically, this would be a category or time point
  value: number // Value for that point
}

function drawLineChart(
  data: DataItem[],
  element?: HTMLDivElement,
  dispatch?: any
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
    const highlightMessage: messageType = {
      hoverOrNot: true,
      message: parseFloat(message.toFixed(2)),
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

  // Set dimensions and margins of the graph
  const width = element.clientWidth // Use the width of the container
  const height = element.clientHeight // Use the height of the container
  const margin = { top: 20, right: 30, bottom: 40, left: 90 }

  // Create SVG element inside the container
  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const chart = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Create scales
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.1)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])

  // Add X axis
  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  // Add Y axis
  chart.append('g').call(d3.axisLeft(y))

  // Add the line
  chart
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('class', 'lines')
    .attr(
      'd',
      d3
        .line<DataItem>()
        .x((d) => (x(d.label) as number) + x.bandwidth() / 2) // Center the line in the band
        .y((d) => y(d.value))
    )
  chart
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => (x(d.label) as number) + x.bandwidth() / 2)
    .attr('cy', (d) => y(d.value))
    .attr('r', 3) // Radius of the circle
    .attr('fill', 'red') // Color of the circle
    .attr('class', 'points')
    .attr('data-value', (d) => d.value.toFixed(2))
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d.value)
      svg
        .selectAll('rect')
        .transition()
        .duration(150)
        .style('opacity', function () {
          return this === event.currentTarget ? '1' : '0.618' // 对当前rect保持不变，其他的设置透明度为0.618
        })
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      svg.selectAll('rect').transition().duration(150).style('opacity', '1') // 保证透明度回到1
    })
}

interface LineProps {
  data: DataItem[]
  width: string
  height: string
  left: string
  top: string
  position: 'absolute' | 'fixed'
  interactionType?: string
  allowedinteractionType?: string
}

const Line: React.FC<LineProps> = ({
  data,
  width,
  height,
  left,
  top,
  position,
  interactionType,
  allowedinteractionType,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const dispatch = useDispatch()
  useEffect(() => {
    if (chartRef.current) {
      drawLineChart(data, chartRef.current, dispatch)
    }
  }, [data]) // Dependency array: Redraw chart if 'data' changes
  React.useEffect(() => {
    // console.log("debug-data-value", interactionType, message)
    console.log('接收到了信息', curMessage)

    if (curMessage === undefined) {
      return
    }
    console.log(curMessage.interactionType, allowedinteractionType)
    if (!allowedinteractionType) {
      return
    }

    if (curMessage.interactionType === allowedinteractionType) {
      // console.log("debug-data-value", message)
      d3.select(chartRef.current).selectAll('.points').style('opacity', 0.3)
      d3.select(chartRef.current).selectAll('.lines').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.points')
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
    <ReduxProviderWrapper>
      <div
        ref={chartRef}
        style={{
          width: width,
          height: height,
          position: position,
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

export default LineWithRedux

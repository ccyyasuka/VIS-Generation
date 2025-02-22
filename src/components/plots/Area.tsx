import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState } from './redux/store'
import { ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'
type DataItem = {
  label: Date
  value: number
}

function drawAreaChart(
  data: DataItem[],
  element?: HTMLSpanElement,
  dispatch?: any,
  interactionType?: string
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
  const margin = { top: 20, right: 30, bottom: 40, left: 90 }

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

  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.label) as [Date, Date])
    .range([0, innerWidth])

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])

  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  chart.append('g').call(d3.axisLeft(y))

  const area = d3
    .area<DataItem>()
    .x((d) => x(d.label))
    .y0(innerHeight)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX)

  chart
    .append('path')
    .datum(data)
    .attr('fill', '#69b3a2')
    .attr('d', area)
    .attr('class', 'area-path')

  chart
    .selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.label))
    .attr('cy', (d) => y(d.value))
    .attr('r', 4)
    .attr('fill', '#3769b1')
    .attr('class', 'dots')
    .attr('data-value', (d) => d.value.toFixed(2))
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d.value)
      d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .attr('r', 6)
        .attr('fill', '#ff5733')
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .attr('r', 4)
        .attr('fill', '#3769b1')
    })
}

interface AreaProps {
  data: DataItem[]
  width: string
  height: string
  left: string
  top: string
  x: string
  y: string
  interactionKey: string
  interactionType: string
  allowedinteractionType: string
}

const Area: React.FC<AreaProps> = ({
  data,
  width,
  height,
  left,
  top,
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
      drawAreaChart(data, chartRef.current, dispatch, interactionType)
    }
  }, [data])

  useEffect(() => {
    if (curMessage === undefined) {
      return
    }
    if (!allowedinteractionType) {
      return
    }

    if (curMessage.interactionType === allowedinteractionType) {
      d3.select(chartRef.current).selectAll('.dots').style('opacity', 0.3)
      d3.select(chartRef.current)
        .selectAll('.dots')
        .filter(function () {
          return +d3.select(this).attr('data-value') === curMessage.message
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
const AreaWithRedux: React.FC<AreaProps> = (props) => (
  <ReduxProviderWrapper>
    <Area {...props} />
  </ReduxProviderWrapper>
)

const AreaWithWrapper: React.FC<figWrapperProps & AreaProps> = ({
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
  allowedinteractionType,
  // allowedinteractionKey
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
      <AreaWithRedux
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
      />
    </WrapperWithButton>
  )
}

export default AreaWithWrapper

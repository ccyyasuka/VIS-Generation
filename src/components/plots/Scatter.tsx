import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState } from './redux/store'
import { ReduxProviderWrapper } from './redux/store'
type scatterDataItem = {
  x: number
  y: number
  label: string
  [key: string]: any
}

function drawScatterPlot(
  data: scatterDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, //指明原始key
  curInteractionKey: string //指明是label还是value
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
  const margin = { top: 20, right: 30, bottom: 40, left: 40 }

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
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.x) as number])
    .range([0, innerWidth])

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) as number])
    .range([innerHeight, 0])

  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  chart.append('g').call(d3.axisLeft(y))

  chart
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.x))
    .attr('cy', (d) => y(d.y))
    .attr('r', 5)
    .attr('fill', '#69b3a2')
    .attr('class', 'dots')
    .attr('data-y', (d) => d.y.toFixed(2))
    .attr('data-x', (d) => d.x.toFixed(2))
    .attr('data-label', (d) => d.label)
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d[curInteractionKey as string])
      d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .attr('r', 8)
        .attr('fill', '#3769b1')
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      d3.select(event.currentTarget)
        .transition()
        .duration(150)
        .attr('r', 5)
        .attr('fill', '#69b3a2')
    })
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
  offsetLeft:string
  offsetTop:string
  x: string
  y: string
  label?: string
  interactionType: string
  interactionKey: string
  allowedinteractionType: string
}

const Scatter: React.FC<ScatterProps> = ({
  data,
  width,
  height,
  left,
  top,
  x,
  y,
  label,
  interactionType,
  interactionKey,
  allowedinteractionType,
}) => {
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const chartRef = useRef<HTMLDivElement>(null)
  function preprocessData() {
    return data.map((item) => {
      return {
        x: item[x] as number,
        y: item[y] as number,
        label: label ? item[label] : ('' as string),
      }
    })
  }
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
          curInteractionKey = 'label'
      }
      drawScatterPlot(
        preprocessData(),
        chartRef.current,
        dispatch,
        interactionType,
        interactionKey,
        curInteractionKey
      )
    }
  }, [data])

  useEffect(() => {
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
      d3.select(chartRef.current).selectAll('.dots').style('opacity', 0.3)
      d3.select(chartRef.current)
        .selectAll('.dots')
        .filter(function () {
          if (x === curMessage.interactionKey)
            return +d3.select(this).attr('data-x') === curMessage.message
          else if (y === curMessage.interactionKey)
            return +d3.select(this).attr('data-y') === curMessage.message
          else return +d3.select(this).attr('data-label') === curMessage.message
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

export default ScatterWithRedux

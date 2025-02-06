import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState } from './redux/store'
import { ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, {figWrapperProps} from '../wrapperButton'
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
  interactionkey: string, // 指明原始key
  curInteractionKey: string // 指明是label还是value
): void {
  if (!element) {
    element = document.body.appendChild(document.createElement('div'))
  } else {
    while (element.firstChild) {
      element.removeChild(element.firstChild)
    }
  }

  const handleHover = (message: number) => {
    const highlightMessage: messageType = {
      hoverOrNot: true,
      message: parseFloat(message.toFixed(2)),
      interactionType: interactionType || 'default',
      interactionKey: interactionkey || 'default',
    }
    dispatch(ChangeMessageSetting({ ...highlightMessage }))
  }

  const handleLeave = () => {
    dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }))
  }

  const handleHoverThrottled = _.throttle(handleHover, 200)

  const width = element.clientWidth
  const height = element.clientHeight
  const radius = Math.min(width, height) / 2

  // Create SVG element
  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const color = d3.scaleOrdinal(d3.schemeCategory10)

  const pie = d3
    .pie<PieDataItem>()
    .sort(null)
    .value((d) => d.value)

  // Define arc generator for hollow pie chart
  const arc = d3
    .arc<d3.PieArcDatum<PieDataItem>>()
    .innerRadius(radius * 0.5) // Set innerRadius to make the pie chart hollow
    .outerRadius(radius)

  const arcs = svg
    .selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc')

  arcs
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i.toString()))
    .attr('class', 'arcs')
    .attr('data-value', (d) => d.value.toFixed(2))
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d.data.value)
      svg
        .selectAll('path')
        .transition()
        .duration(150)
        .style('opacity', function () {
          return this === event.currentTarget ? '1' : '0.618'
        })
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      svg.selectAll('path').transition().duration(150).style('opacity', '1')
    })

  arcs
    .append('text')
    .attr('transform', (d) => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .text((d) => d.data.label)
}
type DataItem = {
  [key: string]: any
}
interface PieProps {
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
  allowedinteractionType,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const dispatch = useDispatch()

  function preprocessData() {
    return data.map((item) => {
      return { label: item[x].toString() as string, value: item[y] as number }
    })
  }
  useEffect(() => {
    if (chartRef.current) {
      let curInteractionKey = interactionKey === x ? 'label' : 'value'
      drawPieChart(
        preprocessData(),
        chartRef.current,
        dispatch,
        interactionType,
        interactionKey,
        curInteractionKey
      )
    }
  }, [data]) // Dependency array: Redraw chart if 'data' changes
  React.useEffect(() => {
    // console.log("debug-data-value", interactionType, message)
    console.log('接收到了信息', curMessage)

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
      // console.log("debug-data-value", message)
      d3.select(chartRef.current).selectAll('.arcs').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.arcs')
        .filter(function () {
          console.log(+d3.select(this).attr('data-value'))
          if (x === curMessage.interactionKey)
            return +d3.select(this).attr('data-label') === curMessage.message
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

const DonatWithRedux: React.FC<PieProps> = (props) => (
  <ReduxProviderWrapper>
    <Pie {...props} />
  </ReduxProviderWrapper>
)

const DonatWithWrapper: React.FC<figWrapperProps & PieProps> = ({
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
      <DonatWithRedux
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

export default DonatWithWrapper

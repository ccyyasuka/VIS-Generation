import * as d3 from 'd3'
import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
type BarDataItem = {
  // qqqq
  label: string
  value: number
  [key: string]: any
}
// 纵向柱状图
function drawBarChart(
  data: BarDataItem[],
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

  // Set dimensions and margins of the graph
  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 30, bottom: 40, left: 50 }

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

  // Create X axis (categorical)
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.1)
  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  // Create Y axis (numerical)
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])
  chart.append('g').call(d3.axisLeft(y))

  // Bars
  chart
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.label) as number)
    .attr('y', (d) => y(d.value)) // Start from the top for vertical bars
    .attr('width', x.bandwidth())
    .attr('height', (d) => innerHeight - y(d.value)) // Calculate height from value
    .attr('fill', '#69b3a2')
    .attr('class', 'bars')
    .attr('data-value', (d) => d.value.toFixed(2))
    .attr('data-label', (d) => d.label)
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d[curInteractionKey as string])
      svg
        .selectAll('rect')
        .transition()
        .duration(150)
        .style('opacity', function () {
          return this === event.currentTarget ? '1' : '0.618'
        })
    })
    .on('mouseleave', (event, d) => {
      handleLeave()
      svg.selectAll('rect').transition().duration(150).style('opacity', '1')
    })
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
}) => {
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const chartRef = useRef<HTMLDivElement>(null)
  // qqqq
  function preprocessData() {
    return data.map((item) => {
      return { label: item[x].toString() as string, value: item[y] as number }
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

interface WrapperWithButtonProps {
  children: ReactNode
  offsetLeft: string
  offsetTop: string
  width: string
  height: string
  left: string
  top: string
}

const WrapperWithButton: React.FC<WrapperWithButtonProps> = ({
  children,
  width,
  height,
  left,
  top,
  offsetLeft,
  offsetTop,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState({ left, top })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 计算基于百分比的实际像素值
  const getPositionInPixels = () => {
    // debugger
    const offsetLeftFloat = parseInt(offsetLeft, 10) // 将 '15px' 转换为 15
    const offsetTopFloat = parseInt(offsetTop, 10)
    return { offsetLeftFloat, offsetTopFloat }
  }

  const { offsetLeftFloat, offsetTopFloat } = getPositionInPixels()

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    // debugger
    setIsDragging(true)
    e.preventDefault()
  }

  // 拖拽中
  const handleMouseMove = (e: MouseEvent) => {
    // debugger
    e.preventDefault()
    console.log('isDragging', isDragging)
    if (isDragging) {
      // debugger
      const newLeft = e.clientX - offsetLeftFloat - 10
      const newTop = e.clientY - offsetTopFloat - 10
      // 更新位置
      setPosition({
        left: `${newLeft}px`,
        top: `${newTop}px`,
      })
    }
  }

  // 拖拽结束
  const handleMouseUp = (e: MouseEvent) => {
    // debugger
    e.preventDefault()
    setIsDragging(false)
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseup', handleMouseUp)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width,
        height,
        border: '1px solid gray',
        padding: '10px',
        borderRadius: '5px',
        display: 'inline-block',
      }}>
      <div
        onMouseDown={handleMouseDown}
        // onMouseUp={handleMouseUp}
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          width: '20px',
          height: '20px',
          backgroundColor: 'gray',
          cursor: 'move',
        }}
      />
      {children}
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          bottom: '5px',
          right: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: 'pointer',
        }}>
        Close
      </button>
    </div>
  )
}

interface BarWrapperProps {
  offsetLeft: string
  offsetTop: string
}
const BarWithWrapper: React.FC<BarWrapperProps & BarProps> = ({
  data,
  width,
  height,
  left,
  top,
  offsetLeft,
  offsetTop,
  x,
  y,
  interactionType,
  interactionKey,
  allowedinteractionType,
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
      />
    </WrapperWithButton>
  )
}

export default BarWithWrapper
// export default Bar

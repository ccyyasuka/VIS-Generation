import * as d3 from 'd3'
import React, { useRef, useEffect,useState,ReactNode } from 'react'
import { messageType } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { ChangeMessageSetting } from './redux/action/action'
import _ from 'lodash'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, {figWrapperProps} from '../wrapperButton'

type LineDataItem = {
  label: string // Typically, this would be a category or time point
  value: number // Value for that point
  [key: string]: any
}

function drawLineChart(
  data: LineDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, //指明原始key
  curInteractionKey: string //指明是label还是value
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
      interactionType: interactionType || 'default',
      interactionKey: interactionkey || 'default',
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
    .attr('data-label', (d) => d.label)
    .on('mouseenter', (event, d) => {
      handleHoverThrottled(d[curInteractionKey as string])
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
  allowedinteractionType: string
  // allowedinteractionKey: string
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
  allowedinteractionType,
  // allowedinteractionKey
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
      drawLineChart(
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
    console.log(curMessage.interactionType, allowedinteractionType)
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
      d3.select(chartRef.current).selectAll('.points').style('opacity', 0.3)
      d3.select(chartRef.current).selectAll('.lines').style('opacity', 0.3)
      // 然后找到与message相等的点，将其透明度设置为1
      d3.select(chartRef.current)
        .selectAll('.points')
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

// interface WrapperWithButtonProps {
//   children: ReactNode
//   offsetLeft: string
//   offsetTop: string
//   width: string
//   height: string
//   left: string
//   top: string
// }
// const WrapperWithButton: React.FC<WrapperWithButtonProps> = ({
//   children,
//   width,
//   height,
//   left,
//   top,
//   offsetLeft,
//   offsetTop,
// }) => {
//   const [isVisible, setIsVisible] = useState(true)
//   const [position, setPosition] = useState({ left, top })
//   const [isDragging, setIsDragging] = useState(false)
//   const dragStartPos = useRef({ x: 0, y: 0 })
//   const containerRef = useRef<HTMLDivElement | null>(null)

//   // 计算基于百分比的实际像素值
//   const getPositionInPixels = () => {
//     // debugger
//     const offsetLeftFloat = parseInt(offsetLeft, 10) // 将 '15px' 转换为 15
//     const offsetTopFloat = parseInt(offsetTop, 10)
//     return { offsetLeftFloat, offsetTopFloat }
//   }

//   const { offsetLeftFloat, offsetTopFloat } = getPositionInPixels()

//   // 开始拖拽
//   const handleMouseDown = () => {
//     // debugger
//     setIsDragging(true)
//   }

//   // 拖拽中
//   const handleMouseMove = (e: MouseEvent) => {
//     // debugger
//     console.log('isDragging', isDragging)
//     if (isDragging) {
//       // debugger
//       const newLeft = e.clientX - offsetLeftFloat - 10
//       const newTop = e.clientY - offsetTopFloat - 10
//       // 更新位置
//       setPosition({
//         left: `${newLeft}px`,
//         top: `${newTop}px`,
//       })
//     }
//   }

//   // 拖拽结束
//   const handleMouseUp = () => {
//     // debugger
//     setIsDragging(false)
//   }

//   useEffect(() => {
//     const container = containerRef.current
//     if (container) {
//       container.addEventListener('mousemove', handleMouseMove)
//       container.addEventListener('mouseup', handleMouseUp)
//       return () => {
//         container.removeEventListener('mousemove', handleMouseMove)
//         container.removeEventListener('mouseup', handleMouseUp)
//       }
//     }
//   }, [isDragging])

//   if (!isVisible) return null

//   return (
//     <div
//       ref={containerRef}
//       style={{
//         position: 'absolute',
//         left: position.left,
//         top: position.top,
//         width,
//         height,
//         border: '1px solid gray',
//         padding: '10px',
//         borderRadius: '5px',
//         display: 'inline-block',
//       }}>
//       <div
//         onMouseDown={handleMouseDown}
//         // onMouseUp={handleMouseUp}
//         style={{
//           position: 'absolute',
//           left: '0',
//           top: '0',
//           width: '20px',
//           height: '20px',
//           backgroundColor: 'gray',
//           cursor: 'move',
//         }}
//       />
//       {children}
//       <button
//         onClick={() => setIsVisible(false)}
//         style={{
//           position: 'absolute',
//           bottom: '5px',
//           right: '10px',
//           backgroundColor: '#f0f0f0',
//           border: '1px solid #ccc',
//           borderRadius: '3px',
//           cursor: 'pointer',
//         }}>
//         Close
//       </button>
//     </div>
//   )
// }

// interface BarWrapperProps {
//   offsetLeft: string
//   offsetTop: string
// }



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
        allowedinteractionType={allowedinteractionType}
        // allowedinteractionKey={allowedinteractionKey}
      />
    </WrapperWithButton>
  )
}



export default BarWithWrapper

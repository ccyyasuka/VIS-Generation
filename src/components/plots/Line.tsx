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
  groupBy: string | null
  [key: string]: any
}

function drawLineChart(
  data: LineDataItem[],
  element: HTMLSpanElement,
  dispatch: any,
  interactionType: string,
  interactionkey: string, // 指明原始key
  curInteractionKey: string // 指明是label还是value
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
  }

  const handleLeave = () => {
    dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }))
  }

  const handleHoverThrottled = _.throttle(handleHover, 200)

  // 设置图表的尺寸和边距
  const width = element.clientWidth // 使用容器的宽度
  const height = element.clientHeight // 使用容器的高度
  const margin = { top: 20, right: 30, bottom: 40, left: 90 }

  // 在容器中创建 SVG 元素
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

  // 新增分组逻辑
  const groups = Array.from(new Set(data.map((d) => d.groupBy))).filter(
    Boolean
  ) as string[]
  const labels = Array.from(new Set(data.map((d) => d.label)))

  // 创建嵌套比例尺
  const x = d3
    .scaleBand()
    .domain(labels)
    .range([0, innerWidth])
    .padding(0.1)

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) as number])
    .range([innerHeight, 0])

  // 颜色比例尺
  const color = d3
    .scaleOrdinal<string>()
    .domain(groups)
    .range(d3.schemeCategory10)

  // 添加 X 轴
  chart
    .append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  // 添加 Y 轴
  chart.append('g').call(d3.axisLeft(y))

  // 按组绘制折线
  groups.forEach((group) => {
    const groupData = data.filter((d) => d.groupBy === group)

    // 添加折线
    chart
      .append('path')
      .datum(groupData)
      .attr('fill', 'none')
      .attr('stroke', color(group))
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
      .attr('fill', color(group)) // 点的颜色
      .attr('class', `points points-${group}`)
      .attr('data-value', (d) => d.value.toFixed(2))
      .attr('data-label', (d) => d.label)
      .on('mouseenter', (event, d) => {
        handleHoverThrottled(d[curInteractionKey as string])
        svg
          .selectAll('circle')
          .transition()
          .duration(150)
          .style('opacity', function () {
            return this === event.currentTarget ? '1' : '0.618' // 当前点保持不变，其他点透明度为 0.618
          })
      })
      .on('mouseleave', (event, d) => {
        handleLeave()
        svg.selectAll('circle').transition().duration(150).style('opacity', '1') // 恢复透明度
      })
  })

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
  groupBy: string | null
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
  groupBy = null,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )
  const dispatch = useDispatch()
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
        groupBy={groupBy}
      />
    </WrapperWithButton>
  )
}



export default BarWithWrapper

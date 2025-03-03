import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { messageType } from '../../types'
import { ChangeMessageSetting } from './redux/action/action'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'

type ForceGraphData = {
  nodes: { id: string; group: number }[]
  links: { source: string; target: string; value: number }[]
}

interface ForceGraphProps {
  data: ForceGraphData
  width: string
  height: string
  left: string
  top: string
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
  color?: string[]
  title?: string
}

const ForceGraph: React.FC<ForceGraphProps> = ({
  data,
  width,
  height,
  left,
  top,
  interactionType,
  interactionKey,
  allowedInteractionType,
  color,
  title,
}) => {
  const graphRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const curMessage: messageType = useSelector(
    (state: AppState) => state.message
  )

  useEffect(() => {
    if (graphRef.current) {
      drawForceGraph(
        data,
        graphRef.current,
        dispatch,
        interactionType,
        interactionKey
      )
    }
  }, [data])

  useEffect(() => {
    if (curMessage === undefined) return

    if (
      !allowedInteractionType ||
      curMessage.interactionType === allowedInteractionType
    ) {
      d3.select(graphRef.current).selectAll('.node').style('opacity', 0.3)

      d3.select(graphRef.current)
        .selectAll('.node')
        .filter(function () {
          return d3.select(this).attr('data-id') === curMessage.message
        })
        .style('opacity', 1)
    }
  }, [curMessage])

  return (
    <ReduxProviderWrapper>
      <div
        ref={graphRef}
        style={{
          width,
          height,
          position: 'absolute',
          left,
          top,
        }}></div>
    </ReduxProviderWrapper>
  )
}

function drawForceGraph(
  data: ForceGraphData,
  element: HTMLDivElement,
  dispatch: any,
  interactionType: string,
  interactionKey: string
): void {
  const width = element.clientWidth
  const height = element.clientHeight
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }

  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'max-width: 100%; height: auto;')

  const g = svg.append('g')

  const links = data.links.map((d) => ({ ...d }))
  const nodes = data.nodes.map((d) => ({
    ...d,
    x: Math.random() * width,
    y: Math.random() * height,
  }))

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d: any) => d.id)
        .distance((d) => Math.max(30, Math.min(100, d.value * 2)))
    )
    .force('charge', d3.forceManyBody().strength(-80)) // 适当减少斥力
    .force('center', d3.forceCenter(width / 2, height / 2)) // 居中
    .force('x', d3.forceX(width / 2).strength(0.05)) // 水平方向控制
    .force('y', d3.forceY(height / 2).strength(0.05)) // 垂直方向控制
    .on('tick', ticked)

  const link = g
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke-width', (d) => Math.sqrt(d.value))

  const node = g
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll<
      SVGCircleElement,
      { x: number; y: number; id: string; group: number }
    >('circle') // 👈 Fix Type
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', 8)
    .attr('fill', (d) => colorScale(d.group.toString()))
    .attr('class', 'node')
    .attr('data-id', (d) => d.id)
    .call(
      d3
        .drag<
          SVGCircleElement,
          { x: number; y: number; id: string; group: number }
        >() // 👈 Fix Type Here
        .on('start', dragStarted)
        .on('drag', dragging)
        .on('end', dragEnded)
    )

  node.append('title').text((d) => d.id)

  function ticked() {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)
  }

  function dragStarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragging(event: any) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragEnded(event: any) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
}

const ForceGraphWithRedux: React.FC<ForceGraphProps> = (props) => (
  <ReduxProviderWrapper>
    <ForceGraph {...props} />
  </ReduxProviderWrapper>
)

const BarWithWrapper: React.FC<figWrapperProps & ForceGraphProps> = ({
  data,
  width,
  height,
  left,
  top,
  offsetLeft,
  offsetTop,
  interactionType,
  interactionKey,
  allowedInteractionType,
  color,
  title,
  id,
}) => {
  // Set new width and height similar to line chart
  const newWidth = `100%`
  const newHeight = `95%`
  const newLeft = '10px'
  const newTop = '10px'

  return (
    <WrapperWithButton
      width={width}
      height={height}
      id={id}
      left={left}
      top={top}
      offsetLeft={offsetLeft}
      offsetTop={offsetTop}>
      <ForceGraphWithRedux
        data={data}
        width={newWidth}
        height={newHeight}
        left={newLeft}
        top={newTop}
        interactionType={interactionType}
        interactionKey={interactionKey}
        allowedInteractionType={allowedInteractionType}
        color={color}
        title={title}
      />
    </WrapperWithButton>
  )
}

export default BarWithWrapper

import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'

type ForceGraphData = {
  nodes: { id: string; data: { type: string } }[]
  edges: { source: string; target: string }[]
}

interface NodeData {
  x: number
  y: number
  id: string
  data: {
    type: string
  }
  fx?: number | null // Add fx and fy to fix the node's position during dragging
  fy?: number | null
}

function drawForceGraph(data: ForceGraphData, element: HTMLSpanElement): void {
  const width = element.clientWidth
  const height = element.clientHeight
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
  // 清空element中的内容，避免创建多个SVG
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
  // Create the SVG container
  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'max-width: 100%; height: auto;')

  const g = svg.append('g')

  const links = data.edges.map((d) => ({ ...d }))
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
        .distance(100)
    )
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked)

  const link = g
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke-width', (d: any) => Math.sqrt(d.value))

  const node = g
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('fill', (d: NodeData) => colorScale(d.data.type))
    .call(
      d3
        .drag<SVGCircleElement, NodeData>() // Define drag behavior
        .on('start', dragStarted)
        .on('drag', dragging)
        .on('end', dragEnded)
    )

  node.append('title').text((d: NodeData) => d.id)

  function ticked() {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    node.attr('cx', (d: NodeData) => d.x).attr('cy', (d: NodeData) => d.y)
  }

  function dragStarted(event: d3.D3DragEvent<SVGCircleElement, NodeData, any>) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragging(event: d3.D3DragEvent<SVGCircleElement, NodeData, any>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragEnded(event: d3.D3DragEvent<SVGCircleElement, NodeData, any>) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
}

interface ForceGraphProps {
  data: ForceGraphData
  width: string
  height: string
  left: string
  top: string
}

const ForceGraph: React.FC<ForceGraphProps> = ({
  data,
  width,
  height,
  left,
  top,
}) => {
  const graphRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (graphRef.current) {
      drawForceGraph(data, graphRef.current)
    }
  }, [data]) // Redraw graph if 'data' changes

  return (
    <div
      ref={graphRef}
      style={{
        width: width,
        height: height,
        position: 'absolute',
        left: left,
        top: top,
      }}></div>
  )
}

export default ForceGraph

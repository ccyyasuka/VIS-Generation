import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'

type ArcDiagramData = {
  nodes: { id: string; group: number }[]
  links: { source: string; target: string; value: number }[]
}

interface ArcDiagramProps {
  data: ArcDiagramData
  width: string
  height: string
  left: string
  top: string
  offsetLeft:string
  offsetTop:string
}

const ArcDiagram: React.FC<ArcDiagramProps> = ({
  data,
  width,
  height,
  left,
  top,
}) => {
  const graphRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (graphRef.current) {
      drawArcDiagram(data, graphRef.current)
    }
  }, [data])

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

function drawArcDiagram(data: ArcDiagramData, element: HTMLDivElement): void {
  const width = element.clientWidth
  const height = element.clientHeight
  const nodes = data.nodes
  const links = data.links

  const marginTop = 20
  const marginBottom = 20
  const marginLeft = 130
  const marginRight = 20
  const step = 14

  const y = d3
    .scalePoint()
    .domain(nodes.map((d) => d.id))
    .range([marginTop, height - marginBottom])

  const color = d3
    .scaleOrdinal()
    .domain(nodes.map((d) => String(d.group)).sort(d3.ascending))
    .range(d3.schemeCategory10)
    .unknown('#aaa') // 如果返回 null，使用默认颜色

  const groups = new Map(nodes.map((d) => [d.id, d.group]))

  function samegroup({ source, target }: { source: string; target: string }) {
    const sourceGroup = groups.get(source)
    const targetGroup = groups.get(target)
    return sourceGroup === targetGroup && sourceGroup != null
      ? String(sourceGroup)
      : 'no-group'
  }

  // Create the SVG container.
  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

  const Y = new Map(nodes.map(({ id }) => [id, y(id)]))

  // Add an arc for each link.
  function arc(d: { source: string; target: string }) {
    const y1 = Y.get(d.source)
    const y2 = Y.get(d.target)
    if (y1 === undefined || y2 === undefined) {
      throw new Error(
        `y1 or y2 is undefined for link from ${d.source} to ${d.target}`
      )
    }
    const r = Math.abs(y2 - y1) / 2
    return `M${marginLeft},${y1}A${r},${r} 0,0,${
      y1 < y2 ? 1 : 0
    } ${marginLeft},${y2}`
  }

  const path = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(links)
    .join('path')
    .attr('stroke', (d) => String(color(samegroup(d)))) // 强制转换为 string
    .attr('d', arc)

  // Add a text label and a dot for each node.
  const label = svg
    .append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'end')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('transform', (d) => `translate(${marginLeft},${Y.get(d.id)})`)
    .call((g) =>
      g
        .append('text')
        .attr('x', -6)
        .attr('dy', '0.35em')
        .attr('fill', (d) =>
          d3
            .lab(String(color(d.group.toString())))
            .darker(2)
            .toString()
        ) // 强制转换为字符串
        .text((d) => d.id)
    )
    .call(
      (g) =>
        g
          .append('circle')
          .attr('r', 3)
          .attr('fill', (d) => color(d.group.toString()) as string) // Cast to string to resolve the type error
    )

  // Add invisible rects that update the class of the elements on mouseover.
  label
    .append('rect')
    .attr('fill', 'none')
    .attr('width', marginLeft + 40)
    .attr('height', step)
    .attr('x', -marginLeft)
    .attr('y', -step / 2)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('pointerenter', (event, d) => {
      svg.classed('hover', true)
      label.classed('primary', (n) => n === d)
      label.classed('secondary', (n) =>
        links.some(
          ({ source, target }) =>
            (n.id === source && d.id === target) ||
            (n.id === target && d.id === source)
        )
      )
      path
        .classed('primary', (l) => l.source === d.id || l.target === d.id)
        .filter('.primary')
        .raise()
    })
    .on('pointerout', () => {
      svg.classed('hover', false)
      label.classed('primary', false)
      label.classed('secondary', false)
      path.classed('primary', false).order()
    })

  // Add styles for the hover interaction.
  svg.append('style').text(`
      .hover text { fill: #aaa; }
      .hover g.primary text { font-weight: bold; fill: #333; }
      .hover g.secondary text { fill: #333; }
      .hover path { stroke: #ccc; }
      .hover path.primary { stroke: #333; }
    `)
}

export default ArcDiagram

import * as d3 from 'd3'
import React, { useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { messageType } from '../../types'
import { ChangeMessageSetting } from './redux/action/action'
import { AppState, ReduxProviderWrapper } from './redux/store'
import WrapperWithButton, { figWrapperProps } from '../wrapperButton'

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
  interactionType: string
  interactionKey: string
  allowedInteractionType: string
  color?: string[]
  title?: string
}

const ArcDiagram: React.FC<ArcDiagramProps> = ({
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
      drawArcDiagram(
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

function drawArcDiagram(
  data: ArcDiagramData,
  element: HTMLDivElement,
  dispatch: any,
  interactionType: string,
  interactionKey: string
): void {
  const width = element.clientWidth
  const height = element.clientHeight
  const nodes = data.nodes
  const links = data.links

  const marginTop = 20
  const marginBottom = 20
  const marginLeft = 130
  const step = 14

  const y = d3
    .scalePoint()
    .domain(nodes.map((d) => d.id))
    .range([marginTop, height - marginBottom])

  const colorScale = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain(nodes.map((d) => String(d.group)))

  const groups = new Map(nodes.map((d) => [d.id, d.group]))

  function sameGroup({
    source,
    target,
  }: {
    source: string
    target: string
  }): string {
    const sourceGroup = groups.get(source)
    const targetGroup = groups.get(target)

    if (sourceGroup === targetGroup && sourceGroup != null) {
      return String(sourceGroup) // Convert number to string
    }

    return 'no-group' // Ensure a valid string is always returned
  }

  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }

  const svg = d3
    .select(element)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

  const Y = new Map(nodes.map(({ id }) => [id, y(id)]))

  function arc(d: { source: string; target: string }) {
    const y1 = Y.get(d.source)
    const y2 = Y.get(d.target)

    // Ensure y1 and y2 are defined before proceeding
    if (y1 === undefined || y2 === undefined) {
      console.warn(
        `Undefined value detected: source=${d.source}, target=${d.target}`
      )
      return ''
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
    .attr('stroke', (d) => String(colorScale(sameGroup(d))))
    .attr('d', arc)

  const label = svg
    .append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'end')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node')
    .attr('data-id', (d) => d.id)
    .attr('transform', (d) => `translate(${marginLeft},${Y.get(d.id)})`)
    .on('mouseenter', (event, d) => {
      dispatch(
        ChangeMessageSetting({
          hoverOrNot: true,
          message: d.id,
          interactionType: interactionType || 'default',
          interactionKey: interactionKey || 'default',
        })
      )
    })
    .on('mouseleave', () => {
      dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }))
    })
    .call((g) =>
      g
        .append('text')
        .attr('x', -6)
        .attr('dy', '0.35em')
        .attr('fill', (d) =>
          d3
            .lab(String(colorScale(d.group.toString())))
            .darker(2)
            .toString()
        )
        .text((d) => d.id)
    )
    .call((g) =>
      g
        .append('circle')
        .attr('r', 3)
        .attr('fill', (d) => colorScale(d.group.toString()) as string)
    )
}

const ArcDiagramWithRedux: React.FC<ArcDiagramProps> = (props) => (
  <ReduxProviderWrapper>
    <ArcDiagram {...props} />
  </ReduxProviderWrapper>
)

const BarWithWrapper: React.FC<figWrapperProps & ArcDiagramProps> = ({
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
      <ArcDiagramWithRedux
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

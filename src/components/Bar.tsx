import * as d3 from 'd3';
import React, { useRef, useEffect } from 'react';

type DataItem = {
	label: string;
	value: number;
};

function drawBarChart(data: DataItem[], element?: HTMLSpanElement): void {
	if (!element) {
		// If no element provided, append a new span to the body
		element = document.body.appendChild(document.createElement('span'));
	} else {
		// Clear the element contents
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
	}
	const container = element || document.body.appendChild(document.createElement('span'));

	// Set dimensions and margins of the graph
	const width = container.clientWidth; // Use the width of the container
	const height = container.clientHeight; // Use the height of the container
	const margin = { top: 20, right: 30, bottom: 40, left: 90 };

	// Create SVG element inside the container
	const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

	const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	// Create X axis
	const x = d3
		.scaleLinear()
		.domain([0, d3.max(data, d => d.value) as number])
		.range([0, innerWidth]);
	chart.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x));

	// Create Y axis
	const y = d3
		.scaleBand()
		.range([0, innerHeight])
		.domain(data.map(d => d.label))
		.padding(0.1);
	chart.append('g').call(d3.axisLeft(y));

	// Bars
	chart
		.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		.attr('x', 0)
		.attr('y', d => y(d.label) as number)
		.attr('width', d => x(d.value))
		.attr('height', y.bandwidth())
		.attr('fill', '#69b3a2');
}

// export default drawBarChart;
interface BarProps {
	data: DataItem[];
	width: string;
	height: string;
	left: string;
	top: string;
	position: 'absolute' | 'fixed';
}

const Bar: React.FC<BarProps> = ({ data, width, height, left, top, position }) => {
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (chartRef.current) {
			drawBarChart(data, chartRef.current);
		}
	}, [data]); // Dependency array: Redraw chart if 'data' changes

	return (
		<div
			ref={chartRef}
			style={{
				width: width,
				height: height,
				position: position,
				left: left,
				top: top,
			}}
		></div>
	);
};

export default Bar;

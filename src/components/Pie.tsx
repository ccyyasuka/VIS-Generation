import * as d3 from 'd3';
import React, { useRef, useEffect } from 'react';
import { messageType } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { ChangeMessageSetting } from '../redux/action/action';
import _ from 'lodash';
import { AppState } from '../redux/store';

type DataItem = {
	label: string;
	value: number;
};

function drawPieChart(data: DataItem[], element?: HTMLDivElement, dispatch?: any): void {
	if (!element) {
		// If no element provided, append a new div to the body
		element = document.body.appendChild(document.createElement('div'));
	} else {
		// Clear the element contents
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
	}
	const handleHover = (message: number) => {
		const highlightMessage: messageType = {
			hoverOrNot: true,
			message: parseFloat(message.toFixed(2)),
		};
		highlightMessage.interactionType = 'ByValue';

		dispatch(
			ChangeMessageSetting({
				...highlightMessage,
			})
		);

		// if (setHighlightMessage) setHighlightMessage(highlightMessage)
	};
	const handleLeave = () => {
		dispatch(ChangeMessageSetting({ message: '', hoverOrNot: false }));
	};
	const handleHoverThrottled = _.throttle(handleHover, 200);
	const width = element.clientWidth;
	const height = element.clientHeight;
	const radius = Math.min(width, height) / 2;

	const svg = d3
		.select(element)
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.append('g')
		.attr('transform', `translate(${width / 2}, ${height / 2})`);

	const color = d3.scaleOrdinal(d3.schemeCategory10);

	const pie = d3
		.pie<DataItem>()
		.sort(null)
		.value(d => d.value);

	const arc = d3.arc<d3.PieArcDatum<DataItem>>().innerRadius(0).outerRadius(radius);

	const arcs = svg.selectAll('.arc').data(pie(data)).enter().append('g').attr('class', 'arc');
	console.log('debug-pie(data)', pie(data));
	arcs.append('path')
		.attr('d', arc)
		.attr('fill', (d, i) => color(i.toString()))
		.attr('class', 'arcs')
		.attr('data-value', d => d.value.toFixed(2))
		.on('mouseenter', (event, d) => {
			handleHoverThrottled(d.value);
			svg.selectAll('rect')
				.transition()
				.duration(150)
				.style('opacity', function () {
					return this === event.currentTarget ? '1' : '0.618'; // 对当前rect保持不变，其他的设置透明度为0.618
				});
		})
		.on('mouseleave', (event, d) => {
			handleLeave();
			svg.selectAll('rect').transition().duration(150).style('opacity', '1'); // 保证透明度回到1
		});

	arcs.append('text')
		.attr('transform', d => `translate(${arc.centroid(d)})`)
		.attr('text-anchor', 'middle')
		.text(d => d.data.label);
}

interface PieProps {
	data: DataItem[];
	width: string;
	height: string;
	left: string;
	top: string;
	position: 'absolute' | 'fixed';
}

const Pie: React.FC<PieProps> = ({ data, width, height, left, top, position }) => {
	const chartRef = useRef<HTMLDivElement>(null);
	const curMessage: messageType = useSelector((state: AppState) => state.message);
	const dispatch = useDispatch();

	useEffect(() => {
		if (chartRef.current) {
			drawPieChart(data, chartRef.current, dispatch);
		}
	}, [data]); // Dependency array: Redraw chart if 'data' changes
	React.useEffect(() => {
		// console.log("debug-data-value", interactionType, message)
		console.log('接收到了信息', curMessage);

		if (curMessage === undefined) {
			return;
		}
		if (curMessage.interactionType === 'ByValue') {
			// console.log("debug-data-value", message)
			d3.select(chartRef.current).selectAll('.arcs').style('opacity', 0.3);
			// 然后找到与message相等的点，将其透明度设置为1
			d3.select(chartRef.current)
				.selectAll('.arcs')
				.filter(function () {
					console.log(+d3.select(this).attr('data-value'));
					return +d3.select(this).attr('data-value') === curMessage.message;
				})
				.style('opacity', 1);
		}
	}, [curMessage]);
	React.useEffect(() => {
		// if (!interactiveRef.current) {
		//   return
		// }
		if (curMessage.hoverOrNot === undefined) {
			return;
		}
		if (!curMessage.hoverOrNot) {
			// noHighlightElement(interactiveRef.current)
			d3.select(chartRef.current).selectAll('*:not(.tooltip)').style('opacity', 1);
		}
	}, [curMessage.hoverOrNot]);

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

export default Pie;

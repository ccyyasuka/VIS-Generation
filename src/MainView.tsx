import React from 'react';
import Bar from './components/Bar';
import Line from './components/Line';
import Pie from './components/Pie';
type DataItem = {
	label: string;
	value: number;
};
type ConfigItem = {
	name: string;
	meta: {
		width: string;
		height: string;
		position: string;
		left: string;
		top: string;
	};
};
const MainView: React.FC = () => {
	const data: DataItem[] = [
		{ label: '2022', value: 20 },
		{ label: '2023', value: 10 },
		{ label: '2024', value: 60 },
	];
	const config: ConfigItem[] = [
		{
			name: 'Bar',
			meta: {
				width: '30%',
				height: '20%',
				position: 'absolute',
				left: '25%',
				top: '15%',
			},
		},
		{
			name: 'Pie',
			meta: {
				width: '30%',
				height: '30%',
				position: 'absolute',
				left: '25%',
				top: '75%',
			},
		},
		{
			name: 'Line',
			meta: {
				width: '30%',
				height: '30%',
				position: 'absolute',
				left: '65%',
				top: '15%',
			},
		},
	];
	const renderComponents = config.map((item, index) => {
		let Component = null;
		if (item.name === 'Bar') {
			Component = Bar;
		}
		if (item.name === 'Line') {
			Component = Line;
		}
		if (item.name === 'Pie') {
			Component = Pie;
		}

		return Component ? (
			<Component
				key={index}
				data={data}
				width={item.meta.width}
				height={item.meta.height}
				position="absolute"
				left={item.meta.left}
				top={item.meta.top}
			/>
		) : null;
	});

	return <div>{renderComponents}</div>;

	// return (
	// 	<div>
	// 		<Bar data={data} width="30%" height="20%" position="absolute" left="25%" top="15%" />
	// 		<Line data={data} width="30%" height="20%" position="absolute" left="65%" top="15%" />
	// 		<Pie data={data} width="30%" height="20%" position="absolute" left="25%" top="75%" />
	// 	</div>
	// );
};

export default MainView;

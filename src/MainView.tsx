import React from 'react';
import Bar from './components/Bar';

type DataItem = {
	label: string;
	value: number;
};

const MainView: React.FC = () => {
	const data: DataItem[] = [
		{ label: 'Apple', value: 20 },
		{ label: 'Banana', value: 40 },
		{ label: 'Cherry', value: 60 },
	];

	return <Bar data={data} width="30%" height="20%" position="absolute" left="25%" top="15%" />;
};

export default MainView;

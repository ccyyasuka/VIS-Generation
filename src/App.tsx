import React from 'react';
import logo from './logo.svg';
import './App.css';
import MainView from './MainView';
import { Provider } from 'react-redux';
import { store } from './redux/store';
function App() {
	return (
		<div className="App">
			<Provider store={store}>
				<MainView />
			</Provider>
		</div>
	);
}

export default App;

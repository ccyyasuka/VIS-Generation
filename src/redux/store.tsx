import { createStore, combineReducers, applyMiddleware } from 'redux';
import messageReducer from './reducer/messageReducer';

const rootReducer = combineReducers({
	message: messageReducer,
});
export type AppState = ReturnType<typeof rootReducer>;

export const store = createStore(rootReducer);

import { messageType } from '../../types';
import { messageActionType } from '../action/action';
const messageState: messageType = {
	message: '',
	hoverOrNot: false,
	interactionType: '',
};
export const SET_DATASET = 'SET_DATASET';

const messageReducer = (state = messageState, action: messageActionType) => {
	switch (action.type) {
		case 'CHANGE_MESSAGE_ACTION':
			return action.payload;
		default:
			return state;
	}
};

export default messageReducer;

import { messageType } from '../../types';

export const CHANGE_MESSAGE_ACTION = 'CHANGE_MESSAGE_ACTION';

export type messageActionType = {
	type: string;
	payload: messageType;
};

export const ChangeMessageSetting = (setting: messageType) => ({
	type: CHANGE_MESSAGE_ACTION,
	payload: setting,
});

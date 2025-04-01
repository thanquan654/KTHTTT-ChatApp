import { IMessage } from '@/types/Message.type'
import { IRoom } from '@/types/Room.type'
import { IUser } from '@/types/User.type'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface RoomSliceState {
	roomList: IRoom[]
	selectedRoom: string | null
	currentRoomMessages: IMessage[]
	currentRoomInfo: {
		name: string
		user: IUser[]
	}
}

const initialState: RoomSliceState = {
	roomList: [],
	selectedRoom: null,
	currentRoomMessages: [],
	currentRoomInfo: {
		name: '',
		user: [],
	},
}

const userSlice = createSlice({
	name: 'room',
	initialState,
	reducers: {
		getRoomList: (
			state,
			action: PayloadAction<{ currentUser: string }>,
		) => {},
		fetchSelectedRoomInfo: (
			state,
			action: PayloadAction<{ roomId: string }>,
		) => {},
	},
})

export const { getRoomList, fetchSelectedRoomInfo } = userSlice.actions

export default userSlice.reducer

/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/chat/roomSlice.js
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
// Giả sử các types được định nghĩa trong thư mục types/
import { IMessage } from '../types/Message.type'
import { IRoom } from '../types/Room.type'
import axios from 'axios'

export interface RoomSliceState {
	roomList: IRoom[] // Danh sách các phòng user tham gia
	selectedRoomId: string | null // ID của phòng đang được chọn
	currentRoomDetail: IRoom | null // Thông tin chi tiết phòng đang chọn (có thể bao gồm cả members chi tiết)
	currentRoomMessages: IMessage[] // Tin nhắn của phòng đang chọn
	isLoadingRoomList: boolean
	isLoadingRoomDetail: boolean
	isLoadingMessages: boolean
	error: string | null | unknown // Lưu lỗi nếu có
	// Có thể thêm các trạng thái khác: typingUsers, onlineUsers trong phòng,...
}

// --- State khởi tạo ---
const initialState: RoomSliceState = {
	roomList: [],
	selectedRoomId: null,
	currentRoomDetail: null,
	currentRoomMessages: [],
	isLoadingRoomList: false,
	isLoadingRoomDetail: false,
	isLoadingMessages: false,
	error: null,
}

export const fetchSelectedRoomData = createAsyncThunk(
	'room/fetchSelectedRoomData',
	async (payload: { roomId: string }, { rejectWithValue }) => {
		if (!payload.roomId) {
			return rejectWithValue('No room ID provided')
		}
		try {
			console.log(`Fetching data for room: ${payload.roomId}`)
			// Gọi API lấy chi tiết phòng VÀ tin nhắn ban đầu
			// Backend endpoint /api/room/{roomId} cần trả về cả hai
			const response = await axios.get(
				`http://127.0.0.1:5000/api/room/${payload.roomId}`,
			)

			if (response.data && response.data.room && response.data.messages) {
				// Quan trọng: Trả về cả roomId để reducer biết phòng nào đã được load thành công
				return {
					roomId: payload.roomId, // Thêm roomId vào payload trả về
					roomDetail: response.data.room,
					messages: response.data.messages,
				}
			} else {
				throw new Error(
					'Invalid response structure from server for room detail',
				)
			}
		} catch (error: any) {
			console.error(
				`Failed to fetch data for room ${payload.roomId}:`,
				error,
			)
			return rejectWithValue(
				error.response?.data?.message ||
					error.message ||
					`Failed to fetch data for room ${payload.roomId}`,
			)
		}
	},
)

// Thunk để lấy danh sách phòng VÀ tự động lấy dữ liệu phòng đầu tiên
export const fetchUserRoomsAndSelectFirst = createAsyncThunk(
	'room/fetchUserRoomsAndSelectFirst',
	async (payload: { userId: string }, thunkAPI) => {
		try {
			console.log('Fetching user rooms...')
			const rooms = await axios(`http://127.0.0.1:5000/api/room`, {
				params: { userId: payload.userId },
			}).then((response) => response.data)
			console.log('Fetched rooms:', rooms)

			// Nếu có phòng và danh sách không rỗng
			if (rooms && rooms.length > 0) {
				const firstRoomId = rooms[0]._id // Lấy ID phòng đầu tiên
				console.log(
					`First room ID: ${firstRoomId}. Dispatching fetchSelectedRoomData...`,
				)
				// Dispatch thunk để lấy dữ liệu chi tiết cho phòng đầu tiên
				// Không cần await ở đây, vì fetchSelectedRoomData sẽ tự cập nhật state
				thunkAPI.dispatch(
					fetchSelectedRoomData({ roomId: firstRoomId }),
				)
			} else {
				// Nếu không có phòng nào, set selectedRoomId = null
				// Có thể dispatch action đồng bộ nếu cần, hoặc state sẽ tự reset khi fetchSelectedRoomData bị reject (do ko có roomId)
				console.log('No rooms found for user.')
			}

			return rooms // Trả về danh sách phòng đã lấy được
		} catch (error: any) {
			console.error('Failed to fetch user rooms:', error)
			return thunkAPI.rejectWithValue(
				error.response?.data?.message ||
					error.message ||
					'Failed to fetch rooms',
			)
		}
	},
)

// Thunk để tải thêm tin nhắn cũ (load more) - Giữ nguyên
// export const loadMoreMessages = createAsyncThunk<
// 	IMessage[],
// 	{ roomId: string; beforeTimestamp: string },
// 	{ rejectValue: string }
// >(
// 	'room/loadMoreMessages',
// 	async ({ roomId, beforeTimestamp }, { rejectWithValue }) => {
// 		try {
// 			const messages = []
//             // FIXME: Implement
// 			return messages
// 		} catch (error: any) {
// 			console.error('Failed to load more messages:', error)
// 			return rejectWithValue(
// 				error.response?.data?.message ||
// 					error.message ||
// 					'Failed to load more messages',
// 			)
// 		}
// 	},
// )

const roomSlice = createSlice({
	name: 'room',
	initialState,
	reducers: {
		// Action đồng bộ để set phòng được chọn (có thể được gọi khi user click)
		// Khi user tự chọn, component sẽ cần gọi thêm fetchSelectedRoomData
		setSelectedRoomIdOnly: (
			state,
			action: PayloadAction<string | null>,
		) => {
			state.selectedRoomId = action.payload
			if (state.selectedRoomId !== state.currentRoomDetail?._id) {
				state.currentRoomDetail = null
				state.currentRoomMessages = []
				state.isLoadingRoomDetail = action.payload !== null // Bắt đầu loading nếu chọn phòng mới
				state.error = null
			}
		},
		// Action để thêm tin nhắn mới (từ WebSocket) - Giữ nguyên
		addMessage: (state, action: PayloadAction<IMessage>) => {
			if (
				state.selectedRoomId &&
				action.payload.roomId === state.selectedRoomId
			) {
				const exists = state.currentRoomMessages.some(
					(msg) => msg._id === action.payload._id,
				)
				if (!exists) {
					state.currentRoomMessages.push(action.payload)
				}
			}
		},
		// Action cập nhật trạng thái đọc (từ WebSocket) - Giữ nguyên
		updateMessageReadStatus: (
			state,
			action: PayloadAction<{ messageId: string; userId: string }>,
		) => {
			if (state.selectedRoomId) {
				const messageIndex = state.currentRoomMessages.findIndex(
					(msg) => msg._id === action.payload.messageId,
				)
				if (messageIndex !== -1) {
					const message = state.currentRoomMessages[messageIndex]
					if (
						Array.isArray(message.readBy) &&
						!message.readBy.includes(action.payload.userId)
					) {
						message.readBy.push(action.payload.userId) // Dùng Immer để mutate trực tiếp
					}
				}
			}
		},
		// Action để reset state khi logout hoặc lỗi nghiêm trọng
		resetRoomState: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			// Xử lý fetchUserRoomsAndSelectFirst
			.addCase(fetchUserRoomsAndSelectFirst.pending, (state) => {
				state.isLoadingRoomList = true
				state.error = null
				// Không reset selected room ở đây vội, chờ thunk kia chạy
			})
			.addCase(
				fetchUserRoomsAndSelectFirst.fulfilled,
				(state, action: PayloadAction<IRoom[]>) => {
					state.isLoadingRoomList = false
					state.roomList = action.payload
					// Nếu không có phòng nào được trả về, reset selected state
					if (action.payload.length === 0) {
						state.selectedRoomId = null
						state.currentRoomDetail = null
						state.currentRoomMessages = []
						state.isLoadingRoomDetail = false
					}
					// Việc chọn phòng đầu tiên và load data đã được dispatch trong thunk
				},
			)
			.addCase(fetchUserRoomsAndSelectFirst.rejected, (state, action) => {
				state.isLoadingRoomList = false
				state.error = action.payload ?? 'Failed to fetch rooms'
				// Reset hết nếu không load được room list ban đầu
				Object.assign(state, initialState, { error: state.error }) // Giữ lại lỗi
			})
		// Xử lý fetchSelectedRoomData
		builder
			.addCase(fetchSelectedRoomData.pending, (state, action) => {
				// Chỉ set loading nếu nó đang load cho phòng hiện tại muốn chọn
				// action.meta.arg chính là roomId được truyền vào thunk
				if (
					state.selectedRoomId === null ||
					state.selectedRoomId === action.meta.arg.roomId
				) {
					state.isLoadingRoomDetail = true
					state.error = null // Reset lỗi khi bắt đầu load
					// Không reset data ở đây, chờ fulfilled hoặc rejected
				}
			})
			.addCase(
				fetchSelectedRoomData.fulfilled,
				(
					state,
					action: PayloadAction<{
						roomId: string
						roomDetail: IRoom
						messages: IMessage[]
					}>,
				) => {
					// Chỉ cập nhật state nếu dữ liệu trả về đúng là của phòng đang được chọn
					// hoặc là phòng đầu tiên được load tự động
					if (
						state.selectedRoomId === null ||
						state.selectedRoomId === action.payload.roomId
					) {
						state.isLoadingRoomDetail = false
						state.selectedRoomId = action.payload.roomId // Xác nhận phòng đã được chọn thành công
						state.currentRoomDetail = action.payload.roomDetail
						state.currentRoomMessages = action.payload.messages
					}
				},
			)
			.addCase(fetchSelectedRoomData.rejected, (state, action) => {
				// Chỉ set lỗi nếu nó lỗi khi load phòng đang được chọn
				if (
					state.selectedRoomId === null ||
					state.selectedRoomId === action.meta.arg.roomId
				) {
					state.isLoadingRoomDetail = false
					state.error = action.payload ?? 'Failed to fetch room data'
					// Có thể reset current room data nếu load lỗi
					state.currentRoomDetail = null
					state.currentRoomMessages = []
				}
			})
		// Xử lý loadMoreMessages
		// builder
		// 	.addCase(loadMoreMessages.pending, (state) => {
		// 		state.isLoadingRoomDetail = true // Có thể dùng chung cờ loading
		// 		state.error = null
		// 	})
		// 	.addCase(
		// 		loadMoreMessages.fulfilled,
		// 		(state, action: PayloadAction<IMessage[]>) => {
		// 			state.isLoadingRoomDetail = false
		// 			state.currentRoomMessages = [
		// 				...action.payload,
		// 				...state.currentRoomMessages,
		// 			]
		// 		},
		// 	)
		// 	.addCase(loadMoreMessages.rejected, (state, action) => {
		// 		state.isLoadingRoomDetail = false
		// 		state.error = action.payload ?? 'Failed to load more messages'
		// 	})
	},
})

// --- Exports ---
export const {
	setSelectedRoomIdOnly,
	addMessage,
	updateMessageReadStatus,
	resetRoomState,
} = roomSlice.actions

export default roomSlice.reducer

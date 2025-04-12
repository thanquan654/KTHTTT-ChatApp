/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { IMessage } from '../types/Message.type'
import axios from 'axios'

// --- Định nghĩa kiểu dữ liệu cho State ---
export interface MessageSliceState {
	isSending: boolean // Trạng thái đang gửi tin nhắn
	isMarkingRead: { [messageId: string]: boolean } // Trạng thái đang đánh dấu đọc cho từng tin nhắn cụ thể
	sendError: string | null | unknown
	markReadError: { [messageId: string]: string | null | unknown }
}

// --- State khởi tạo ---
const initialState: MessageSliceState = {
	isSending: false,
	isMarkingRead: {},
	sendError: null,
	markReadError: {},
}

// --- Async Thunks (Gọi API) ---

// Thunk để gửi tin nhắn mới
export const sendMessage = createAsyncThunk(
	'message/sendMessage',
	async (
		newMessageData: { roomId: string; senderId: string; content: string },
		{ rejectWithValue },
	) => {
		try {
			const createdMessage = await axios.post(
				'http://127.0.0.1:5000/api/message/',
				newMessageData,
			)
			console.log('Created message:', createdMessage.data)

			return createdMessage.data
		} catch (error: any) {
			console.error('Failed to send message:', error)
			return rejectWithValue(
				error.response?.data?.message ||
					error.message ||
					'Failed to send message',
			)
		}
	},
)

// Thunk để đánh dấu tin nhắn là đã đọc
export const markMessageRead = createAsyncThunk<
	{ messageId: string; userId: string }, // Trả về messageId và userId đã đánh dấu đọc
	{ messageId: string; userId: string }, // Argument
	{ rejectValue: { messageId: string; error: string } } // Trả về cả messageId để biết lỗi của tin nhắn nào
>(
	'message/markMessageRead',
	async ({ messageId, userId }, { rejectWithValue }) => {
		try {
			// TODO: Gọi hàm API từ services/messageAPI.js
			// API backend có thể chỉ trả về status 200 OK hoặc message thành công
			// await markMessageAsReadAPI(messageId, userId)
			// Trả về dữ liệu đã dùng để gọi API để reducer biết xử lý message nào
			return { messageId, userId }
		} catch (error: any) {
			console.error(`Failed to mark message ${messageId} as read:`, error)
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				'Failed to mark message as read'
			// Trả về object chứa lỗi và messageId
			return rejectWithValue({ messageId, error: errorMessage })
		}
	},
)

// --- Slice ---
const messageSlice = createSlice({
	name: 'message',
	initialState,
	reducers: {
		clearSendError: (state) => {
			state.sendError = null
		},
		clearMarkReadError: (state, action: PayloadAction<string>) => {
			// Nhận messageId
			delete state.markReadError[action.payload]
		},
	},
	extraReducers: (builder) => {
		builder
			// Xử lý sendMessage
			.addCase(sendMessage.pending, (state) => {
				state.isSending = true
				state.sendError = null
			})
			.addCase(
				sendMessage.fulfilled,
				(state, action: PayloadAction<IMessage>) => {
					state.isSending = false

					console.log('Message sent successfully:', action.payload)
				},
			)
			.addCase(sendMessage.rejected, (state, action) => {
				state.isSending = false
				state.sendError = action.payload ?? 'Failed to send message'
			})

		// Xử lý markMessageRead
		builder
			.addCase(markMessageRead.pending, (state, action) => {
				const messageId = action.meta.arg.messageId
				state.isMarkingRead[messageId] = true
				delete state.markReadError[messageId]
			})
			.addCase(
				markMessageRead.fulfilled,
				(
					state,
					action: PayloadAction<{
						messageId: string
						userId: string
					}>,
				) => {
					const messageId = action.payload.messageId
					delete state.isMarkingRead[messageId] // Xóa trạng thái loading khi thành công
					delete state.markReadError[messageId]
					// Lưu ý: Việc cập nhật trạng thái 'readBy' trong roomSlice
					// nên được xử lý bởi action đồng bộ updateMessageReadStatus
					// được dispatch khi nhận sự kiện 'message_read' từ WebSocket.
					// Thunk này chỉ xác nhận hành động gọi API thành công.
					console.log(
						`Message ${messageId} marked as read by ${action.payload.userId} (API call success)`,
					)
				},
			)
			.addCase(markMessageRead.rejected, (state, action) => {
				// Payload khi reject chứa { messageId, error }
				const messageId =
					action.payload?.messageId || action.meta.arg.messageId // Lấy messageId từ payload hoặc arg
				if (messageId) {
					delete state.isMarkingRead[messageId] // Xóa trạng thái loading
					state.markReadError[messageId] =
						action.payload?.error ?? 'Failed to mark as read'
				}
			})
	},
})

export const { clearSendError, clearMarkReadError } = messageSlice.actions

export default messageSlice.reducer

import ChatInterface from '@/components/chat/ChatInterface'
import UserSidebar from '@/components/chat/ChatSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { addMessage, updateMessageReadStatus } from '@/store/roomSlice'
import { AppDispatch, RootState } from '@/store/store'
import { changeUserStatus } from '@/store/roomSlice'
import { IMessage } from '@/types/Message.type'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import io from 'socket.io-client'
import { Socket } from 'socket.io-client'

export default function Home() {
	const dispatch = useDispatch<AppDispatch>()
	const user = useSelector((state: RootState) => state.user.user)
	const currentRoomId = useSelector(
		(state: RootState) => state.room.selectedRoomId,
	)

	const socketRef = useRef<typeof Socket | undefined>(undefined)
	const [isConnected, setIsConnected] = useState(false)
	const [isTyping, setIsTyping] = useState(false)

	useEffect(() => {
		if (user) {
			console.log('Initializing socket connection...')

			// Tạo socket connection với explicit namespace
			socketRef.current = io('http://localhost:5000/', {
				query: { user_id: user._id },
				transports: ['websocket'],
				reconnection: true,
			})

			socketRef.current.on('connect', () => {
				console.log(
					'Socket connected successfully with ID:',
					socketRef.current?.id,
				)
				setIsConnected(true)
			})

			socketRef.current.on('user_online', (data) => {
				console.log('Received user_online event:', data)
				if (data.user_id !== user._id) {
					// Không cập nhật nếu là chính mình
					dispatch(
						changeUserStatus({
							userId: data.user_id,
							status: 'online',
						}),
					)
				}
			})

			socketRef.current.on('user_offline', (data) => {
				console.log('Received user_offline event:', data)
				if (data.user_id !== user._id) {
					// Không cập nhật nếu là chính mình
					dispatch(
						changeUserStatus({
							userId: data.user_id,
							status: 'offline',
						}),
					)
				}
			})

			socketRef.current.on('disconnect', () => {
				console.log('Socket disconnected')
				setIsConnected(false)
			})

			socketRef.current.on('connect_error', (error) => {
				console.error('Socket connection error:', error)
			})

			return () => {
				console.log('Cleaning up socket connection...')
				if (socketRef.current) {
					socketRef.current.disconnect()
				}
			}
		}
	}, [user, dispatch])

	useEffect(() => {
		if (user) {
			socketRef.current?.on('new_message', (message: IMessage) => {
				console.log('Component received new_message', message)
				dispatch(addMessage(message))
			})

			socketRef.current?.on(
				'typing_status',
				(data: {
					roomId: string
					userId: string
					isTyping: boolean
				}) => {
					if (
						data.roomId === currentRoomId &&
						data.userId !== user._id
					) {
						setIsTyping(data.isTyping)
					}
				},
			)

			socketRef.current?.on(
				'message_read',
				(data: {
					roomId: string
					userId: string
					messageId: string
					timestamp: string
				}) => {
					console.log('Message read:', data)
					dispatch(
						updateMessageReadStatus({
							roomId: data.roomId,
							messageId: data.messageId,
							userId: data.userId,
						}),
					)
				},
			)
		}
	}, [currentRoomId, dispatch, user])

	const handleSendMessageToWebsocket = (data: {
		roomId: string
		senderId: string
		content: string
	}) => {
		console.log('🚀 ~ data:', data)

		if (socketRef.current && isConnected) {
			socketRef.current.emit('message', data)
		}
	}

	const handleSubcribeToRoom = (roomId: string) => {
		console.log('🚀 ~ roomId:', roomId)
		if (socketRef.current && isConnected) {
			socketRef.current.emit('subscribe_room', {
				roomId,
				userId: user?._id,
			})
		}
	}

	const handleTyping = (isTyping: boolean) => {
		console.log('🚀 ~ isTyping:', isTyping)

		socketRef.current?.emit('typing', {
			roomId: currentRoomId,
			userId: user?._id,
			isTyping,
		})
	}

	const handleMarkMessageAsRead = (messageId: string) => {
		if (socketRef.current && isConnected && currentRoomId) {
			socketRef.current.emit('read_message', {
				roomId: currentRoomId,
				userId: user?._id,
				messageId: messageId,
			})
		}
	}

	return (
		<main className="flex min-h-screen bg-gray-50">
			<SidebarProvider>
				<UserSidebar handleSubcribeToRoom={handleSubcribeToRoom} />
				<div className="flex-1 p-1 md:p-4 h-screen flex items-center justify-center">
					<div className="w-full h-full  shadow-xl rounded-xl overflow-scroll border border-gray-200">
						{socketRef && isConnected && (
							<ChatInterface
								handleSendMessageToWebsocket={
									handleSendMessageToWebsocket
								}
								isTyping={isTyping}
								handleTyping={handleTyping}
								onMessageRead={handleMarkMessageAsRead}
							/>
						)}
					</div>
				</div>
			</SidebarProvider>
		</main>
	)
}

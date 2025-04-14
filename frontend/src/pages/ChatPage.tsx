import ChatInterface from '@/components/chat/ChatInterface'
import UserSidebar from '@/components/chat/ChatSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { addMessage } from '@/store/roomSlice'
import { AppDispatch, RootState } from '@/store/store'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import io from 'socket.io-client'
import { Socket } from 'socket.io-client'

export default function Home() {
	const dispatch = useDispatch<AppDispatch>()
	const user = useSelector((state: RootState) => state.user.user)

	const socketRef = useRef<typeof Socket | undefined>(undefined)
	const [isConnected, setIsConnected] = useState(false)

	useEffect(() => {
		if (user) {
			socketRef.current = io('http://localhost:5000', {
				query: { user_id: user._id },
			})

			socketRef.current.on('connect', () => {
				console.log(
					'Socket connected in ChatPage:',
					socketRef.current?.id,
				)
				setIsConnected(true)
				// TODO: Có thể emit 'join' cho các phòng user thuộc về ở đây hoặc trong ChatInterface/Sidebar
			})

			socketRef.current.on('disconnect', () => {
				console.log('Socket disconnected in ChatPage')
				setIsConnected(false)
				// Có thể xử lý logic reconnect ở đây nếu muốn
			})

			socketRef.current.on('new_message', (message) => {
				console.log('Component received new_message', message)
				dispatch(addMessage(message))
			})
		}

		// Cleanup function: Chạy khi component unmount hoặc token/user thay đổi
		return () => {
			if (socketRef) {
				console.log('Disconnecting socket from ChatPage cleanup')
				socketRef.current?.disconnect()
			}
		}
	}, [dispatch, user])

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

	return (
		<main className="flex min-h-screen bg-gray-50">
			<SidebarProvider>
				<UserSidebar
					socket={socketRef}
					isConnected={isConnected}
					handleSubcribeToRoom={handleSubcribeToRoom}
				/>
				<div className="flex-1 p-1 md:p-4 h-screen flex items-center justify-center">
					<div className="w-full h-full  shadow-xl rounded-xl overflow-scroll border border-gray-200">
						{socketRef && isConnected && (
							<ChatInterface
								socket={socketRef}
								isConnected={isConnected}
								handleSendMessageToWebsocket={
									handleSendMessageToWebsocket
								}
							/>
						)}
					</div>
				</div>
			</SidebarProvider>
		</main>
	)
}

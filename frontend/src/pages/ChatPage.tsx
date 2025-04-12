import ChatInterface from '@/components/chat/ChatInterface'
import UserSidebar from '@/components/chat/ChatSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { addMessage } from '@/store/roomSlice'
import { AppDispatch, RootState } from '@/store/store'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import io from 'socket.io-client'

export default function Home() {
	const dispatch = useDispatch<AppDispatch>()
	const user = useSelector((state: RootState) => state.user.user)
	const [socket, setSocket] = useState(null)
	const [isConnected, setIsConnected] = useState(false)

	useEffect(() => {
		let newSocket = null
		if (user) {
			const serverUrl = 'http://localhost:5000' // Hoặc URL production
			newSocket = io(serverUrl, {
				query: { user_id: user._id }, // Nhớ xác thực ở backend!
				// auth: { token: token }, // Cách an toàn hơn
			})

			setSocket(newSocket)

			newSocket.on('connect', () => {
				console.log('Socket connected in ChatPage:', newSocket.id)
				setIsConnected(true)
				// TODO: Có thể emit 'join' cho các phòng user thuộc về ở đây hoặc trong ChatInterface/Sidebar
			})

			newSocket.on('disconnect', () => {
				console.log('Socket disconnected in ChatPage')
				setIsConnected(false)
				// Có thể xử lý logic reconnect ở đây nếu muốn
			})

			newSocket.on('new_message', (message) => {
				console.log('Component received new_message', message)
				dispatch(addMessage(message))
			})
		}

		// Cleanup function: Chạy khi component unmount hoặc token/user thay đổi
		return () => {
			if (newSocket) {
				console.log('Disconnecting socket from ChatPage cleanup')
				newSocket.disconnect()
				setSocket(null)
			}
		}
	}, [user])

	return (
		<main className="flex min-h-screen bg-gray-50">
			<SidebarProvider>
				<UserSidebar
					socket={socket}
					isConnected={isConnected} //
				/>
				<div className="flex-1 p-1 md:p-4 flex items-center justify-center">
					<div className="w-full h-full  shadow-xl rounded-xl overflow-hidden border border-gray-200">
						{socket && isConnected && (
							<ChatInterface
								socket={socket}
								isConnected={isConnected}
							/>
						)}
					</div>
				</div>
			</SidebarProvider>
		</main>
	)
}

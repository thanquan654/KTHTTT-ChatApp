import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { sendMessage } from '@/store/messageSlice'
import { addMessage } from '@/store/roomSlice'
import { IUser } from '@/types/User.type'
import { setFriendList } from '@/store/userSlice'

const uniqueById = (arr: IUser[]) => {
	const map = new Map()
	arr.forEach((item) => map.set(item._id, item))
	return Array.from(map.values())
}

export default function ChatInterface({
	handleSendMessageToWebsocket,
}: {
	handleSendMessageToWebsocket: (data: {
		roomId: string
		senderId: string
		content: string
	}) => void
}) {
	const dispatch = useDispatch<AppDispatch>()
	const [inputValue, setInputValue] = useState('')
	const [isTyping, setIsTyping] = useState(true)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const roomData = useSelector((state: RootState) => state.room)
	const selectedRoomData = roomData.currentRoomDetail
	const selectedRoomMessages = roomData.currentRoomMessages
	const currentUser = useSelector((state: RootState) => state.user.user)
	const currentRoomId = useSelector(
		(state: RootState) => state.room.selectedRoomId,
	)

	const friendList = uniqueById(
		roomData.roomList
			.map((room) => room.members)
			.flat()
			.filter((member) => member._id !== currentUser?._id),
	)

	useEffect(() => {
		dispatch(setFriendList(friendList))
	}, [dispatch, friendList])

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [])

	useEffect(() => {
		scrollToBottom()
	}, [selectedRoomMessages, scrollToBottom])

	const handleSendMessage = () => {
		if (inputValue.trim() === '') return

		const newMessageData = {
			roomId: currentRoomId as string,
			senderId: currentUser?._id as string,
			content: inputValue,
		}
		handleSendMessageToWebsocket(newMessageData)

		dispatch(sendMessage(newMessageData))

		setInputValue('')
	}

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp * 1000) // Convert to milliseconds
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const formattedTime = `${hours}:${minutes}`
		return formattedTime
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div className="flex items-center p-4 border-b">
				{selectedRoomData && (
					<>
						<Avatar className="h-10 w-10 mr-3">
							<img
								src={
									currentUser?.avatar ||
									'https://placehold.co/400'
								}
								alt={selectedRoomData?.name}
								className="h-full w-full object-cover"
							/>
						</Avatar>
						<div>
							<h2 className="font-semibold">
								{selectedRoomData?.type === 'group'
									? selectedRoomData?.name
									: selectedRoomData?.members.find(
											(member) =>
												member._id !== currentUser?._id,
									  )?.name}
							</h2>
							<p className="text-xs text-muted-foreground capitalize">
								{selectedRoomData?.type}
							</p>
						</div>
					</>
				)}
			</div>

			{/* Messages */}
			<ScrollArea className="flex-1 p-4 overflow-y-scroll">
				<div className="space-y-4">
					{selectedRoomMessages.map((message, index) => (
						<div className="flex flex-col">
							<div className="text-xs text-gray-400">
								{
									friendList
										.filter(
											(friend) =>
												friend._id === message.senderId,
										)
										.map((friend) => friend.name)[0]
								}
							</div>
							<div
								className={`flex ${
									message.senderId === currentUser?._id
										? 'justify-end'
										: 'justify-start'
								}`}
							>
								<div
									className={`max-w-[80%] rounded-2xl px-4 py-2 ${
										message.senderId === currentUser?._id
											? 'bg-primary text-primary-foreground rounded-br-none'
											: 'bg-muted rounded-bl-none'
									}`}
								>
									<p>{message.content}</p>
									<div
										className={`text-xs mt-1 ${
											message.senderId ===
											currentUser?._id
												? 'text-primary-foreground/70'
												: 'text-muted-foreground'
										}`}
									>
										{formatTime(message.createdAt)}
									</div>
								</div>
							</div>
							{index === selectedRoomMessages.length - 1 &&
								message.readBy.length > 1 && (
									<div
										className={`flex  text-xs text-gray-400 ${
											message.senderId ===
											currentUser?._id
												? 'justify-end'
												: 'justify-start'
										}`}
									>
										{message.readBy
											.map(
												(userId) =>
													friendList.filter(
														(friend) =>
															friend._id ===
															userId,
													)[0].name,
											)
											.join(', ')}
										đã xem
									</div>
								)}
						</div>
					))}

					{isTyping && (
						<div className="flex justify-start">
							<div className="bg-muted rounded-2xl rounded-bl-none px-4 py-2">
								<div className="flex space-x-1">
									<div
										className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
										style={{ animationDelay: '0ms' }}
									></div>
									<div
										className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
										style={{ animationDelay: '150ms' }}
									></div>
									<div
										className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
										style={{ animationDelay: '300ms' }}
									></div>
								</div>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>

			{/* Input */}
			<div className="p-4 border-t">
				<div className="flex items-center gap-2">
					<div className="flex-1 relative">
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder="Type a message..."
							className="pr-10 rounded-full"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSendMessage()
								}
							}}
						/>
					</div>
					<Button
						onClick={handleSendMessage}
						size="icon"
						className="rounded-full"
						disabled={inputValue.trim() === ''}
					>
						<Send className="h-5 w-5" />
					</Button>
				</div>
			</div>
		</div>
	)
}

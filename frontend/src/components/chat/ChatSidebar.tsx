/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { Search, Users, LogOut, UserPlus, UserCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddContactDialog } from '@/components/dialogs/AddContactDialog'
import { CreateGroupDialog } from '@/components/dialogs/CreateGroupDialog'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { fetchSelectedRoomData, setSelectedRoomIdOnly } from '@/store/roomSlice'
import { logout } from '@/store/userSlice'

export default function UserSidebar({
	socket,
	isConnected,
	handleSubcribeToRoom,
}: {
	socket: React.MutableRefObject<SocketIOClient.Socket | undefined>
	isConnected: boolean
	handleSubcribeToRoom: (roomId: string) => void
}) {
	const dispatch = useDispatch<AppDispatch>()
	const roomData = useSelector((state: RootState) => state.room)
	const user = useSelector((state: RootState) => state.user.user)
	const [searchQuery, setSearchQuery] = useState('')
	const [addContactOpen, setAddContactOpen] = useState(false)
	const [createGroupOpen, setCreateGroupOpen] = useState(false)
	const contacts =
		roomData.roomList.filter((room) => room.type === 'private') ?? []
	const groups =
		roomData.roomList.filter((room) => room.type === 'group') ?? []
	const [activeTab, setActiveTab] = useState('chats')
	const selectedRoomId = useSelector(
		(state: RootState) => state.room.selectedRoomId,
	)
	const filteredContacts = contacts.filter((user) =>
		user.name.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	console.log('🚀 ~ filteredContacts:', filteredContacts)

	const filteredGroups = groups.filter((group) =>
		group.name.toLowerCase().includes(searchQuery.toLowerCase()),
	)
	const [onlineUsers, setOnlineUsers] = useState({}) // { userId: true }

	useEffect(() => {
		dispatch(fetchSelectedRoomData({ roomId: selectedRoomId as string }))
		handleSubcribeToRoom(selectedRoomId as string)
	}, [dispatch, handleSubcribeToRoom, selectedRoomId])

	useEffect(() => {
		// Chỉ lắng nghe khi có socket và đã kết nối
		if (socket.current && isConnected) {
			console.log('ChatSidebar: Setting up listeners')

			const handleUserOnline = (data) => {
				console.log('Sidebar received user_online', data)
				// Không hiển thị chính mình trong danh sách online (tùy chọn)
				if (data.user_id !== user?._id) {
					setOnlineUsers((prev) => ({
						...prev,
						[data.user_id]: true,
					}))
				}
			}

			const handleUserOffline = (data) => {
				console.log('Sidebar received user_offline', data)
				setOnlineUsers((prev) => {
					const newOnline = { ...prev }
					delete newOnline[data.user_id]
					return newOnline
				})
			}
		} else {
			setOnlineUsers({})
		}
	}, [socket, isConnected, user?._id]) // Phụ thuộc vào socket và isConnected

	const handleChangeRoom = (roomId: string) => {
		dispatch(setSelectedRoomIdOnly(roomId))
		handleSubcribeToRoom(roomId)
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'online':
				return 'bg-green-500'
			case 'away':
				return 'bg-yellow-500'
			case 'offline':
				return 'bg-gray-400'
			default:
				return 'bg-gray-400'
		}
	}

	return (
		<>
			<Sidebar>
				<SidebarHeader>
					<div className="flex items-center justify-between p-2">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							<h2 className="font-semibold">Contacts</h2>
						</div>
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="rounded-full"
								onClick={() => setAddContactOpen(true)}
								title="Add Contact"
							>
								<UserPlus className="h-5 w-5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="rounded-full"
								onClick={() => setCreateGroupOpen(true)}
								title="Create Group"
							>
								<UserCircle className="h-5 w-5" />
							</Button>
						</div>
					</div>
					<div className="px-2 pb-2">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search..."
								className="pl-8"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
					<Tabs
						defaultValue="chats"
						className="px-2"
						value={activeTab}
						onValueChange={setActiveTab}
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="chats">Chats</TabsTrigger>
							<TabsTrigger value="groups">Groups</TabsTrigger>
						</TabsList>
					</Tabs>
				</SidebarHeader>
				<SidebarContent>
					{activeTab === 'chats' && (
						<SidebarGroup>
							<SidebarGroupLabel>Contacts</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{filteredContacts.length > 0 ? (
										filteredContacts.map((contact) => (
											<SidebarMenuItem key={contact._id}>
												<SidebarMenuButton
													asChild
													isActive={
														selectedRoomId ===
														contact._id
													}
													onClick={() =>
														handleChangeRoom(
															contact._id,
														)
													}
												>
													<div className="flex items-center gap-3 w-full h-14">
														<div className="relative">
															<Avatar className="h-10 w-10">
																<img
																	src={
																		'https://placehold.co/400'
																	}
																	alt={
																		user?.name
																	}
																	className="h-full w-full object-cover"
																/>
															</Avatar>
															<div
																className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(
																	user?.status ||
																		'offfline',
																)}`}
															/>
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex justify-between items-center">
																<span className="font-medium truncate">
																	{
																		contact.members
																			.filter(
																				(
																					member,
																				) =>
																					member._id !==
																					user?._id,
																			)
																			.map(
																				(
																					member,
																				) =>
																					member.name,
																			)[0]
																	}
																</span>
															</div>
															<p className="text-xs text-muted-foreground truncate">
																{contact?.lastMessage ||
																	''}
															</p>
														</div>
													</div>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))
									) : (
										<div className="px-2 py-4 text-center text-sm text-muted-foreground">
											{searchQuery
												? 'No contacts found'
												: 'No contacts yet'}
										</div>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					)}
					{activeTab === 'groups' && (
						<SidebarGroup>
							<SidebarGroupLabel>Group Chats</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{filteredGroups.length > 0 ? (
										filteredGroups.map((group) => (
											<SidebarMenuItem key={group._id}>
												<SidebarMenuButton
													asChild
													isActive={
														selectedRoomId ===
														group._id
													}
													onClick={() =>
														handleChangeRoom(
															group._id,
														)
													}
												>
													<div className="flex items-center gap-3 w-full h-14">
														<div className="relative">
															<Avatar className="h-10 w-10">
																<img
																	src={
																		'https://placehold.co/400'
																	}
																	alt={
																		group.name
																	}
																	className="h-full w-full object-cover"
																/>
															</Avatar>
															<div className="absolute -bottom-1 -right-1 flex items-center justify-center h-4 w-4 bg-primary rounded-full text-[10px] text-primary-foreground font-bold">
																{
																	group
																		.members
																		.length
																}
															</div>
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex justify-between items-center">
																<span className="font-medium truncate">
																	{group.name}
																</span>
															</div>
															<p className="text-xs text-muted-foreground truncate">
																{
																	group.lastMessage
																}
															</p>
														</div>
													</div>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))
									) : (
										<div className="px-2 py-4 text-center text-sm text-muted-foreground">
											{searchQuery
												? 'No groups found'
												: 'No groups yet'}
											<Button
												variant="link"
												className="p-0 h-auto text-primary text-sm"
												onClick={() =>
													setCreateGroupOpen(true)
												}
											>
												Create a group
											</Button>
										</div>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					)}
				</SidebarContent>
				<SidebarFooter>
					<SidebarMenu>
						{user ? (
							<>
								<SidebarMenuItem>
									<div>{user?.name}</div>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<div className="flex items-center gap-2">
											<LogOut className="h-5 w-5" />
											<span
												onClick={() =>
													dispatch(logout())
												}
											>
												Logout
											</span>
										</div>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</>
						) : (
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<div className="flex items-center gap-2">
										<LogOut className="h-5 w-5" />
										<span>Login</span>
									</div>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>

			<AddContactDialog
				open={addContactOpen}
				onOpenChange={setAddContactOpen}
			/>

			<CreateGroupDialog
				open={createGroupOpen}
				onOpenChange={setCreateGroupOpen}
			/>
		</>
	)
}

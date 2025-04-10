import { useState } from 'react'
import { Search, Users, Plus, LogOut, UserPlus, UserCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

// Sample user data
const users = [
	{
		id: '1',
		name: 'Emma Thompson',
		avatar: 'https://placehold.co/40',
		status: 'online',
		unread: 3,
		lastMessage: "Hey, how's it going?",
	},
	{
		id: '2',
		name: 'James Wilson',
		avatar: 'https://placehold.co/40',
		status: 'online',
		unread: 0,
		lastMessage: 'Can we discuss the project?',
	},
	{
		id: '3',
		name: 'Sophia Martinez',
		avatar: 'https://placehold.co/40',
		status: 'offline',
		unread: 0,
		lastMessage: 'Thanks for your help!',
	},
	{
		id: '4',
		name: 'Liam Johnson',
		avatar: 'https://placehold.co/40',
		status: 'away',
		unread: 1,
		lastMessage: "I'll send you the files later",
	},
	{
		id: '5',
		name: 'Olivia Davis',
		avatar: 'https://placehold.co/40',
		status: 'online',
		unread: 0,
		lastMessage: "Let's meet tomorrow",
	},
]

const initialGroups = [
	{
		id: 'group1',
		name: 'Project Team',
		avatar: '/placeholder.svg?height=40&width=40',
		unread: 2,
		lastMessage: 'Meeting at 3pm tomorrow',
		members: [users[0], users[1], users[2]],
	},
	{
		id: 'group2',
		name: 'Family',
		avatar: '/placeholder.svg?height=40&width=40',
		unread: 0,
		lastMessage: "Let's plan the weekend",
		members: [users[3], users[4]],
	},
]

type UserSidebarProps = {
	onSelectUser: (userId: string) => void
	selectedUser: string | null
}

export default function UserSidebar({
	onSelectUser,
	selectedUser,
}: UserSidebarProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [addContactOpen, setAddContactOpen] = useState(false)
	const [createGroupOpen, setCreateGroupOpen] = useState(false)
	const [contacts, setContacts] = useState([...users])
	const [groups, setGroups] = useState([...initialGroups])
	const [activeTab, setActiveTab] = useState('chats')

	const filteredContacts = contacts.filter((user) =>
		user.name.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	const filteredGroups = groups.filter((group) =>
		group.name.toLowerCase().includes(searchQuery.toLowerCase()),
	)

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

	const handleAddContact = (newContact: any) => {
		// Check if contact already exists
		if (!contacts.some((contact) => contact.id === newContact.id)) {
			setContacts((prev) => [
				...prev,
				{
					...newContact,
					unread: 0,
					lastMessage: 'New contact added',
				},
			])
		}
	}

	const handleCreateGroup = (newGroup: any) => {
		setGroups((prev) => [
			...prev,
			{
				...newGroup,
				unread: 0,
				lastMessage: 'Group created',
			},
		])
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
										filteredContacts.map((user) => (
											<SidebarMenuItem key={user.id}>
												<SidebarMenuButton
													asChild
													isActive={
														selectedUser === user.id
													}
													onClick={() =>
														onSelectUser(user.id)
													}
												>
													<div className="flex items-center gap-3 w-full h-14">
														<div className="relative">
															<Avatar className="h-10 w-10">
																<img
																	src={
																		user.avatar ||
																		'/placeholder.svg'
																	}
																	alt={
																		user.name
																	}
																	className="h-full w-full object-cover"
																/>
															</Avatar>
															<div
																className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(
																	user.status,
																)}`}
															/>
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex justify-between items-center">
																<span className="font-medium truncate">
																	{user.name}
																</span>
																{user.unread >
																	0 && (
																	<Badge
																		variant="default"
																		className="ml-2 px-1.5 py-0.5 text-xs"
																	>
																		{
																			user.unread
																		}
																	</Badge>
																)}
															</div>
															<p className="text-xs text-muted-foreground truncate">
																{
																	user.lastMessage
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
											<SidebarMenuItem key={group.id}>
												<SidebarMenuButton
													asChild
													isActive={
														selectedUser ===
														group.id
													}
													onClick={() =>
														onSelectUser(group.id)
													}
												>
													<div className="flex items-center gap-3 w-full h-14">
														<div className="relative">
															<Avatar className="h-10 w-10">
																<img
																	src={
																		group.avatar ||
																		'/placeholder.svg'
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
																{group.unread >
																	0 && (
																	<Badge
																		variant="default"
																		className="ml-2 px-1.5 py-0.5 text-xs"
																	>
																		{
																			group.unread
																		}
																	</Badge>
																)}
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
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<div className="flex items-center gap-2">
									<LogOut className="h-5 w-5" />
									<span>Logout</span>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>

			<AddContactDialog
				open={addContactOpen}
				onOpenChange={setAddContactOpen}
				onContactAdded={handleAddContact}
			/>

			<CreateGroupDialog
				open={createGroupOpen}
				onOpenChange={setCreateGroupOpen}
				onGroupCreated={handleCreateGroup}
			/>
		</>
	)
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Search, Users, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { IUser } from '@/types/User.type'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import axios from 'axios'

// Mock contacts data
type CreateGroupDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const uniqueById = (arr: IUser[]) => {
	const map = new Map()
	arr.forEach((item) => map.set(item._id, item))
	return Array.from(map.values())
}

export function CreateGroupDialog({
	open,
	onOpenChange,
}: CreateGroupDialogProps) {
	const [groupName, setGroupName] = useState('')
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedMembers, setSelectedMembers] = useState<IUser[]>([])
	const [isCreating, setIsCreating] = useState(false)
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
	const [statusMessage, setStatusMessage] = useState('')
	const currentUser = useSelector((state: RootState) => state.user.user)
	const roomList = useSelector((state: RootState) => state.room.roomList)
	const friendList = uniqueById(
		roomList
			.map((room) => room.members)
			.flat()
			.filter((member) => member._id !== currentUser?._id),
	)

	const filteredContacts = friendList.filter((contact) => {
		return contact.name.toLowerCase().includes(searchQuery.toLowerCase())
	})

	const handleSelectMember = (contact: IUser) => {
		setSelectedMembers((prev) => uniqueById([...prev, contact]))
		setSearchQuery('')
	}

	const handleRemoveMember = (contactId: string) => {
		setSelectedMembers((prev) =>
			prev.filter((member) => member._id !== contactId),
		)
	}

	const handleCreateGroup = async () => {
		if (!groupName.trim()) {
			setStatus('error')
			setStatusMessage('Please enter a group name.')
			return
		}

		if (selectedMembers.length < 2) {
			setStatus('error')
			setStatusMessage('Please select at least 2 members for the group.')
			return
		}

		setIsCreating(true)
		setStatus('idle')

		try {
			const respone = await axios.post(
				'http://127.0.0.1:5000/api/room/',
				{
					name: groupName,
					members: [
						...selectedMembers.map((member) => member._id),
						currentUser?._id as string,
					],
					type: 'group',
				},
			)

			console.log('🚀 ~ respone:', respone)
		} catch (error) {
			setStatus('error')
			setStatusMessage('Failed to create group. Please try again.')
		} finally {
			setIsCreating(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create Group Chat</DialogTitle>
					<DialogDescription>
						Create a new group chat by adding members and setting a
						group name.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="flex items-center gap-4">
						<div className="flex-1">
							<Label htmlFor="group-name">Group Name</Label>
							<Input
								id="group-name"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								placeholder="Enter group name"
								className="mt-1"
							/>
						</div>
					</div>

					{selectedMembers.length > 0 && (
						<div>
							<Label>
								Selected Members ({selectedMembers.length})
							</Label>
							<div className="flex flex-wrap gap-2 mt-2">
								{selectedMembers.map((member) => (
									<Badge
										key={member._id}
										variant="secondary"
										className="pl-1 pr-1"
									>
										<Avatar className="h-5 w-5 mr-1">
											<img
												src={
													member.avatar ||
													'https://via.placeholder.com/150'
												}
												alt={member.name}
												className="h-full w-full object-cover"
											/>
										</Avatar>
										<span className="mr-1">
											{member.name}
										</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-4 w-4 p-0 hover:bg-transparent"
											onClick={() =>
												handleRemoveMember(member._id)
											}
										>
											<X className="h-3 w-3" />
										</Button>
									</Badge>
								))}
							</div>
						</div>
					)}

					<div>
						<Label htmlFor="search-members">Add Members</Label>
						<div className="relative mt-1">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="search-members"
								placeholder="Search contacts"
								className="pl-8"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					{friendList.length > 0 && searchQuery && (
						<ScrollArea className="h-[200px] border rounded-md p-2">
							<div className="space-y-2">
								{filteredContacts.map((contact) => (
									<div
										key={contact._id}
										className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
										onClick={() =>
											handleSelectMember(contact)
										}
									>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<img
													src={
														contact.avatar ||
														'/placeholder.svg'
													}
													alt={contact.name}
													className="h-full w-full object-cover"
												/>
											</Avatar>
											<p className="font-medium text-sm">
												{contact.name}
											</p>
										</div>
										<Button size="sm" variant="ghost">
											Add
										</Button>
									</div>
								))}
							</div>
						</ScrollArea>
					)}

					{status === 'error' && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{statusMessage}</AlertDescription>
						</Alert>
					)}

					{status === 'success' && (
						<Alert className="bg-green-50 border-green-200">
							<CheckCircle2 className="h-4 w-4 text-green-600" />
							<AlertTitle className="text-green-800">
								Success
							</AlertTitle>
							<AlertDescription className="text-green-700">
								{statusMessage}
							</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleCreateGroup} disabled={isCreating}>
						{isCreating ? (
							<span className="flex items-center gap-2">
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Creating...
							</span>
						) : (
							<span className="flex items-center gap-2">
								<Users className="h-4 w-4" />
								Create Group
							</span>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

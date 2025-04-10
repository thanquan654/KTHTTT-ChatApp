'use client'

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
import { Search, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type User = {
	id: string
	name: string
	email: string
	avatar: string
	status: string
}

// Mock API call to search users
const searchUsers = async (query: string): Promise<User[]> => {
	// This would be an API call in a real application
	// For demo purposes, we'll return mock data
	await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay

	// Mock users data
	const allUsers = [
		{
			id: 'user1',
			name: 'Alex Johnson',
			email: 'alex.johnson@example.com',
			avatar: '/placeholder.svg?height=40&width=40',
			status: 'online',
		},
		{
			id: 'user2',
			name: 'Taylor Smith',
			email: 'taylor.smith@example.com',
			avatar: '/placeholder.svg?height=40&width=40',
			status: 'offline',
		},
		{
			id: 'user3',
			name: 'Jordan Lee',
			email: 'jordan.lee@example.com',
			avatar: '/placeholder.svg?height=40&width=40',
			status: 'online',
		},
		{
			id: 'user4',
			name: 'Casey Brown',
			email: 'casey.brown@example.com',
			avatar: '/placeholder.svg?height=40&width=40',
			status: 'away',
		},
		{
			id: 'user5',
			name: 'Riley Wilson',
			email: 'riley.wilson@example.com',
			avatar: '/placeholder.svg?height=40&width=40',
			status: 'online',
		},
	]

	if (!query) return []

	return allUsers.filter(
		(user) =>
			user.name.toLowerCase().includes(query.toLowerCase()) ||
			user.email.toLowerCase().includes(query.toLowerCase()),
	)
}

type AddContactDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onContactAdded?: (contact: User) => void
}

export function AddContactDialog({
	open,
	onOpenChange,
	onContactAdded,
}: AddContactDialogProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [isSearching, setIsSearching] = useState(false)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [isAdding, setIsAdding] = useState(false)
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
	const [statusMessage, setStatusMessage] = useState('')

	const handleSearch = async () => {
		if (!searchQuery.trim()) return

		setIsSearching(true)
		setSearchResults([])
		setStatus('idle')

		try {
			const results = await searchUsers(searchQuery)
			setSearchResults(results)
			if (results.length === 0) {
				setStatus('error')
				setStatusMessage('No users found. Try a different search term.')
			}
		} catch (error) {
			setStatus('error')
			setStatusMessage(
				'An error occurred while searching. Please try again.',
			)
		} finally {
			setIsSearching(false)
		}
	}

	const handleAddContact = async (user: User) => {
		setSelectedUser(user)
		setIsAdding(true)
		setStatus('idle')

		try {
			// This would be an API call in a real application
			await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay

			setStatus('success')
			setStatusMessage(`${user.name} has been added to your contacts!`)

			// Notify parent component
			if (onContactAdded) {
				onContactAdded(user)
			}

			// Reset form after successful addition
			setTimeout(() => {
				setSearchQuery('')
				setSearchResults([])
				setSelectedUser(null)
				setStatus('idle')
				onOpenChange(false)
			}, 2000)
		} catch (error) {
			setStatus('error')
			setStatusMessage('Failed to add contact. Please try again.')
		} finally {
			setIsAdding(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Contact</DialogTitle>
					<DialogDescription>
						Search for users by name or email to add them to your
						contacts.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-end gap-2 py-4">
					<div className="grid flex-1 gap-2">
						<Label htmlFor="search-contact" className="sr-only">
							Search
						</Label>
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="search-contact"
								placeholder="Search by name or email"
								className="pl-8"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleSearch()
									}
								}}
							/>
						</div>
					</div>
					<Button
						type="button"
						onClick={handleSearch}
						disabled={isSearching || !searchQuery.trim()}
					>
						{isSearching ? 'Searching...' : 'Search'}
					</Button>
				</div>

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

				{searchResults.length > 0 && (
					<div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
						{searchResults.map((user) => (
							<div
								key={user.id}
								className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors"
							>
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<img
											src={
												user.avatar ||
												'/placeholder.svg'
											}
											alt={user.name}
											className="h-full w-full object-cover"
										/>
									</Avatar>
									<div>
										<p className="font-medium text-sm">
											{user.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{user.email}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									onClick={() => handleAddContact(user)}
									disabled={
										isAdding && selectedUser?.id === user.id
									}
								>
									{isAdding &&
									selectedUser?.id === user.id ? (
										<span className="flex items-center gap-1">
											<span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
											Adding...
										</span>
									) : (
										<span className="flex items-center gap-1">
											<UserPlus className="h-3.5 w-3.5" />
											Add
										</span>
									)}
								</Button>
							</div>
						))}
					</div>
				)}

				<DialogFooter className="sm:justify-start">
					<Button
						type="button"
						variant="secondary"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

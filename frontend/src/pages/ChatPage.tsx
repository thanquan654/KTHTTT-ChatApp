import { useState } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import UserSidebar from '@/components/chat/ChatSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function Home() {
	const [selectedUser, setSelectedUser] = useState<string | null>(null)

	return (
		<main className="flex min-h-screen bg-gray-50">
			<SidebarProvider>
				<UserSidebar
					onSelectUser={setSelectedUser}
					selectedUser={selectedUser}
				/>
				<div className="flex-1 p-1 md:p-4 flex items-center justify-center">
					<div className="w-full h-full  shadow-xl rounded-xl overflow-hidden border border-gray-200">
						<ChatInterface selectedUser={selectedUser} />
					</div>
				</div>
			</SidebarProvider>
		</main>
	)
}

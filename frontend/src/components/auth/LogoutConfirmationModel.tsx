'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { LogOut, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

export default function LogoutConfirmation() {
	const [isLoading, setIsLoading] = useState(false)
	const navigator = useNavigate()

	const handleLogout = () => {
		setIsLoading(true)

		// Simulate logout delay
		setTimeout(() => {
			// In a real app, you would clear auth tokens, call logout API, etc.
			localStorage.removeItem('isAuthenticated')
			setIsLoading(false)
			navigator('/login')
		}, 1000)
	}

	const handleCancel = () => {
		navigator('/')
	}

	return (
		<Card className="w-full">
			<CardHeader className="text-center">
				<CardTitle>Sign Out</CardTitle>
				<CardDescription>
					Are you sure you want to sign out of your account?
				</CardDescription>
			</CardHeader>
			<CardContent className="flex justify-center">
				<div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
					<LogOut className="h-12 w-12 text-muted-foreground" />
				</div>
			</CardContent>
			<CardFooter className="flex flex-col space-y-2">
				<Button
					onClick={handleLogout}
					className="w-full"
					variant="destructive"
					disabled={isLoading}
				>
					{isLoading ? (
						<span className="flex items-center gap-2">
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							Signing out...
						</span>
					) : (
						<span className="flex items-center gap-2">
							<LogOut className="h-4 w-4" />
							Sign Out
						</span>
					)}
				</Button>
				<Button
					onClick={handleCancel}
					className="w-full"
					variant="outline"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Return to Chat
				</Button>
			</CardFooter>
		</Card>
	)
}

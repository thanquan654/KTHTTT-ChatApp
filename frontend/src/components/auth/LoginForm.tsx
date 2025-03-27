'use client'

import type React from 'react'

import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { AtSign, Lock, LogIn, Github, Twitter } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useNavigate } from 'react-router'

export default function LoginForm() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const navigator = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		// Simulate authentication delay
		setTimeout(() => {
			// In a real app, you would validate credentials with your backend
			localStorage.setItem('isAuthenticated', 'true')
			setIsLoading(false)
			navigator('/')
		}, 1500)
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Sign In</CardTitle>
				<CardDescription>
					Enter your credentials to access your account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="pl-10"
								required
							/>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Password</Label>
							<Link
								to="/forgot-password"
								className="text-xs text-primary hover:underline"
							>
								Forgot password?
							</Link>
						</div>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pl-10"
								required
							/>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox id="remember" />
						<Label
							htmlFor="remember"
							className="text-sm font-normal"
						>
							Remember me for 30 days
						</Label>
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<span className="flex items-center gap-2">
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Signing in...
							</span>
						) : (
							<span className="flex items-center gap-2">
								<LogIn className="h-4 w-4" />
								Sign In
							</span>
						)}
					</Button>
				</form>

				<div className="mt-6">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<div className="mt-6 grid grid-cols-2 gap-4">
						<Button
							variant="outline"
							type="button"
							className="w-full"
						>
							<Github className="mr-2 h-4 w-4" />
							Github
						</Button>
						<Button
							variant="outline"
							type="button"
							className="w-full"
						>
							<Twitter className="mr-2 h-4 w-4" />
							Twitter
						</Button>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-center border-t p-6">
				<p className="text-sm text-muted-foreground">
					Don&apos;t have an account?{' '}
					<Link
						to="/signup"
						className="font-medium text-primary hover:underline"
					>
						Sign up
					</Link>
				</p>
			</CardFooter>
		</Card>
	)
}

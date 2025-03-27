'use client'

import type React from 'react'

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { AtSign, Lock, User, UserPlus } from 'lucide-react'

export default function SignupForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isLoading, setIsLoading] = useState(false)
	const [agreedToTerms, setAgreedToTerms] = useState(false)
	const navgator = useNavigate()

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		// Clear error when user types
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[name]
				return newErrors
			})
		}
	}

	const validateForm = () => {
		const newErrors: Record<string, string> = {}

		if (!formData.name.trim()) {
			newErrors.name = 'Name is required'
		}

		if (!formData.email.trim()) {
			newErrors.email = 'Email is required'
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid'
		}

		if (!formData.password) {
			newErrors.password = 'Password is required'
		} else if (formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters'
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match'
		}

		if (!agreedToTerms) {
			newErrors.terms = 'You must agree to the terms and conditions'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setIsLoading(true)

		// Simulate signup delay
		setTimeout(() => {
			// In a real app, you would send the data to your backend
			localStorage.setItem('isAuthenticated', 'true')
			setIsLoading(false)
			navgator('/')
		}, 1500)
	}

	return (
		<Card className="w-full">
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Full Name</Label>
						<div className="relative">
							<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="name"
								name="name"
								placeholder="John Doe"
								value={formData.name}
								onChange={handleChange}
								className={`pl-10 ${
									errors.name ? 'border-destructive' : ''
								}`}
							/>
						</div>
						{errors.name && (
							<p className="text-xs text-destructive mt-1">
								{errors.name}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="name@example.com"
								value={formData.email}
								onChange={handleChange}
								className={`pl-10 ${
									errors.email ? 'border-destructive' : ''
								}`}
							/>
						</div>
						{errors.email && (
							<p className="text-xs text-destructive mt-1">
								{errors.email}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleChange}
								className={`pl-10 ${
									errors.password ? 'border-destructive' : ''
								}`}
							/>
						</div>
						{errors.password && (
							<p className="text-xs text-destructive mt-1">
								{errors.password}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">
							Confirm Password
						</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								placeholder="••••••••"
								value={formData.confirmPassword}
								onChange={handleChange}
								className={`pl-10 ${
									errors.confirmPassword
										? 'border-destructive'
										: ''
								}`}
							/>
						</div>
						{errors.confirmPassword && (
							<p className="text-xs text-destructive mt-1">
								{errors.confirmPassword}
							</p>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="terms"
							checked={agreedToTerms}
							onCheckedChange={(checked) =>
								setAgreedToTerms(checked === true)
							}
							className={errors.terms ? 'border-destructive' : ''}
						/>
						<div className="grid gap-1.5 leading-none">
							<Label
								htmlFor="terms"
								className="text-sm font-normal"
							>
								I agree to the{' '}
								<Link
									to="/terms"
									className="font-medium text-primary hover:underline"
								>
									Terms of Service
								</Link>{' '}
								and{' '}
								<Link
									to="/privacy"
									className="font-medium text-primary hover:underline"
								>
									Privacy Policy
								</Link>
							</Label>
							{errors.terms && (
								<p className="text-xs text-destructive">
									{errors.terms}
								</p>
							)}
						</div>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading ? (
							<span className="flex items-center gap-2">
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Creating account...
							</span>
						) : (
							<span className="flex items-center gap-2">
								<UserPlus className="h-4 w-4" />
								Create Account
							</span>
						)}
					</Button>
				</form>
			</CardContent>
			<CardFooter className="flex justify-center border-t p-6">
				<p className="text-sm text-muted-foreground">
					Already have an account?{' '}
					<Link
						to="/login"
						className="font-medium text-primary hover:underline"
					>
						Sign in
					</Link>
				</p>
			</CardFooter>
		</Card>
	)
}

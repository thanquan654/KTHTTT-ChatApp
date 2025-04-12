import LoginForm from '@/components/auth/LoginForm'
import { login } from '@/store/userSlice'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store/store'

export default function LoginPage() {
	const dispatch = useDispatch<AppDispatch>()
	const [loginForm, setLoginForm] = useState({
		email: 'quan@gmail.com',
		password: '123456',
	})

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setLoginForm((prev) => ({ ...prev, [name]: value }))
	}

	const handleLogin = () => {
		dispatch(login(loginForm))
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight text-gray-900">
						Welcome back
					</h1>
					<p className="mt-2 text-sm text-gray-600">
						Sign in to your account to continue chatting
					</p>
				</div>
				<LoginForm
					data={loginForm}
					handleChange={handleInputChange}
					handleLogin={handleLogin}
				/>
			</div>
		</div>
	)
}

import SignupForm from '@/components/auth/SignUpFrom'
import { AppDispatch } from '@/store/store'
import { signup } from '@/store/userSlice'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

export default function SignupPage() {
	const dispatch = useDispatch<AppDispatch>()
	const [signupForm, setSignupForm] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	})

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setSignupForm((prev) => ({ ...prev, [name]: value }))
	}

	const handleSignup = () => {
		dispatch(signup(signupForm))
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight text-gray-900">
						Create an account
					</h1>
					<p className="mt-2 text-sm text-gray-600">
						Join our community and start chatting with friends
					</p>
				</div>
				<SignupForm
					data={signupForm}
					handleChange={handleInputChange}
					handleSignup={handleSignup}
				/>
			</div>
		</div>
	)
}

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import LoginPage from '@/pages/LoginPage.tsx'
import SignupPage from '@/pages/SignupPage.tsx'
import LogoutConfirmation from '@/components/auth/LogoutConfirmationModel.tsx'

createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<Routes>
			<Route index element={<App />} />
			<Route path="/chat/:chatId" element={<LogoutConfirmation />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/signup" element={<SignupPage />} />
			<Route path="*" element={<div>404</div>} />
		</Routes>
	</BrowserRouter>,
)

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import LoginPage from '@/pages/LoginPage.tsx'

createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<Routes>
			<Route index element={<App />} />
			<Route path="/chat/:chatId" element={<div>Chat</div>} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/signup" element={<div>Sign Up</div>} />
		</Routes>
	</BrowserRouter>,
)

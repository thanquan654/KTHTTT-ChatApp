import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import LoginPage from '@/pages/LoginPage.tsx'
import SignupPage from '@/pages/SignupPage.tsx'
import ChatPage from '@/pages/ChatPage.tsx'
import PrivateRoute from '@/components/PrivateRoute.tsx'
import { store } from '@/store/store.ts'
import { Provider } from 'react-redux'

createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<BrowserRouter>
			<Routes>
				<Route index element={<App />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<SignupPage />} />

				<Route element={<PrivateRoute />}>
					<Route path="/chat/:chatId" element={<ChatPage />} />
				</Route>

				<Route path="*" element={<div>404</div>} />
			</Routes>
		</BrowserRouter>
	</Provider>,
)

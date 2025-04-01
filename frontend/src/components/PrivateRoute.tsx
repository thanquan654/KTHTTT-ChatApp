import { RootState } from '@/store/store'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router'

export default function PrivateRoute() {
	const isAuthenticated = useSelector(
		(state: RootState) => state.user.isAuthenticated,
	)

	return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}

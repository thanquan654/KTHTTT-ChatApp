import { AppDispatch, RootState } from '@/store/store'
import { loadUserFromToken } from '@/store/userSlice'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router'

export default function PrivateRoute() {
	const isAuthenticated = useSelector(
		(state: RootState) => state.user.isAuthenticated,
	)

	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		if (!isAuthenticated && localStorage.getItem('token'))
			dispatch(loadUserFromToken())
	})

	return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}

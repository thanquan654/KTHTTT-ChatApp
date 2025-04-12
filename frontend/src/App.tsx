import { fetchUserRoomsAndSelectFirst } from '@/store/roomSlice'
import { AppDispatch, RootState } from '@/store/store'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

function App() {
	const navigator = useNavigate()
	const dispatch = useDispatch<AppDispatch>()
	const isAuthenticated = useSelector(
		(state: RootState) => state.user.isAuthenticated,
	)
	const user = useSelector((state: RootState) => state.user.user)
	const selectedRoomId = useSelector(
		(state: RootState) => state.room.selectedRoomId,
	)

	useEffect(() => {
		if (!isAuthenticated) {
			navigator('/login')
		} else {
			// get chat room current user is in
			if (user)
				dispatch(fetchUserRoomsAndSelectFirst({ userId: user._id }))
		}
	}, [dispatch, isAuthenticated, navigator, selectedRoomId, user])

	useEffect(() => {
		if (isAuthenticated && selectedRoomId) {
			console.log(
				`Selected room ID received: ${selectedRoomId}. Navigating...`,
			)
			navigator(`/chat/${selectedRoomId}`)
		}
	}, [isAuthenticated, navigator, selectedRoomId])

	return <></>
}

export default App

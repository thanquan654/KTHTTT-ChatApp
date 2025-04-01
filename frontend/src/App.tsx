import { getRoomList } from '@/store/roomSlice'
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
	const selectedRoom = useSelector(
		(state: RootState) => state.room.selectedRoom,
	)

	useEffect(() => {
		if (!isAuthenticated) {
			navigator('/login')
		} else {
			// get chat room current user is in
			if (user) dispatch(getRoomList({ currentUser: user?._id }))
			navigator(`/chat/${selectedRoom}`)
		}
	}, [dispatch, isAuthenticated, navigator, selectedRoom, user])

	return <></>
}

export default App

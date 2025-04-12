import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { IUser } from '@/types/User.type'

// Kiểu dữ liệu
export interface UserSliceState {
	isAuthenticated: boolean
	user: IUser | null
	status: 'idle' | 'loading' | 'succeeded' | 'failed'
	error: string | null
}

const initialState: UserSliceState = {
	isAuthenticated: false,
	user: null,
	status: 'idle',
	error: null,
}

// Async thunk cho login
export const login = createAsyncThunk(
	'user/login',
	async (
		payload: { email: string; password: string },
		{ rejectWithValue },
	) => {
		try {
			const res = await axios.post(
				'http://127.0.0.1:5000/api/auth/login',
				payload,
			)
			localStorage.setItem('token', res.data.access_token)
			return res.data.user
		} catch (err: any) {
			return rejectWithValue(
				err.response?.data?.message || 'Đăng nhập thất bại',
			)
		}
	},
)

//
export const loadUserFromToken = createAsyncThunk(
	'user/loadUserFromToken',
	async (_, { rejectWithValue }) => {
		const token = localStorage.getItem('token')
		if (!token) return rejectWithValue('No token found')

		try {
			const res = await axios.get('http://127.0.0.1:5000/api/auth/me', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			return res.data.user
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			// Có thể bị expired token hoặc token sai
			return rejectWithValue('Token invalid or expired')
		}
	},
)

// Async thunk cho signup
export const signup = createAsyncThunk(
	'user/signup',
	async (
		payload: { name: string; email: string; password: string },
		{ rejectWithValue },
	) => {
		try {
			const res = await axios.post(
				'http://127.0.0.1:5000/api/auth/signup',
				payload,
			)
			localStorage.setItem('token', res.data.access_token)
			return res.data.user
		} catch (err: any) {
			return rejectWithValue(
				err.response?.data?.message || 'Đăng ký thất bại',
			)
		}
	},
)

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		logout(state) {
			state.isAuthenticated = false
			state.user = null
			state.status = 'idle'
			state.error = null
			localStorage.removeItem('token')
		},
	},
	extraReducers: (builder) => {
		// Login
		builder
			.addCase(login.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(login.fulfilled, (state, action: PayloadAction<IUser>) => {
				state.status = 'succeeded'
				state.isAuthenticated = true
				state.user = action.payload
			})
			.addCase(login.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload as string
			})

		// Signup
		builder
			.addCase(signup.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(
				signup.fulfilled,
				(state, action: PayloadAction<IUser>) => {
					state.status = 'succeeded'
					state.isAuthenticated = true
					state.user = action.payload
				},
			)
			.addCase(signup.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload as string
			})

		builder
			.addCase(loadUserFromToken.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(
				loadUserFromToken.fulfilled,
				(state, action: PayloadAction<IUser>) => {
					state.status = 'succeeded'
					state.isAuthenticated = true
					state.user = action.payload
				},
			)
			.addCase(loadUserFromToken.rejected, (state, action) => {
				state.status = 'failed'
				state.isAuthenticated = false
				state.user = null
				state.error = action.payload as string
				localStorage.removeItem('token') // clear token nếu fail
			})
	},
})

export const { logout } = userSlice.actions
export default userSlice.reducer

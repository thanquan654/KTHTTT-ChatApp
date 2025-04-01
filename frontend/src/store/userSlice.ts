import { IUser } from '@/types/User.type'
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface UserSliceState {
	isAuthenticated: boolean
	user: IUser | null
}

const initialState: UserSliceState = {
	isAuthenticated: true,
	user: null,
}

export const counterSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		login: (
			state,
			action: PayloadAction<{ email: string; password: string }>,
		) => {
			state.isAuthenticated = true
			state.user = null
		},
		logout: (state) => {
			state.isAuthenticated = false
			state.user = null
		},
	},
})

// Action creators are generated for each case reducer function
export const { login, logout } = counterSlice.actions

export default counterSlice.reducer

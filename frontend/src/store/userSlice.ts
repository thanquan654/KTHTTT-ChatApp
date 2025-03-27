import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface UserSliceState {
	isAuthenticated: boolean
	user: unknown | null
}

const initialState: UserSliceState = {
	isAuthenticated: false,
	user: null,
}

export const counterSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		login: (state, action: PayloadAction<unknown>) => {
			state.isAuthenticated = true
			state.user = action.payload
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

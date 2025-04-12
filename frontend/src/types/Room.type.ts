import { IUser } from '@/types/User.type'

export interface IRoom {
	_id: string
	name: string
	lastMessage: string
	members: IUser[]
	type: 'private' | 'group'
	createdAt: string
}

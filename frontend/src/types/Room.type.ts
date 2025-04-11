export interface IRoom {
	_id: string
	name: string
	lastMessage: string
	members: string[]
	type: 'private' | 'group'
	createdAt: string
}

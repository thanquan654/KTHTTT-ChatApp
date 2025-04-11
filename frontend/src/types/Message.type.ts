export interface IMessage {
	_id: string
	groupId: string
	senderId: string
	content: string
	readBy: string[]
	createdAt: string
}

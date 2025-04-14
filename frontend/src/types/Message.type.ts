export interface IMessage {
	_id: string
	roomId: string
	senderId: string
	content: string
	readBy: string[]
	createdAt: number
}

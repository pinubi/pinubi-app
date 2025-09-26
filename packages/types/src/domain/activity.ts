export type ActivityEntity<T> = {
  id: string
  userId: string
  type: string
  data: T
  createdAt: string
}

export type ActivityInvitedData = {
  invitedUserId: string
  invitedUserName: string
}
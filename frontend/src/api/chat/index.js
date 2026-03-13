import { apiFetch } from '../../plugins/interceptor.js'

// 채팅방 목록
const chatRoomList = async () => {
  try {
    const res = await apiFetch('/chat/room/list')
   
    if (res && res.data && Array.isArray(res.data)) {
      const mappedData = res.data.map(room => ({
        id: room.idx,
        name: room.opponentUserName || '',
        avatar: room.opponentUserProfileImage || '',
        role: room.opponentUserCareer || '',
        content: room.lastContents || '',
      }))
      return { ...res, data: mappedData }
    }
    
    return res
  } catch (error) {
    console.error('채팅방 목록 호출 실패:', error.message)
    throw error
  }
}

// 특정 채팅방의 메시지 가져오기
const getChatMessages = async (roomId) => {
  try {
    const res = await apiFetch(`/chat/room/${roomId}/messages`)
    console.log(res)
    return res
  } catch (error) {
    console.error(`${roomId}번 방 이전 채팅 내역 조회 실패`, error.message)
    throw error
  }
}

// 화상 채팅 정보
const loadPortfolios = async () => {
  try {
    const res = await apiFetch('/json/chat/my-portfolios')
    console.log(res)
    return res
  } catch (error) {
    console.error('API 호출 실패:', error.message)
    throw error
  }
}

// 채팅방 생성
const createChatRoom = async (guestUserId) => {
  try {
    const res = await apiFetch(`/chat/room/create/${guestUserId}`, {
      method: 'POST',
    })
    return res
  } catch (error) {
    console.error('채팅방 생성 실패:', error.message)
    throw error
  }
}

export default {
  chatRoomList,
  getChatMessages,
  loadPortfolios,
  createChatRoom,
}

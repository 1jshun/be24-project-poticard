import { apiFetch } from '@/plugins/interceptor'

const getNamecardsInfo = async () => {
  try {
    const res = await apiFetch('json/namecards/namecardsFront')

    return res
  } catch (error) {
    console.error('명함 정보 호출 실패:', error.message)
  }
}

const getUserInfo = async (userId) => {
  try {
    const res = await apiFetch(`/namecard/singleUser?userId=${userId}`)
    return res
  } catch (error) {
    console.error('명함 정보 호출 실패:', error.message)
  }
}

const getNamecardList = async (page, size) => {
  try {
    const res = await apiFetch(`/namecard/list?page=${page}&size=${size}`)
    return res
  } catch (error) {
    console.error('명함 리스트 정보 호출 실패:', error.message)
  }
}


export default {
  getUserInfo,
  getNamecardsInfo,
  getNamecardList
}

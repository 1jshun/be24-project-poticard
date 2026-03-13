import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/namecard/index'

export const namecardListStore = defineStore('namecardList', () => {
  const listData = ref(null)

  // page, size에 기본값을 설정해두면 호출할 때 편합니다.
  const namecardList = async (page = 1, size = 20) => {
    const pageKey = `namecardList_${page}_${size}`

    try {
      // 1. 캐시 확인
      const cacheStr = sessionStorage.getItem(pageKey)
      if (cacheStr) {
        const parsed = JSON.parse(cacheStr)
        listData.value = parsed // ✅ 오타 수정: cacheData.value가 아니라 listData.value!
        return parsed
      }

      // 2. API 호출
      const res = await api.getNamecardList(page, size)

      // Axios를 쓴다면 실제 백엔드의 JSON 응답은 res.data에 들어있습니다.
      if (res && res.data) {
        // 백엔드 응답(res.data) 자체가 이미 완벽한 구조이므로 그대로 캐싱하고 반환합니다.
        const responseData = res.data

        sessionStorage.setItem(pageKey, JSON.stringify(responseData))
        listData.value = responseData
        return responseData
      }
    } catch (e) {
      console.error('데이터 로드 실패:', e)
      return null
    }
  }
  
  return { listData, namecardList }
})
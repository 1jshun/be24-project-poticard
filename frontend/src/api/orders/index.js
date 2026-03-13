import { apiFetch } from '@/plugins/interceptor'

export const verifyPayment = async (payload) => {
  try {
    const res = await apiFetch('/orders/verify', {
      method: 'POST',
      body: payload
    })
    return res
  } catch (error) {
    console.error('결제 검증 호출 실패:', error.message)
    throw error
  }
}

export default {
  verifyPayment
}
import { apiFetch } from '@/plugins/interceptor'
import api from '@/plugins/axiosinterceptor' 

export const getProjects = async () => {
  try {
    const res = await apiFetch('json/projects/allProjects')
    return res
  } catch (error) {
    console.error('프로젝트 목록 호출 실패:', error.message)
    return { projects: [] }
  }
}

// 포트폴리오 생성 API
export const createPortfolio = async (portfolioData) => {
  try {
    const res = await api.post('/portfolio/create', portfolioData)
    return res.data
  } catch (error) {
    console.error('포트폴리오 생성 실패:', error)
    throw error
  }
}
// 포트폴리오 섹션 조회 API
export const getPortfolioSections = async (portfolioIdx) => {
  try {
    const res = await api.get(`/section/list/${portfolioIdx}`)
    return res.data
  } catch (error) {
    console.error('섹션 목록 조회 실패:', error)
    throw error
  }
}
// 포트폴리오 키워드 저장 API
export const updateKeywords = async (portfolioIdx, keywords) => {
  try {
    const res = await api.patch(`/portfolio/${portfolioIdx}/keywords`, keywords)
    return res.data
  } catch (error) {
    console.error('키워드 저장 실패:', error)
    throw error
  }
}
// 포트폴리오 스타일 저장 API
export const updateStyle = async (portfolioIdx, styleData) => {
  try {
    const res = await api.patch(`/portfolio/${portfolioIdx}/style`, styleData)
    return res.data
  } catch (error) {
    console.error('스타일 저장 실패:', error)
    throw error
  }
}
// 포트폴리오 목록 조회 API
export const getPortfolioList = async (page = 0, size = 10) => {
  try {
    const res = await api.get('/portfolio/list', { params: { page, size } })
    return res.data
  } catch (error) {
    console.error('포트폴리오 목록 조회 실패:', error)
    throw error
  }
}

export default {
  getProjects,
  createPortfolio,
  getPortfolioSections,
  updateKeywords,
  updateStyle,
  getPortfolioList
}
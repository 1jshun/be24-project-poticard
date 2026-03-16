import { apiFetch } from '@/plugins/interceptor'

// 1. 프로젝트 목록 조회 (JSON 파일 호출)
export const getProjects = async () => {
  try {
    const res = await apiFetch('json/projects/allProjects')
    return res
  } catch (error) {
    console.error('프로젝트 목록 호출 실패:', error.message)
    return { projects: [] }
  }
}

// 프로젝트 상세 조회 API
export const getProjectDetail = async (portfolioIdx) => {
  return await apiFetch(`portfolio/${portfolioIdx}`) 
}

// 포트폴리오 생성 API
export const createPortfolio = async (portfolioData) => {
  return await apiFetch('portfolio/create', {
    method: 'POST',
    body: portfolioData
  })
}

// 포트폴리오 섹션 목록 조회 API
export const getPortfolioSections = async (portfolioIdx) => {
  return await apiFetch(`section/list/${portfolioIdx}`)
}

// 포트폴리오 진행 상황 저장 API
export const savePortfolioProgress = async (portfolioIdx, payload) => {
  return await apiFetch(`portfolio/${portfolioIdx}/save-progress`, {
    method: 'PATCH',
    body: payload
  })
}

// 포트폴리오 스타일 저장 API
export const updateStyle = async (portfolioIdx, styleData) => {
  return await apiFetch(`portfolio/${portfolioIdx}/style`, {
    method: 'PATCH',
    body: styleData
  })
}

// 포트폴리오 목록 조회 API
export const getPortfolioList = async (page = 0, size = 10) => {
  return await apiFetch(`portfolio/list?page=${page}&size=${size}`)
}

// 포트폴리오 키워드 저장 API
export const updateKeywords = async (portfolioIdx, keywords) => {
  return await apiFetch(`portfolio/${portfolioIdx}/keywords`, {
    method: 'PATCH',
    body: keywords
  })
}

export const getAiReview = async (contents) => {
  return await apiFetch('portfolio/ai-review', {
    method: 'POST',
    body: { contents }
  })
}

export const extractKeywordsAi = async (contents) => {
  return await apiFetch('portfolio/ai-keywords', {
    method: 'POST',
    body: { contents }
  })
}

export default {
  getProjects,
  createPortfolio,
  getPortfolioSections,
  savePortfolioProgress,
  updateStyle,
  getPortfolioList,
  updateKeywords,
  getProjectDetail,
  getAiReview,
  extractKeywordsAi
}
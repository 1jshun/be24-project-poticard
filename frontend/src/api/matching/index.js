import { apiFetch } from '@/plugins/interceptor'

const normalize = (raw = {}) => ({
  id: raw.idx,
  name: raw.companyName || '',
  role: raw.title || '',
  category: raw.category || 'ALL',
  location: raw.location || '',
  exp: raw.experience || '',
  skills: Array.isArray(raw.skills) ? raw.skills : [],
  likes: Number(raw.favoriteCount ?? 0),
  views: Number(raw.viewCount ?? 0),
  updatedAt: raw.updatedAt || '',
  isFavorite: Boolean(raw.favorite),
  remotePossible: Boolean(raw.remotePossible),
  detail: raw,
})

const list = async ({ keyword = '', category = 'ALL', favoriteOnly = false, sort = 'popular' } = {}) => {
  const query = new URLSearchParams({
    keyword,
    category,
    favoriteOnly: String(favoriteOnly),
    sort,
  })

  const res = await apiFetch(`/company/public/list?${query.toString()}`)
  return Array.isArray(res?.data) ? res.data.map(normalize) : []
}

const detail = async (id) => {
  const res = await apiFetch(`/company/public/read/${id}`)
  return normalize(res?.data || {})
}

const toggleFavorite = async (id) => {
  return await apiFetch(`/company/public/favorite/${id}`, {
    method: 'PATCH',
  })
}

const recommend = async (size = 4) => {
  const res = await apiFetch(`/company/public/recommend?size=${size}`)
  return Array.isArray(res?.data) ? res.data.map(normalize) : []
}

export default { list, detail, toggleFavorite, recommend }
import { apiFetch } from '@/plugins/interceptor'

const toPostDetail = (item = {}) => ({
  postId: item.idx,
  category: item.category,
  isSolved: item.solved,
  title: item.title,
  author: item.writer,
  tags: Array.isArray(item.tags) ? item.tags : [],
  likes: Number(item.likesCount ?? 0),
  replys: Number(item.commentCount ?? 0),
  body: item.contents ?? '',
  createdAt: item.createdAt,
})

const getPosts = async (page = 0, size = 100) => {
  try {
    const res = await apiFetch(`/community/list?page=${page}&size=${size}`)
    const data = res?.data || {}

    return {
      ...res,
      data: {
        ...data,
        communityList: (data.communityList || []).map(toPostDetail),
      },
    }
  } catch (error) {
    console.error('커뮤니티 목록 호출 실패:', error.message)
    throw error
  }
}

const getPostDetail = async (postId) => {
  try {
    const res = await apiFetch(`/community/read/${postId}`)

    if (!res || !res.data) {
      return res
    }

    return {
      ...res,
      data: toPostDetail(res.data),
    }
  } catch (error) {
    console.error('커뮤니티 글 호출 실패:', error.message)
    throw error
  }
}

const createPost = async (req) => {
  try {
    const res = await apiFetch('/community/reg', {
      method: 'POST',
      body: req,
    })
    return res
  } catch (error) {
    console.error('커뮤니티 글 등록 실패:', error.message)
    throw error
  }
}

const updatePost = async (postId, req) => {
  try {
    const res = await apiFetch(`/community/update/${postId}`, {
      method: 'PUT',
      body: req,
    })
    return res
  } catch (error) {
    console.error('커뮤니티 글 수정 실패:', error.message)
    throw error
  }
}

const deletePost = async (postId) => {
  try {
    const res = await apiFetch(`/community/delete/${postId}`, {
      method: 'DELETE',
    })
    return res
  } catch (error) {
    console.error('커뮤니티 글 삭제 실패:', error.message)
    throw error
  }
}

export default {
  getPosts,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,
}
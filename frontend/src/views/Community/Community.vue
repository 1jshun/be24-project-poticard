<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/community/index'
import matchingApi from '@/api/matching'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'

const router = useRouter()
const posts = ref([])
const isLoading = ref(false)
const summaryLoading = ref(false)
const selectedPost = ref(null)
const detailLoading = ref(false)
const commentInput = ref('')
const myMenuOpen = ref(false)
const cardModalOpen = ref(false)
const cardFlipped = ref(false)
const summary = ref({
  profile: null,
  namecard: null,
  popularPosts: [],
  myPosts: [],
  myComments: [],
})

const state = reactive({
  cat: 'ALL',
  tab: 'FEED',
  search: '',
  sort: 'HOT',
  tags: '',
  onlySolved: false,
  page: 1,
  pageSize: 4,
  scope: 'ALL',
})

const formatTimeAgo = (dateString) => {
  if (!dateString) return '-'
  const parts = dateString.split(/[-:]/)
  const targetDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5])
  const now = new Date()
  const diff = (now - targetDate) / 1000

  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return `${targetDate.getFullYear()}.${targetDate.getMonth() + 1}.${targetDate.getDate()}`
}

const mapPost = (item) => ({
  id: item.postId,
  cat: item.category,
  solved: item.isSolved,
  title: item.title,
  author: item.author,
  writerIdx: item.writerIdx,
  tags: Array.isArray(item.tags) ? item.tags : [],
  like: Number(item.likes ?? 0),
  comment: Number(item.replys ?? 0),
  view: Number(item.views ?? 0),
  time: formatTimeAgo(item.createdAt),
  body: item.body ?? '',
  isFavorite: Boolean(item.isFavorite),
  isOwner: Boolean(item.isOwner),
  createdAt: item.createdAt,
})

const myCardInfo = computed(() => {
  const card = summary.value.namecard
  const profile = summary.value.profile
  if (!card || !profile) return null

  return {
    role: card.title || profile.affiliation || 'Poticard User',
    name: card.name || profile.name,
    description: [profile.affiliation, profile.career].filter(Boolean).join(' · '),
    avatar:
      card.profileImage ||
      profile.profileImage ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'Poticard')}`,
    keywords: Array.isArray(card.keywords) ? card.keywords : [],
    website: card.url || '',
    email: card.email || profile.email,
    phone: card.phone || profile.phone,
    address: card.address || profile.address,
  }
})

const scopeLabel = computed(() => {
  if (state.scope === 'MY_POST') return '내 글'
  if (state.scope === 'MY_COMMENT') return '내 댓글'
  return '내 글/댓글'
})

const fetchAllPosts = async () => {
  isLoading.value = true
  try {
    const res = await api.getPosts(0, 100, state.scope)
    const communityList = res?.data?.communityList || []
    posts.value = communityList.map(mapPost)
  } catch (error) {
    posts.value = []
  } finally {
    isLoading.value = false
  }
}

const fetchSummary = async () => {
  summaryLoading.value = true
  try {
    const res = await api.getSummary()
    summary.value = {
      profile: res?.data?.profile || null,
      namecard: res?.data?.namecard || null,
      popularPosts: (res?.data?.popularPosts || []).map(mapPost),
      myPosts: (res?.data?.myPosts || []).map(mapPost),
      myComments: res?.data?.myComments || [],
    }
  } catch (error) {
    summary.value = {
      profile: null,
      namecard: null,
      popularPosts: [],
      myPosts: [],
      myComments: [],
    }
  } finally {
    summaryLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAllPosts(), fetchSummary()])
})

const filteredPosts = computed(() => {
  let list = [...posts.value]

  if (state.cat !== 'ALL') list = list.filter((p) => p.cat === state.cat)
  if (state.onlySolved) list = list.filter((p) => p.solved)

  const q = state.search.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  const tagSet = state.tags
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (tagSet.length) {
    list = list.filter((p) => tagSet.every((t) => p.tags.map((pt) => pt.toLowerCase()).includes(t)))
  }

  if (state.sort === 'HOT') list.sort((a, b) => b.like * 2 + b.comment * 2 + b.view - (a.like * 2 + a.comment * 2 + a.view))
  if (state.sort === 'COMMENT') list.sort((a, b) => b.comment - a.comment)
  if (state.sort === 'VIEW') list.sort((a, b) => b.view - a.view)
  if (state.sort === 'NEW') list.sort((a, b) => b.id - a.id)

  return list
})

const pagedPosts = computed(() => filteredPosts.value.slice(0, state.page * state.pageSize))

const resetFilters = async () => {
  state.cat = 'ALL'
  state.search = ''
  state.sort = 'HOT'
  state.tags = ''
  state.onlySolved = false
  state.page = 1
  state.scope = 'ALL'
  myMenuOpen.value = false
  await fetchAllPosts()
}

const changeScope = async (scope) => {
  state.scope = scope
  state.page = 1
  myMenuOpen.value = false
  await fetchAllPosts()
}

const loadMore = () => state.page++

const goEdit = (postId) => {
  router.push({ path: '/community-write', query: { postId } })
}

const removePost = async (postId) => {
  if (!window.confirm('이 게시글을 삭제할까요?')) return

  try {
    await api.deletePost(postId)
    if (selectedPost.value?.id === postId) selectedPost.value = null
    await Promise.all([fetchAllPosts(), fetchSummary()])
  } catch (error) {
    alert(error.message || '게시글 삭제에 실패했습니다.')
  }
}

const openDetail = async (postId) => {
  detailLoading.value = true
  try {
    const res = await api.getPostDetail(postId)
    selectedPost.value = mapPost(res?.data || {})
    selectedPost.value.comments = Array.isArray(res?.data?.comments) ? res.data.comments : []

    const current = posts.value.find((post) => post.id === postId)
    if (current) {
      current.view = selectedPost.value.view
      current.like = selectedPost.value.like
      current.comment = selectedPost.value.comment
      current.isFavorite = selectedPost.value.isFavorite
    }
  } catch (error) {
    alert(error.message || '게시글 상세를 불러오지 못했습니다.')
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => {
  selectedPost.value = null
  commentInput.value = ''
}

const toggleFavorite = async (post) => {
  try {
    const res = await api.toggleFavorite(post.id)
    const result = res?.data || {}
    post.isFavorite = Boolean(result.favorite)
    post.like = Number(result.likesCount ?? post.like)

    if (selectedPost.value && selectedPost.value.id === post.id) {
      selectedPost.value.isFavorite = post.isFavorite
      selectedPost.value.like = post.like
    }

    await fetchSummary()
  } catch (error) {
    alert(error.message || '즐겨찾기 처리에 실패했습니다.')
  }
}

const submitComment = async () => {
  if (!selectedPost.value || !commentInput.value.trim()) return

  try {
    await api.createComment(selectedPost.value.id, commentInput.value.trim())
    commentInput.value = ''
    await openDetail(selectedPost.value.id)
    await Promise.all([fetchAllPosts(), fetchSummary()])
  } catch (error) {
    alert(error.message || '댓글 등록에 실패했습니다.')
  }
}

const removeComment = async (commentId) => {
  if (!window.confirm('이 댓글을 삭제할까요?')) return

  try {
    await api.deleteComment(commentId)
    if (selectedPost.value) await openDetail(selectedPost.value.id)
    await Promise.all([fetchAllPosts(), fetchSummary()])
  } catch (error) {
    alert(error.message || '댓글 삭제에 실패했습니다.')
  }
}

const openNamecard = () => {
  if (!myCardInfo.value) {
    alert('등록된 내 명함이 없습니다.')
    return
  }
  cardFlipped.value = false
  cardModalOpen.value = true
}
</script>

<template>
  <div class="min-h-screen bg-pattern text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
    <main class="max-w-7xl mx-auto px-5 pt-10 pb-14">
      <div class="flex items-end justify-between gap-4 mb-8">
        <h1 class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">커뮤니티</h1>
        <div class="flex items-center gap-2 relative">
          <RouterLink
            to="/community-write"
            class="px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold transition-all"
          >
            글쓰기
          </RouterLink>
          <button
            @click="myMenuOpen = !myMenuOpen"
            class="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-900 font-extrabold shadow-sm transition-all"
          >
            {{ scopeLabel }}
          </button>

          <div
            v-if="myMenuOpen"
            class="absolute right-0 top-14 z-20 w-36 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-xl"
          >
            <button @click="changeScope('ALL')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-bold">전체 보기</button>
            <button @click="changeScope('MY_POST')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-bold">내 글</button>
            <button @click="changeScope('MY_COMMENT')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-bold">내 댓글</button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <aside class="col-span-12 lg:col-span-3 space-y-5">
          <div class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <span class="font-extrabold">탐색</span>
              <button @click="resetFilters" class="text-sm font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">초기화</button>
            </div>

            <div class="space-y-4">
              <div>
                <span class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">카테고리</span>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <button
                    v-for="cat in ['ALL', 'QNA', 'SHOWCASE', 'CAREER', 'STUDY', 'FREE']"
                    :key="cat"
                    @click="state.cat = cat; state.page = 1"
                    :class="[
                      'px-3 py-2 rounded-xl text-sm font-bold border transition-all',
                      state.cat === cat
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
                    ]"
                  >
                    {{ cat === 'ALL' ? '전체' : cat }}
                  </button>
                </div>
              </div>

              <div class="space-y-4 pt-2">
                <div>
                  <label class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">정렬</label>
                  <select
                    v-model="state.sort"
                    class="w-full mt-2 px-4 py-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold focus:ring-2 focus:ring-amber-300 outline-none"
                  >
                    <option value="HOT">인기순</option>
                    <option value="NEW">최신순</option>
                    <option value="COMMENT">댓글 많은 순</option>
                    <option value="VIEW">조회순</option>
                  </select>
                </div>

                <div>
                  <label class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">기술 태그</label>
                  <input
                    v-model="state.tags"
                    placeholder="Spring, React..."
                    class="w-full mt-2 px-4 py-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold focus:ring-2 focus:ring-amber-300 outline-none"
                  />
                </div>

                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" v-model="state.onlySolved" class="w-5 h-5 accent-amber-400 rounded-lg" />
                  <span class="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900">해결된 Q&A만</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <section class="col-span-12 lg:col-span-6 space-y-5">
          <div class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm space-y-4">
            <div class="flex flex-col md:flex-row gap-3">
              <div class="flex-1 relative">
                <input
                  v-model="state.search"
                  placeholder="제목, 작성자 검색..."
                  class="w-full pl-5 pr-12 py-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold focus:ring-2 focus:ring-amber-300 outline-none"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-500">⌘K</span>
              </div>
              <div class="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                <button
                  v-for="t in ['FEED', 'FOLLOW']"
                  :key="t"
                  @click="state.tab = t"
                  :class="[
                    'px-4 py-2 rounded-xl text-sm font-black transition-all',
                    state.tab === t ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400',
                  ]"
                >
                  {{ t }}
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-500 font-medium"><b class="text-zinc-900 dark:text-zinc-100">{{ filteredPosts.length }}</b>개의 포스트</span>
              <button @click="fetchAllPosts" class="text-zinc-500 hover:text-zinc-900 font-bold flex items-center gap-1">
                <span>{{ isLoading ? '불러오는 중...' : '새로고침' }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <article
              v-for="post in pagedPosts"
              :key="post.id"
              class="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] hover:border-amber-200 dark:hover:border-amber-900/50 transition-all group"
            >
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black text-zinc-500">{{ post.cat }}</span>
                    <span
                      v-if="post.cat === 'QNA'"
                      :class="post.solved ? 'px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-600' : 'px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-600'"
                    >
                      {{ post.solved ? '해결됨' : '미해결' }}
                    </span>
                    <span class="text-xs text-zinc-400 font-medium">{{ post.time }}</span>
                  </div>
                  <button @click="openDetail(post.id)" class="text-left w-full">
                    <h3 class="text-lg font-bold mb-3 group-hover:text-amber-600 transition-colors truncate">{{ post.title }}</h3>
                  </button>
                  <div class="flex flex-wrap gap-1.5 mb-4">
                    <span
                      v-for="tag in post.tags"
                      :key="tag"
                      class="px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-xs font-bold text-zinc-500"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                  <div class="text-sm">
                    <span class="text-zinc-400">작성자</span>
                    <span class="font-bold text-zinc-700 dark:text-zinc-300 ml-1">{{ post.author }}</span>
                  </div>
                </div>

                <div class="flex flex-col items-end gap-3">
                  <div v-if="post.isOwner" class="flex items-center gap-2">
                    <button @click="goEdit(post.id)" class="px-3 py-2 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-xs font-bold">수정</button>
                    <button @click="removePost(post.id)" class="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors text-xs font-bold">삭제</button>
                  </div>
                  <div class="flex items-center gap-3 text-xs font-bold">
                    <button @click="toggleFavorite(post)" :class="post.isFavorite ? 'text-rose-500' : ''">❤️ {{ post.like }}</button>
                    <button @click="openDetail(post.id)">💬 {{ post.comment }}</button>
                    <span>👁 {{ post.view }}</span>
                  </div>
                </div>
              </div>
            </article>

            <div v-if="!isLoading && pagedPosts.length === 0" class="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] text-center text-zinc-500 font-medium">
              조건에 맞는 게시글이 없습니다.
            </div>
          </div>

          <button
            v-if="filteredPosts.length > pagedPosts.length"
            @click="loadMore"
            class="w-full py-4 rounded-[20px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            더 많은 게시글 불러오기
          </button>
        </section>

        <aside class="col-span-12 lg:col-span-3 space-y-5">
          <div class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
            <h4 class="font-extrabold mb-4">내 프로필 요약</h4>
            <div class="space-y-4" v-if="summary.profile">
              <div>
                <p class="text-[11px] text-zinc-400 font-bold uppercase">관심 분야</p>
                <p class="font-bold">{{ summary.profile.affiliation || summary.profile.role || '개인 사용자' }}</p>
                <p class="text-sm text-zinc-500 mt-1">{{ summary.profile.name }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in (summary.namecard?.keywords || []).slice(0, 3)"
                  :key="tag"
                  class="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-black"
                >
                  {{ tag }}
                </span>
                <span v-if="(summary.namecard?.keywords || []).length === 0" class="text-sm text-zinc-400 font-bold">등록된 키워드가 없습니다.</span>
              </div>
              <button @click="openNamecard" class="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm">내 명함 불러오기</button>
            </div>
            <div v-else class="text-sm text-zinc-400 font-bold">로그인 후 내 프로필을 확인할 수 있습니다.</div>
          </div>

          <div class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-extrabold">오늘의 인기글</h4>
              <span class="text-[10px] font-bold text-amber-500">HOT</span>
            </div>
            <div class="space-y-3">
              <button
                v-for="post in summary.popularPosts"
                :key="post.id"
                @click="openDetail(post.id)"
                class="w-full text-left block p-3 rounded-xl border border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                <p class="text-sm font-bold truncate">{{ post.title }}</p>
                <p class="text-[11px] text-zinc-400 mt-1">추천 {{ post.like }} · 댓글 {{ post.comment }} · 조회 {{ post.view }}</p>
              </button>
              <div v-if="!summaryLoading && summary.popularPosts.length === 0" class="text-sm text-zinc-400 font-bold">아직 인기글이 없습니다.</div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <div v-if="selectedPost" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-zinc-950/60" @click="closeDetail"></div>
      <div class="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-[28px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black text-zinc-500">{{ selectedPost.cat }}</span>
              <span
                v-if="selectedPost.cat === 'QNA'"
                :class="selectedPost.solved ? 'px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-600' : 'px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-600'"
              >
                {{ selectedPost.solved ? '해결됨' : '미해결' }}
              </span>
              <span class="text-xs text-zinc-400 font-medium">{{ selectedPost.time }}</span>
            </div>
            <h2 class="text-2xl font-black">{{ selectedPost.title }}</h2>
            <p class="mt-2 text-sm text-zinc-500 font-bold">작성자 {{ selectedPost.author }}</p>
          </div>
          <button @click="closeDetail" class="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold">닫기</button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="tag in selectedPost.tags"
            :key="tag"
            class="px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-xs font-bold text-zinc-500"
          >
            #{{ tag }}
          </span>
        </div>

        <div class="mt-5 flex items-center gap-4 text-sm font-bold text-zinc-500">
          <button @click="toggleFavorite(selectedPost)" :class="selectedPost.isFavorite ? 'text-rose-500' : ''">❤️ {{ selectedPost.like }}</button>
          <span>💬 {{ selectedPost.comment }}</span>
          <span>👁 {{ selectedPost.view }}</span>
        </div>

        <div class="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 whitespace-pre-wrap leading-7 text-sm text-zinc-700 dark:text-zinc-200">
          {{ detailLoading ? '불러오는 중...' : selectedPost.body }}
        </div>

        <div class="mt-8">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-extrabold">댓글 {{ selectedPost.comment }}</h3>
            <div v-if="selectedPost.isOwner" class="flex items-center gap-2">
              <button @click="goEdit(selectedPost.id)" class="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold">수정</button>
              <button @click="removePost(selectedPost.id)" class="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold">삭제</button>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <input v-model="commentInput" class="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950" placeholder="댓글을 입력하세요" />
            <button @click="submitComment" class="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-900 font-black">등록</button>
          </div>

          <div class="mt-4 space-y-3">
            <div v-for="comment in selectedPost.comments || []" :key="comment.idx" class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-bold">{{ comment.writer }}</p>
                  <p class="text-xs text-zinc-400 mt-1">{{ formatTimeAgo(comment.createdAt) }}</p>
                </div>
                <button v-if="comment.owner" @click="removeComment(comment.idx)" class="text-xs font-bold text-rose-500">삭제</button>
              </div>
              <p class="mt-3 text-sm whitespace-pre-wrap leading-6">{{ comment.contents }}</p>
            </div>
            <div v-if="(selectedPost.comments || []).length === 0" class="text-sm text-zinc-400 font-bold">첫 댓글을 남겨보세요.</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cardModalOpen && myCardInfo" class="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" @click="cardModalOpen = false"></div>
      <div class="perspective-container w-[450px] aspect-[1.58/1] relative z-10">
        <div class="card-object shadow-2xl cursor-pointer" :class="{ 'is-flipped': cardFlipped }" @click="cardFlipped = !cardFlipped">
          <div class="w-full h-full card-face card-front bg-white rounded-2xl overflow-hidden">
            <NamecardsFront class="w-full h-full" :cardInfo="myCardInfo" />
          </div>
          <div class="w-full h-full card-face card-back bg-white rounded-2xl overflow-hidden">
            <NamecardsBack class="w-full h-full" :cardInfo="myCardInfo" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #18181b;
}

.perspective-container { perspective: 1200px; }
.card-object {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.7s ease-in-out;
  transform-style: preserve-3d;
}
.card-object.is-flipped { transform: rotateY(180deg); }
.card-face { position: absolute; inset: 0; backface-visibility: hidden; }
.card-back { transform: rotateY(180deg); }
</style>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/community/index'

const router = useRouter()
const posts = ref([])
const isLoading = ref(false)

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
  tags: Array.isArray(item.tags) ? item.tags : [],
  like: Number(item.likes ?? 0),
  comment: Number(item.replys ?? 0),
  time: formatTimeAgo(item.createdAt),
})

const fetchAllPosts = async () => {
  isLoading.value = true

  try {
    const res = await api.getPosts(0, 100)
    const communityList = res?.data?.communityList || []

    posts.value = communityList.map(mapPost)
  } catch (error) {
    console.error('전체 게시글 로딩 중 오류 발생:', error)
    posts.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAllPosts()
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

  if (state.sort === 'HOT') list.sort((a, b) => b.like * 2 + b.comment - (a.like * 2 + a.comment))
  if (state.sort === 'COMMENT') list.sort((a, b) => b.comment - a.comment)
  if (state.sort === 'NEW') list.sort((a, b) => b.id - a.id)

  return list
})

const pagedPosts = computed(() => {
  return filteredPosts.value.slice(0, state.page * state.pageSize)
})

const resetFilters = () => {
  state.cat = 'ALL'
  state.search = ''
  state.sort = 'HOT'
  state.tags = ''
  state.onlySolved = false
  state.page = 1
}

const loadMore = () => state.page++

const goEdit = (postId) => {
  router.push({ path: '/community-write', query: { postId } })
}

const removePost = async (postId) => {
  const confirmed = window.confirm('이 게시글을 삭제할까요?')
  if (!confirmed) return

  try {
    await api.deletePost(postId)
    await fetchAllPosts()
  } catch (error) {
    alert(error.message || '게시글 삭제에 실패했습니다.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-pattern text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
    <main class="max-w-7xl mx-auto px-5 pt-10 pb-14">
      <div class="flex items-end justify-between gap-4 mb-8">
        <h1 class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          커뮤니티
        </h1>
        <div class="flex items-center gap-2">
          <RouterLink to="/community-write"
            class="px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold transition-all">
            글쓰기
          </RouterLink>
          <button
            class="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-900 font-extrabold shadow-sm transition-all">
            내 글/댓글
          </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <aside class="col-span-12 lg:col-span-3 space-y-5">
          <div
            class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <span class="font-extrabold">탐색</span>
              <button @click="resetFilters"
                class="text-sm font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                초기화
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <span class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">카테고리</span>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <button v-for="cat in ['ALL', 'QNA', 'SHOWCASE', 'CAREER', 'STUDY', 'FREE']" :key="cat" @click="
                    state.cat = cat;
                  state.page = 1
                    " :class="[
                      'px-3 py-2 rounded-xl text-sm font-bold border transition-all',
                      state.cat === cat
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
                    ]">
                    {{ cat === 'ALL' ? '전체' : cat }}
                  </button>
                </div>
              </div>

              <div class="space-y-4 pt-2">
                <div>
                  <label class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">정렬</label>
                  <select v-model="state.sort"
                    class="w-full mt-2 px-4 py-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold focus:ring-2 focus:ring-amber-300 outline-none">
                    <option value="HOT">인기순</option>
                    <option value="NEW">최신순</option>
                    <option value="COMMENT">댓글 많은 순</option>
                  </select>
                </div>

                <div>
                  <label class="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">기술 태그</label>
                  <input v-model="state.tags" placeholder="Spring, React..."
                    class="w-full mt-2 px-4 py-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold focus:ring-2 focus:ring-amber-300 outline-none" />
                </div>

                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" v-model="state.onlySolved" class="w-5 h-5 accent-amber-400 rounded-lg" />
                  <span class="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900">해결된
                    Q&A만</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <section class="col-span-12 lg:col-span-6 space-y-5">
          <div
            class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm space-y-4">
            <div class="flex flex-col md:flex-row gap-3">
              <div class="flex-1 relative">
                <input v-model="state.search" placeholder="제목, 작성자 검색..."
                  class="w-full pl-5 pr-12 py-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-bold focus:ring-2 focus:ring-amber-300 outline-none" />
                <span
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-500">⌘K</span>
              </div>
              <div class="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                <button v-for="t in ['FEED', 'FOLLOW']" :key="t" @click="state.tab = t" :class="[
                  'px-4 py-2 rounded-xl text-sm font-black transition-all',
                  state.tab === t
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                    : 'text-zinc-400',
                ]">
                  {{ t }}
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-500 font-medium"><b class="text-zinc-900 dark:text-zinc-100">{{
                filteredPosts.length }}</b>개의 포스트</span>
              <button @click="fetchAllPosts"
                class="text-zinc-500 hover:text-zinc-900 font-bold flex items-center gap-1">
                <span>{{ isLoading ? '불러오는 중...' : '새로고침' }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <article v-for="post in pagedPosts" :key="post.id"
              class="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] hover:border-amber-200 dark:hover:border-amber-900/50 transition-all group">
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-3">
                    <span
                      class="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black text-zinc-500">{{
                        post.cat }}</span>
                    <span v-if="post.cat === 'QNA'" :class="[
                      'px-2 py-0.5 rounded-lg text-[10px] font-black',
                      post.solved
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600',
                    ]">
                      {{ post.solved ? '해결됨' : '미해결' }}
                    </span>
                    <span class="text-xs text-zinc-400 font-medium">{{ post.time }}</span>
                  </div>
                  <h3 class="text-lg font-bold mb-3 group-hover:text-amber-600 transition-colors truncate">
                    {{ post.title }}
                  </h3>
                  <div class="flex flex-wrap gap-1.5 mb-4">
                    <span v-for="tag in post.tags" :key="tag"
                      class="px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-xs font-bold text-zinc-500">
                      #{{ tag }}
                    </span>
                  </div>
                  <div class="text-sm">
                    <span class="text-zinc-400">작성자</span>
                    <span class="font-bold text-zinc-700 dark:text-zinc-300 ml-1">{{
                      post.author
                    }}</span>
                  </div>
                </div>

                <div class="flex flex-col items-end gap-3">
                  <div class="flex items-center gap-2">
                    <button @click="goEdit(post.id)"
                      class="px-3 py-2 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-xs font-bold">
                      수정
                    </button>
                    <button @click="removePost(post.id)"
                      class="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors text-xs font-bold">
                      삭제
                    </button>
                  </div>
                  <div class="flex items-center gap-3 text-xs font-bold">
                    <span class="flex items-center gap-1">❤️ {{ post.like }}</span>
                    <span class="flex items-center gap-1">💬 {{ post.comment }}</span>
                  </div>
                </div>
              </div>
            </article>

            <div v-if="!isLoading && pagedPosts.length === 0"
              class="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] text-center text-zinc-500 font-medium">
              조건에 맞는 게시글이 없습니다.
            </div>
          </div>

          <button v-if="filteredPosts.length > pagedPosts.length" @click="loadMore"
            class="w-full py-4 rounded-[20px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
            더 많은 게시글 불러오기
          </button>
        </section>

        <aside class="col-span-12 lg:col-span-3 space-y-5">
          <div
            class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
            <h4 class="font-extrabold mb-4">내 프로필 요약</h4>
            <div class="space-y-4">
              <div>
                <p class="text-[11px] text-zinc-400 font-bold uppercase">관심 분야</p>
                <p class="font-bold">Backend / Fullstack</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="tag in ['Spring', 'JPA', 'MySQL']" :key="tag"
                  class="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                  {{ tag }}
                </span>
              </div>
              <button
                class="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm">
                내 명함 불러오기
              </button>
            </div>
          </div>

          <div
            class="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-extrabold">오늘의 인기글</h4>
              <span class="text-[10px] font-bold text-amber-500">HOT</span>
            </div>
            <div class="space-y-3">
              <a v-for="i in 3" :key="i" href="#"
                class="block p-3 rounded-xl border border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                <p class="text-sm font-bold truncate">실시간 인기 게시글 제목입니다 {{ i }}</p>
                <p class="text-[11px] text-zinc-400 mt-1">
                  추천 {{ 100 - i * 10 }} · 댓글 {{ 20 - i }}
                </p>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #18181b;
}

input::placeholder {
  @supports not (-webkit-hyphens: none) {
    color: rgba(161, 161, 170, 0.6);
  }
}
</style>
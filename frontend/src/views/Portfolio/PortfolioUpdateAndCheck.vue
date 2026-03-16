<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import portfolioApi from '@/api/portfolio/index'
import SectionEditor from '@/components/SectionEditor.vue'

const router = useRouter()
const route = useRoute()

const extractedKeywords = ref(['Java', 'Spring', 'AWS'])
const projects = ref([])
const isAiLoading = ref(false)

const ui = reactive({
  open: false,
  projectIndex: 0,
})

const toast = reactive({
  open: false,
  message: '',
  timer: null,
})

const circledNums = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
]

const getCircled = (n) => circledNums[n - 1] || String(n)

const showToast = (message) => {
  toast.message = message
  toast.open = true

  if (toast.timer) clearTimeout(toast.timer)

  toast.timer = setTimeout(() => {
    toast.open = false
  }, 2000)
}

function extractKeywords() {
  const loadingBtn = document.getElementById('extract-btn')
  const tagSection = document.getElementById('keyword-result-section')
  const nextStepBtn = document.getElementById('next-step-btn')
  const editBtn = document.getElementById('top-edit-btn')

  if (!loadingBtn || !tagSection || !nextStepBtn) return

  loadingBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> 키워드 분석 중...'
  loadingBtn.disabled = true

  setTimeout(async () => {
    try {
      const portfolioIdx = route.query.idx || 1

      await portfolioApi.updateKeywords(portfolioIdx, extractedKeywords.value)

      tagSection.classList.remove('hidden')
      tagSection.classList.add('animate-fade-in')
      loadingBtn.classList.add('hidden')
      nextStepBtn.classList.remove('hidden')

      if (editBtn) editBtn.style.display = 'none'

      tagSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('키워드가 성공적으로 저장되었습니다.')
    } catch (error) {
      console.error('키워드 저장 실패:', error)
      alert('키워드 저장에 실패했습니다.')
      loadingBtn.innerHTML =
        '내용 확정 및 키워드 추출 <i class="fa-solid fa-wand-sparkles text-point-yellow"></i>'
      loadingBtn.disabled = false
    }
  }, 1200)
}

const makeReview = async (original) => {
  const o = (original || '').trim()

  if (!o) return ''

  isAiLoading.value = true

  try {
    const data = await portfolioApi.getAiReview(o)
    console.log('AI review response:', data)

    if (data?.isSuccess && typeof data.data === 'string') {
      return data.data
    }

    return o
  } catch (error) {
    console.error('AI 첨삭 호출 실패:', error)
    return o
  } finally {
    isAiLoading.value = false
  }
}

const loadAiReviewForProject = async (idx) => {
  const p = projects.value[idx]
  if (!p) return

  const generatedReview = await makeReview(p.original)
  p.review = generatedReview
  p.reviewDraft = generatedReview
}

const openEval = async () => {
  ui.open = true
  ui.projectIndex = 0
  await loadAiReviewForProject(0)
}

const closeEval = () => {
  ui.open = false
}

const selectProject = async (idx) => {
  ui.projectIndex = idx
  await loadAiReviewForProject(idx)
}

const applyReview = () => {
  const p = projects.value[ui.projectIndex]
  if (!p) return

  const edited = (p.reviewDraft || '').trim()
  if (!edited) return

  p.original = edited
  p.review = ''
  p.reviewDraft = ''

  showToast('적용했습니다!')
}

const activeProject = () => projects.value[ui.projectIndex]
const goBack = () => router.back()

onMounted(async () => {
  const portfolioIdx = route.query.idx || 1

  try {
    const response = await portfolioApi.getPortfolioSections(portfolioIdx)
    console.log('portfolio sections response:', response)

    if (response?.isSuccess && response?.data) {
      projects.value = response.data.map((section) => ({
        idx: section.idx,
        title: section.sectionTitle,
        original: section.contents,
        review: '',
        reviewDraft: '',
      }))
    }
  } catch (error) {
    console.error('섹션 데이터를 불러오는 중 에러 발생:', error)
    alert('데이터를 불러오지 못했습니다.')
  }
})

watch(
  () => ui.open,
  (v) => {
    document.documentElement.classList.toggle('eval-open', !!v)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.documentElement.classList.remove('eval-open')

  if (toast.timer) {
    clearTimeout(toast.timer)
  }
})
</script>

<template>
  <div class="bg-pattern text-gray-800 dark:text-gray-200 flex flex-col min-h-screen">
    <main class="flex-1 pt-10 pb-20 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="mb-12 max-w-3xl mx-auto">
          <div
            class="flex justify-between text-sm font-bold text-gray-400 dark:text-gray-500 mb-2 px-1 font-poppins"
          >
            <span>01. 프로젝트 작성</span>
            <span class="text-yellow-300">02. 프로젝트 수정 & 확인</span>
            <span>03. 스타일</span>
          </div>
          <div class="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div class="w-2/3 h-full bg-yellow-300 rounded-full transition-all duration-700"></div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-zinc-800 p-8 md:p-14 relative"
        >
          <div
            class="flex flex-col md:flex-row md:items-start justify-between mb-16 pb-10 border-b border-gray-50 dark:border-zinc-800 gap-6"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 rounded-full text-[11px] font-bold mb-4"
              >
                <i class="fa-solid fa-wand-magic-sparkles"></i> AI Content Review
              </div>
              <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
                내용 확정 및 키워드 추출
              </h2>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                내용이 확정되면 키워드를 추출해 주세요.<br />
                <span class="text-point-yellow font-bold">
                  키워드 추출 후에는 내용 수정이 불가능합니다.
                </span>
              </p>
            </div>

            <button
              id="top-edit-btn"
              type="button"
              class="px-8 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 text-sm"
              @click="openEval"
            >
              <i class="fa-solid fa-wand-sparkles text-point-yellow"></i> AI 첨삭
            </button>
          </div>

          <div class="space-y-16 mb-20">
            <div v-for="(project, index) in projects" :key="index">
              <h3
                class="text-[10px] font-black text-gray-300 dark:text-zinc-600 mb-4 uppercase tracking-[0.2em]"
              >
                {{ project.title }}
              </h3>
              <div
                class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
                v-html="project.original"
              ></div>
            </div>
          </div>

          <div
            id="keyword-result-section"
            class="hidden mt-10 p-10 bg-gray-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 border-dashed relative"
          >
            <h4
              class="text-sm font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"
            >
              <i class="fa-solid fa-check-circle text-green-500"></i>
              내용 확정 및 키워드 추출이 완료되었습니다.
            </h4>

            <div class="flex flex-wrap gap-3">
              <span
                v-for="(keyword, idx) in extractedKeywords"
                :key="idx"
                class="px-5 py-2.5 bg-white dark:bg-zinc-800 border-2 border-point-yellow/20 text-gray-700 dark:text-gray-300 text-sm rounded-2xl font-bold shadow-sm"
              >
                #{{ keyword }}
              </span>
            </div>
          </div>

          <div
            class="mt-16 flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-gray-50 dark:border-zinc-800"
          >
            <button
              type="button"
              class="px-8 py-3 bg-yellow-50 dark:bg-zinc-800/50 border border-yellow-200 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded-2xl font-black tracking-tight hover:bg-yellow-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center"
              @click="goBack"
            >
              <i class="fa-solid fa-arrow-left mr-2"></i> 이전 단계
            </button>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                class="flex-1 md:flex-none px-8 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
              >
                임시 저장
              </button>

              <button
                id="extract-btn"
                type="button"
                class="flex-1 md:flex-none px-10 py-3 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold shadow-xl hover:bg-black dark:hover:bg-white transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                @click="extractKeywords()"
              >
                내용 확정 및 키워드 추출
                <i class="fa-solid fa-wand-sparkles text-point-yellow"></i>
              </button>

              <RouterLink
                id="next-step-btn"
                :to="{ path: '/portfolio-style', query: { idx: route.query.idx || 1 } }"
                class="hidden flex-1 md:flex-none px-12 py-3 bg-yellow-50 dark:bg-zinc-800/50 border border-yellow-200 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded-2xl font-black tracking-tight hover:bg-yellow-100 dark:hover:bg-zinc-800 transition-colors animate-fade-in inline-flex items-center justify-center"
              >
                스타일 설정하기 <i class="fa-solid fa-arrow-right ml-2 text-lg"></i>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div class="eval-overlay" :class="ui.open ? 'eval-open' : ''" aria-hidden="true">
      <div class="eval-dim" @click="closeEval"></div>

      <section class="eval-modal" role="dialog" aria-modal="true" aria-label="AI 첨삭 보기">
        <header class="eval-head">
          <div class="eval-title">
            <span class="eval-badge">AI</span>
            <h2>
              AI 첨삭
              <span class="eval-sub">({{ ui.projectIndex + 1 }} / {{ projects.length }})</span>
            </h2>
          </div>
          <button class="eval-x" type="button" aria-label="닫기" @click="closeEval">✕</button>
        </header>

        <div class="eval-body">
          <aside class="eval-side">
            <p class="eval-side-title">섹션 목록</p>
            <div class="eval-side-list">
              <button
                v-for="(p, idx) in projects"
                :key="p.title + idx"
                type="button"
                class="eval-item"
                :class="idx === ui.projectIndex ? 'active' : ''"
                @click="selectProject(idx)"
              >
                <span class="eval-num">{{ getCircled(idx + 1) }}</span>
                <span class="eval-item-text">{{ p.title }}</span>
              </button>
            </div>
          </aside>

          <main class="eval-main">
            <section class="eval-card">
              <div class="eval-card-head">
                <h3>현재 내용</h3>
                <span class="eval-chip">Original</span>
              </div>
              <div class="eval-text" v-html="activeProject()?.original"></div>
            </section>

            <section class="eval-card">
              <div class="eval-card-head">
                <h3>AI 첨삭본</h3>
                <span class="eval-chip">1 review</span>
              </div>

              <div v-if="isAiLoading" class="py-10 text-center text-gray-500 font-bold">
                <i class="fa-solid fa-spinner animate-spin text-point-yellow text-2xl mb-2"></i>
                <p>AI가 포트폴리오를 첨삭하고 있습니다...</p>
              </div>

              <div v-else class="eval-variant">
                <SectionEditor
                  v-if="projects[ui.projectIndex]"
                  :key="ui.projectIndex"
                  v-model="projects[ui.projectIndex].reviewDraft"
                  class="w-full bg-white dark:bg-zinc-800 rounded-xl min-h-[170px]"
                ></SectionEditor>

                <div class="eval-actions mt-4">
                  <button type="button" class="eval-btn ghost" @click="closeEval">닫기</button>
                  <button type="button" class="eval-btn" @click="applyReview">적용</button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>

    <div class="eval-toast" :class="toast.open ? 'show' : ''" role="status" aria-live="polite">
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
:deep(body) {
  font-family: 'Noto Sans KR', sans-serif;
  transition: background-color 0.3s ease;
}

.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #18181b;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
</style>

<style>
html.eval-open,
html.eval-open body {
  overflow: hidden;
}

.eval-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.eval-overlay.eval-open {
  pointer-events: auto;
  opacity: 1;
}

.eval-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.eval-modal {
  position: relative;
  width: min(1080px, calc(100vw - 32px));
  height: min(720px, calc(100vh - 32px));
  margin: 16px auto;
  background: var(--card, #fff);
  color: var(--text, #111827);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.eval-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  background: linear-gradient(180deg, rgba(250, 204, 21, 0.12), transparent);
}

.eval-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.eval-badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(250, 204, 21, 0.22);
  border: 1px solid rgba(250, 204, 21, 0.35);
  font-weight: 900;
}

.eval-title h2 {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
}

.eval-sub {
  font-size: 12px;
  font-weight: 800;
  color: rgba(107, 114, 128, 1);
  margin-left: 6px;
}

.eval-x {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border, #e5e7eb);
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.eval-x:hover {
  background: rgba(0, 0, 0, 0.04);
}

.eval-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100% - 66px);
}

.eval-side {
  border-right: 1px solid var(--border, #e5e7eb);
  padding: 16px;
  background: rgba(24, 24, 27, 0.02);
}

html.dark .eval-side {
  background: rgba(255, 255, 255, 0.03);
}

.eval-side-title {
  font-size: 12px;
  font-weight: 900;
  color: rgba(107, 114, 128, 1);
  margin-bottom: 10px;
}

.eval-side-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eval-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--card, #fff);
  cursor: pointer;
  text-align: left;
}

.eval-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.eval-item.active {
  border-color: rgba(250, 204, 21, 0.55);
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.18);
}

.eval-num {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(250, 204, 21, 0.18);
  font-weight: 900;
}

.eval-item-text {
  font-weight: 900;
}

.eval-main {
  padding: 16px;
  overflow: auto;
}

.eval-card {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 18px;
  background: var(--card, #fff);
  padding: 14px;
  margin-bottom: 14px;
}

.eval-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.eval-card-head h3 {
  font-size: 14px;
  font-weight: 900;
}

.eval-chip {
  font-size: 11px;
  font-weight: 900;
  color: rgba(107, 114, 128, 1);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 999px;
  padding: 6px 10px;
}

.eval-text {
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-line;
}

.eval-variant {
  border: 1px dashed rgba(250, 204, 21, 0.55);
  border-radius: 16px;
  padding: 12px;
  background: rgba(250, 204, 21, 0.08);
}

.eval-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.eval-btn {
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(250, 204, 21, 0.55);
  background: rgba(250, 204, 21, 1);
  color: #111827;
  font-weight: 900;
  cursor: pointer;
}

.eval-btn.ghost {
  background: transparent;
  color: inherit;
  border-color: var(--border, #e5e7eb);
}

.eval-btn.ghost:hover {
  background: rgba(0, 0, 0, 0.03);
}

.eval-btn:hover {
  filter: brightness(0.98);
}

.eval-toast {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%) translateY(12px);
  background: rgba(17, 24, 39, 0.92);
  color: white;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 900;
  font-size: 13px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 10000;
}

.eval-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 920px) {
  .eval-body {
    grid-template-columns: 1fr;
  }

  .eval-side {
    border-right: none;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }
}
</style>
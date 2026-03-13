<script setup>
import { ref, onMounted } from 'vue'
import NamecardsFront from '@/components/namecards/NamecardsFront.vue'
import NamecardsBack from '@/components/namecards/NamecardsBack.vue'
import { getPortfolioList } from '@/api/portfolio/index.js'
import { useNamecardStore } from '@/stores/namecardStore'

let currentUserId = 1
// 1. 쿠키 이름으로 값을 가져오는 함수
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const token = getCookie('ATOKEN'); // 쿠키 이름을 입력하세요
console.log(token)

if (token) {
  // 2. JWT는 [header].[payload].[signature] 구조입니다.
  // 페이로드 부분(index 1)만 추출합니다.
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  
  // 3. 디코딩 후 JSON 파싱
  const payload = JSON.parse(window.atob(base64));
  
  // console.log(payload.idx); // 1001 출력
  currentUserId=payload.idx;
}

const store = useNamecardStore()
const cardData = ref(null)
const isLoading = ref(true)


const loadMyCard = async () => {
  isLoading.value=true
  const response = await store.getNamecard(currentUserId)
  if (response){
    cardData.value = response
  }

  isLoading.vaue = false
}

const isFlipped = ref(false)
const portfolios = ref([])


const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

onMounted(async () => {
  loadMyCard()

  try {
    const res = await getPortfolioList(0, 10)
    
    const fetchedData = res.data?.result || res.result || res.data?.data?.result || []
    
    if (Array.isArray(fetchedData)) {
      portfolios.value = fetchedData
    }
  } catch (error) {
    console.error('포트폴리오 목록을 불러오는 중 오류 발생:', error)
  }
})
</script>

<template>
  <div class="bg-pattern text-gray-800 dark:text-gray-100 transition-colors duration-300 min-h-screen flex flex-col">
    <div id="header-placeholder"></div>

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 pt-28 pb-20">
      <section class="flex justify-center items-center min-h-[400px]">

        <div class="scene w-full max-w-md aspect-[1.58/1] cursor-pointer group">

          <div class="card-object w-full h-full relative shadow-2xl rounded-2xl transition-all duration-500"
            :class="{ 'is-flipped': isFlipped }" @click="toggleFlip">

            <div class="card-face card-front">
              <NamecardsFront :cardInfo="cardData" />

              <div class="absolute bottom-4 right-4 z-20 text-xs text-gray-400 animate-pulse pointer-events-none">
                Click to flip <i class="fa-solid fa-rotate ml-1"></i>
              </div>
            </div>

            <div class="card-face card-back">
              <NamecardsBack :cardInfo="cardData" />
            </div>

          </div>
        </div>

      </section>

      <section>
        <div class="flex items-center gap-3 mb-8">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Featured Portfolios</h3>
          <div class="h-px flex-1 bg-gray-200 dark:bg-zinc-800"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article v-for="portfolio in portfolios" :key="portfolio.idx"
            class="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-yellow-100/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            
            <div class="w-full h-48 bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
              <img v-if="portfolio.image" :src="portfolio.image" alt="Hero Image" class="w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-zinc-700">
                <i class="fa-regular fa-image text-4xl"></i>
              </div>
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <router-link :to="{ path: '/project-detail', query: { idx: portfolio.idx } }"
                  class="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-full text-sm font-bold border border-white/30 hover:bg-white/40 transition-all text-yellow-300 hover:text-yellow-400 border-yellow-300/30 hover:border-yellow-400">
                  View Details
                </router-link>
              </div>
            </div>

            <div class="p-6">
              <div class="flex justify-between items-start mb-2">
                <span
                  class="text-[10px] font-bold text-point-yellow bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded uppercase tracking-wide">
                  PORTFOLIO
                </span>
                <span class="text-xs text-gray-400">N/A</span>
              </div>
              
              <h4
                class="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-point-yellow transition-colors">
                {{ portfolio.title || '제목 없음' }}
              </h4>
              
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                상세 내용을 확인하려면 View Details를 클릭하세요.
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.flipped {
  transform: rotateY(180deg);
}

#card-inner {
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.bg-pattern {
  background-color: #f8fafc;
}

.dark .bg-pattern {
  background-color: #09090b;
}

.scene {
  perspective: 1000px;
}

.card-object {
  transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.card-object.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  overflow: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.card-front {
  transform: rotateY(0deg);
}
</style>
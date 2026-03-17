<script setup>
import { computed } from 'vue'

const props = defineProps({
  cardInfo: {
    type: Object,
    required: true,
  }
})

// 색상 키값에 따른 Tailwind 클래스 매핑
const colorClasses = computed(() => {
  const color = props.cardInfo?.color || 'YELLOW'
  
  const mapping = {
    YELLOW: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-400',
      hover: 'hover:text-yellow-400'
    },
    BLUE: {
      text: 'text-blue-500',
      bg: 'bg-blue-500',
      hover: 'hover:text-blue-500'
    },
    GREEN: {
      text: 'text-green-500',
      bg: 'bg-green-500',
      hover: 'hover:text-green-500'
    },
    PURPLE: {
      text: 'text-purple-500',
      bg: 'bg-purple-500',
      hover: 'hover:text-purple-500'
    }
  }
  
  return mapping[color] || mapping.YELLOW
})
</script>

<template>
  <div v-if="cardInfo" class="relative w-full max-w-md aspect-[1.58/1] mx-auto">
    <div
      class="card-face card-back absolute inset-0 w-full h-full bg-zinc-900 text-white rounded-2xl border border-zinc-700 p-6 sm:p-8 flex flex-col overflow-hidden shadow-lg"
    >
      <!-- 배경 장식 요소 -->
      <div class="absolute bottom-0 left-0 w-24 h-24 bg-zinc-800 rounded-tr-full opacity-50 pointer-events-none"></div>

      <div class="relative z-10 h-full flex flex-col">
        <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
          <!-- 동적 바 컬러 -->
          <span 
            class="w-1.5 h-6 rounded-full transition-colors duration-500"
            :class="colorClasses.bg"
          ></span>
          Contact Info
        </h3>

        <div class="space-y-4 flex-1 text-sm text-gray-300">
          <!-- 전화번호 -->
          <div v-if="cardInfo.phone" class="flex items-center gap-3">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-phone text-lg"></i>
            </div>
            <span>{{ cardInfo.phone }}</span>
          </div>

          <!-- 주소 -->
          <div v-if="cardInfo.address" class="flex items-center gap-3">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-location-dot text-lg"></i>
            </div>
            <span>{{ cardInfo.address }}</span>
          </div>

          <!-- 이메일 (호버 컬러 적용) -->
          <a v-if="cardInfo.email" :href="`mailto:${cardInfo.email}`"
            class="flex items-center gap-3 transition-colors duration-300"
            :class="colorClasses.hover">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-envelope text-lg"></i>
            </div>
            <span>{{ cardInfo.email }}</span>
          </a>

          <!-- 링크 (호버 컬러 적용) -->
          <a v-if="cardInfo.url" :href="`https://${cardInfo.url}`" target="_blank"
            class="flex items-center gap-3 transition-colors duration-300"
            :class="colorClasses.hover">
            <div class="w-8 flex justify-center">
              <i class="fa-solid fa-link text-lg"></i>
            </div>
            <span class="truncate">{{ cardInfo.url }}</span>
          </a>
        </div>

        <!-- 하단 브랜드명 -->
        <div class="text-right mt-auto pt-4 border-t border-zinc-800">
          <span class="text-[10px] font-bold tracking-widest opacity-40">POTICARD</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center text-red-500 mt-10">정보를 불러올 수 없습니다.</div>
</template>

<style scoped>
.card-back {
  backface-visibility: hidden;
}
</style>
<script setup>
const props = defineProps({
  cardInfo: {
    type: Object,
    required: true,
  }
})

</script>

<template>
  <div v-if="cardInfo" class="relative w-full max-w-md aspect-[1.58/1] mx-auto">
    <div
      class="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-8 backface-hidden overflow-hidden shadow-lg">
      <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-bl-full"></div>

      <div class="flex flex-col justify-between h-full relative z-10">
        <div class="flex justify-between items-start">
          <div class="pr-4">
            <p class="text-xs font-bold text-point-yellow uppercase tracking-widest mb-1">
              {{ cardInfo.role }}
            </p>
            <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 truncate">
              {{ cardInfo.name }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-2">
              {{ cardInfo.description }}
            </p>
          </div>

          <div
            class="shrink-0 w-20 h-20 rounded-full border-4 border-white dark:border-zinc-800 shadow-md overflow-hidden bg-gray-100">
            <img :src="cardInfo.avatar" alt="Profile" class="w-full h-full object-cover" />
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex gap-2 flex-wrap">
            <span v-for="(tag, index) in cardInfo.keywords" :key="index"
              class="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-md">
              #{{ tag }}
            </span>
          </div>

          <div class="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <div class="flex gap-3 text-gray-400 dark:text-gray-500">
              <a v-if="cardInfo.website" :href="'https://' + cardInfo.website" target="_blank"
                class="hover:text-point-yellow transition-colors">
                <i class="fa-brands fa-github text-xl"></i>
              </a>

              <a href="#" class="hover:text-point-yellow transition-colors">
                <i class="fa-brands fa-linkedin text-xl"></i>
              </a>
              <a href="#" class="hover:text-point-yellow transition-colors">
                <i class="fa-brands fa-instagram text-xl"></i>
              </a>

              <a v-if="cardInfo.email" :href="'mailto:' + cardInfo.email"
                class="hover:text-point-yellow transition-colors">
                <i class="fa-solid fa-envelope text-xl"></i>
              </a>
            </div>

            <i
              class="fa-solid fa-qrcode text-3xl text-gray-800 dark:text-white opacity-80 cursor-pointer hover:opacity-100 transition-opacity"></i>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center text-red-500 mt-10">사용자 정보를 찾을 수 없습니다.</div>
</template>

<style scoped>
.text-point-yellow {
  color: #facc15;
}
</style>

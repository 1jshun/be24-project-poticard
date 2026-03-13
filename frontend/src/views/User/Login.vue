<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/user'
import useAuthStore from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const serverError = ref('')
const submitted = ref(false)

// 로그인 input이 브라우저 자동완성으로 채워지는 걸 최대한 막기 위해 key로 리렌더
const formKey = ref(Date.now())
const loginForm = reactive({
  identifier: '',
  password: '',
})

// cookie 가져오는 함수
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// cookie 가져와서 userIdx 반환하는 함수
const getIdxFromJwtCookie = (cookieName) => {
  const token = getCookie(cookieName);
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 브라우저의 atob를 이용해 디코딩 후 JSON 파싱
    const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));

    return payload.idx; // JWT payload 안에 들어있는 idx 반환
  } catch (e) {
    console.error("JWT 파싱 실패:", e);
    return null;
  }
};

onMounted(() => {
  loginForm.identifier = ''
  loginForm.password = ''
  submitted.value = false
  serverError.value = ''
  formKey.value = Date.now()
})

const identifierError = computed(() => {
  if (!submitted.value) return ''
  if (!loginForm.identifier.trim()) return '필수 정보입니다.'
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!loginForm.password) return '필수 정보입니다.'
  return ''
})

const canSubmit = computed(() => {
  return (
    loginForm.identifier.trim() &&
    loginForm.password &&
    !identifierError.value &&
    !passwordError.value
  )
})

const login = async () => {
  submitted.value = true
  serverError.value = ''

  if (!canSubmit.value) {
    serverError.value = '입력값을 확인해 주세요.'
    return
  }

  const id = loginForm.identifier.trim()

  try {
    const res = await api.login({
      name: id,
      email: id,
      password: loginForm.password,
    })

    const userInfo = typeof res === 'object' && res ? res : { userName: id }
    authStore.login(userInfo)

    // redirect 쿼리가 있으면 우선 사용, 없으면 타입에 따라 분기
    let redirect = route.query.redirect
    if (!redirect) {
      redirect = route.query.type === 'business' ? '/company' : '/'
    }
    router.push(redirect)

    // login 성공 시 service-worker에 기기 + 유저 정보 등록
    try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BLHgfPga02L2u89uc4xjhbUFTy_U04rQCjGq7o24oxtqfVmAPHTxOmp6xndSHZtGQpmt7gqTFdMXco2gRNP7_p8'
    });
    
    const userIdx = getIdxFromJwtCookie('ATOKEN'); 

    if (!userIdx) {
      console.warn('Invalid user');
    }

    await api.subscribePush(subscription, userIdx);
    
    console.log('Web Push subscribed!');
    } catch (pushError) {
      // 푸시 구독 실패는 로그인은 성공한 상태이므로 경고만 띄움
      console.warn('Web Push subscription failed:', pushError);
    }

  } catch (e) {
    serverError.value = e?.userMessage || '로그인 실패'
  }
}
</script>

<template>
  <div class="flex-1 flex items-center min-h-screen justify-center pt-12 pb-12 px-4">
    <div
      class="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden relative">
      <div class="h-2 bg-point-yellow w-full"></div>

      <div class="p-8 md:p-10">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-black font-poppins dark:text-[#facc15] text-gray-900 mb-2">
            Login
          </h2>
          <p v-if="route.query.type === 'personal'" class="mt-5 text-gray-500 dark:text-gray-400 text-sm">
            단 하나의 명함으로 수많은 기업의 제안을 받아보세요.
          </p>
          <p v-else-if="route.query.type === 'business'" class="mt-5 text-gray-500 dark:text-gray-400 text-sm">
            인재를 만나는 가장 스마트한 방법.
          </p>
        </div>

        <div v-if="route.query.justSignedUp === '1'"
          class="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          회원가입이 완료되었습니다.
        </div>

        <div v-if="route.query.redirect"
          class="mb-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 px-4 py-3 text-sm font-bold text-orange-700 dark:text-orange-400">
          로그인이 필요한 서비스입니다.
        </div>

        <div v-if="serverError"
          class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {{ serverError }}
        </div>

        <form class="space-y-6" :key="formKey" autocomplete="off" @submit.prevent="login">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              이메일
            </label>

            <input v-model.trim="loginForm.identifier" type="text" placeholder="example@email.com" autocomplete="off"
              name="poticard_identifier"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
            <p v-if="identifierError" class="text-xs font-bold text-red-500">
              {{ identifierError }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              비밀번호
            </label>

            <input v-model="loginForm.password" type="password" placeholder="••••••••" autocomplete="new-password"
              name="poticard_password"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15] focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400" />
            <p v-if="passwordError" class="text-xs font-bold text-red-500">{{ passwordError }}</p>
          </div>

          <button type="submit" :disabled="!canSubmit"
            class="w-full py-4 mt-4 rounded-2xl font-bold text-lg transition-all shadow-lg bg-[#facc15] text-black hover:scale-[1.01] active:scale-95 disabled:opacity-50">
            로그인  
          </button>
        </form>

        <p class="text-center mt-6 text-sm text-gray-400">
          로그인 정보를 잊어버리셨나요?
          <router-link :to="route.query.type === 'business' ? '/find-business-account' : '/find-personal-account'
            " class="text-point-yellow hover:underline">
            이메일/비밀번호 찾기
          </router-link>
        </p>

        <p class="text-center mt-2 text-sm text-gray-400">
          {{
            route.query.type === 'business' ? '기업 계정이 없으신가요?' : '개인 계정이 없으신가요?'
          }}
          <router-link :to="route.query.type === 'business' ? '/signup-business' : '/signup?type=personal'"
            class="text-point-yellow hover:underline">
            회원가입
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(body) {
  font-family: 'Noto Sans KR', sans-serif;
}

.font-poppins {
  font-family: 'Poppins', sans-serif;
}
</style>

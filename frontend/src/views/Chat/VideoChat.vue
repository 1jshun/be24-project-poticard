<!-- src/views/VideoChat.vue -->
<template>
  <div class="page">
    <video ref="remoteVideoRef" id="remoteVideo" autoplay playsinline></video>

    <div id="sharePreviewContainer" :style="{ display: sharePreviewVisible ? 'block' : 'none' }"
      :class="{ 'full-size': sharePreviewFullSize }" @click="toggleShareSize">
      <video ref="sharePreviewVideoRef" id="sharePreviewVideo" autoplay playsinline muted></video>
    </div>

    <div class="local-video-container" id="localContainer" :class="{ enlarged: localEnlarged }">
      <video ref="localVideoRef" class="local-video" id="localVideo" autoplay muted playsinline></video>
      <button type="button" class="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-md rounded-xl text-white"
        @click="toggleEnlarge">
        <i class="fa-solid fa-maximize"></i>
      </button>
    </div>

    <aside class="side-panel" id="sidePanel" :class="{ collapsed: sideCollapsed }">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-6 text-left">
          <div class="w-12 h-12 bg-zinc-800 rounded-2xl overflow-hidden">
            <img :src="partnerInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
              class="w-full h-full object-cover" :alt="partnerInfo?.name || 'avatar'" />
          </div>
          <div>
            <h2 class="font-black text-lg">{{ partnerInfo?.name || 'Kim Poti' }}</h2>
            <p class="text-[10px] text-yellow-400 font-bold uppercase">Live Session</p>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" @click="openModal('cardModal')"
            class="w-full py-3 bg-white/5 rounded-xl text-sm font-bold border border-white/10">
            명함 상세보기
          </button>
          <button type="button" @click="openModal('authModal')"
            class="w-full py-3 bg-yellow-400 text-black rounded-xl text-sm font-black">
            권한 관리
          </button>
        </div>
      </div>

      <button type="button" class="toggle-trigger" @click="toggleSidePanel">
        <i id="toggleIcon" :class="sideCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
      </button>
    </aside>

    <nav class="controls">
      <button id="micBtn" type="button" class="control-btn" :class="{ on: micOn }" @click="toggleStatus('mic')">
        <i :class="micOn ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash'"></i>
        <span class="status-label">{{ micOn ? 'ON' : 'OFF' }}</span>
      </button>

      <button id="camBtn" type="button" class="control-btn" :class="{ on: camOn }" @click="toggleStatus('cam')">
        <i :class="camOn ? 'fa-solid fa-video' : 'fa-solid fa-video-slash'"></i>
        <span class="status-label">{{ camOn ? 'ON' : 'OFF' }}</span>
      </button>

      <button id="shareBtn" type="button" class="control-btn" :class="{ on: screenStream !== null }"
        @click="handleShareClick">
        <i class="fa-solid fa-desktop"></i><span class="status-label">SHARE</span>
      </button>

      <button id="setBtn" type="button" class="control-btn" @click="openModal('settingsModal')">
        <i class="fa-solid fa-gear"></i><span class="status-label">SETTING</span>
      </button>

      <button id="callBtn" type="button" class="control-btn" @click="makeCall" :disabled="callDisabled">
        <i class="fa-solid fa-phone"></i><span class="status-label">CALL</span>
      </button>

      <div class="w-px h-10 bg-white/10 mx-1"></div>

      <button type="button" class="control-btn" style="background: #ef4444; color: white; border: none" @click="goExit">
        <i class="fa-solid fa-phone-slash"></i><span class="status-label">EXIT</span>
      </button>
    </nav>

    <!-- Settings Modal -->
    <div id="settingsModal" class="modal" :class="{ open: modals.settingsModal }"
      @click="onBackdropClick('settingsModal', $event)">
      <div class="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black flex items-center gap-2">
            <i class="fa-solid fa-gear text-yellow-400"></i> 환경설정
          </h3>
          <button type="button" @click="closeModal('settingsModal')" class="text-zinc-500 hover:text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="space-y-4 text-left">
          <div>
            <label class="text-[10px] font-bold text-zinc-500 mb-2 block uppercase">Camera Source</label>
            <select class="w-full bg-zinc-800 p-3 rounded-xl text-sm border-none">
              <option>Default</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-zinc-500 mb-2 block uppercase">Audio Source</label>
            <select class="w-full bg-zinc-800 p-3 rounded-xl text-sm border-none">
              <option>Default</option>
            </select>
          </div>
        </div>
        <button type="button" @click="closeModal('settingsModal')"
          class="w-full mt-8 py-4 bg-yellow-400 text-black rounded-2xl font-black">
          설정 저장
        </button>
      </div>
    </div>

    <!-- Share Modal -->
    <div id="shareModal" class="modal" :class="{ open: modals.shareModal }"
      @click="onBackdropClick('shareModal', $event)">
      <div class="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-md text-center relative">
        <button type="button" @click="closeModal('shareModal')"
          class="absolute top-6 right-6 text-zinc-500 hover:text-white">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        <div
          class="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-yellow-400 text-2xl">
          <i class="fa-solid fa-desktop"></i>
        </div>
        <h3 class="text-xl font-black mb-2">화면 공유 시작</h3>
        <p class="text-sm text-zinc-500 mb-8 leading-relaxed">
          공유할 브라우저 탭이나 프레젠테이션<br />파일을 선택해 주세요.
        </p>
        <button type="button" @click="startScreenShare"
          class="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black">
          공유 할 탭 선택하기
        </button>
      </div>
    </div>

    <!-- Card Modal -->
    <div id="cardModal" class="modal" :class="{ open: modals.cardModal }" @click="onBackdropClick('cardModal', $event)">
      <div class="relative w-full max-w-md aspect-[1.58/1] perspective-1000">
        <div id="card-inner" class="relative w-full h-full transform-style-3d shadow-2xl rounded-2xl cursor-pointer"
          :class="{ flipped: cardFlipped }" @click="flipCard">
          <div
            class="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-8 backface-hidden overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-bl-full"></div>
            <div class="flex flex-col justify-between h-full relative z-10 text-left text-gray-900 dark:text-white">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-bold text-yellow-500 uppercase mb-1">
                    {{ partnerInfo?.role || 'UX/UI Designer' }}
                  </p>
                  <h2 class="text-3xl font-black mb-2">{{ partnerInfo?.name || 'Kim Poti' }}</h2>
                  <p class="text-sm opacity-60 whitespace-pre-line">
                    {{ partnerInfo?.intro || '사용자 경험을 디자인하는\n디자이너 김포티입니다.' }}
                  </p>
                </div>
                <div class="w-20 h-20 rounded-full border-4 border-white dark:border-zinc-800 overflow-hidden">
                  <img :src="partnerInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
                    class="w-full h-full object-cover" :alt="partnerInfo?.name || 'avatar'" />
                </div>
              </div>
              <div class="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                <div class="flex gap-2 flex-wrap">
                  <span v-for="tag in partnerInfo?.tags || ['Figma']" :key="tag"
                    class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold rounded">#{{ tag }}</span>
                </div>
                <i class="fa-solid fa-qrcode text-3xl opacity-80"></i>
              </div>
            </div>
          </div>

          <div
            class="absolute inset-0 w-full h-full bg-zinc-900 dark:bg-white rounded-2xl border border-zinc-800 dark:border-gray-200 p-8 backface-hidden rotate-y-180 text-white dark:text-gray-900">
            <div class="flex flex-col h-full relative z-10 text-left">
              <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
                <span class="w-1.5 h-6 bg-yellow-400 rounded-full"></span> Contact Info
              </h3>
              <div class="space-y-4 flex-1 text-sm">
                <div class="flex items-center gap-3">
                  <i class="fa-solid fa-phone text-yellow-500"></i>
                  <span>010-****-{{ partnerInfo?.id || '0000' }}000</span>
                </div>
                <div class="flex items-center gap-3">
                  <i class="fa-solid fa-link text-yellow-500"></i>
                  <span>{{ partnerInfo?.company?.toLowerCase().replace(' ', '') || 'kimpoti' }}.com</span>
                </div>
                <div class="flex items-center gap-3">
                  <i class="fa-solid fa-location-dot text-yellow-500"></i>
                  <span>Seoul, South Korea</span>
                </div>
              </div>
              <div class="text-right opacity-40 text-[10px] font-bold uppercase">Poticard</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    <div id="authModal" class="modal" :class="{ open: modals.authModal }" @click="onBackdropClick('authModal', $event)">
      <div class="bg-zinc-900 border border-white/10 rounded-[40px] p-10 w-full max-w-5xl shadow-3xl">
        <div class="flex justify-between items-end mb-8 text-left">
          <div>
            <h3 class="text-3xl font-black mb-2">포트폴리오 권한 관리</h3>
            <p id="selectionCount" class="text-yellow-400 text-sm font-bold">
              {{ selectionCountText }}
            </p>
          </div>
        </div>

        <div class="portfolio-scroll thin-scroll" id="portfolioList" @wheel.prevent="onPortfolioWheel">
          <div v-for="p in portfolios" :key="p.id" class="portfolio-item text-left"
            :class="{ selected: selectedIds.has(p.id) }" @click="togglePortfolio(p.id)">
            <h4 class="font-black text-xl mb-3">{{ p.title }}</h4>
            <p class="text-[13px] text-zinc-400 leading-relaxed h-20 overflow-hidden">
              {{ p.desc }}
            </p>
            <div class="flex gap-2 mt-4">
              <span v-for="t in p.tags" :key="t" class="px-2 py-1 bg-black/40 text-[10px] font-bold rounded">#{{ t
              }}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-10">
          <button type="button" @click="closeModal('authModal')"
            class="flex-1 py-5 bg-zinc-800 rounded-2xl font-bold text-zinc-400">
            취소
          </button>
          <button type="button" @click="confirmAuth"
            class="flex-1 py-5 bg-yellow-400 text-black rounded-2xl font-black">
            권한 부여하기
          </button>
        </div>
      </div>
    </div>

    <!-- Debug log -->
    <div id="log">{{ logText }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import chatApi from '@/api/chat/index.js'

const senderId = Math.random().toString(36).substring(2, 9)

/* refs */
const remoteVideoRef = ref(null)
const localVideoRef = ref(null)
const sharePreviewVideoRef = ref(null)

/* router */
const router = useRouter()
const route = useRoute()

/* 상대방 정보 */
const partnerInfo = ref(null)

/* UI state */
const micOn = ref(true)
const camOn = ref(true)
const sideCollapsed = ref(false)
const localEnlarged = ref(false)
const cardFlipped = ref(false)

const sharePreviewVisible = ref(false)
const sharePreviewFullSize = ref(false)

const modals = ref({
  settingsModal: false,
  shareModal: false,
  cardModal: false,
  authModal: false,
})

const portfolios = ref([])

/* 포트폴리오 로드 */
async function loadPortfolios() {
  try {
    const res = await chatApi.loadPortfolios()

    if (res && res.data && Array.isArray(res.data)) {
      portfolios.value = res.data.map((item, index) => ({
        id: index + 1,
        title: item.portfolio_name || '',
        desc: item.portfolio_summary || '',
        tags: item.keywords ? item.keywords.map(tag => tag.replace('#', '')) : []
      }))
      console.log('포트폴리오 로드 완료:', portfolios.value)
    } else if (Array.isArray(res)) {
      portfolios.value = res.map((item, index) => ({
        id: index + 1,
        title: item.portfolio_name || '',
        desc: item.portfolio_summary || '',
        tags: item.keywords ? item.keywords.map(tag => tag.replace('#', '')) : []
      }))
      console.log('포트폴리오 로드 완료 (배열 형식):', portfolios.value)
    }
  } catch (error) {
    console.error('포트폴리오 로드 실패:', error)
  }
}
const selectedIds = ref(new Set())

const selectionCountText = computed(
  () => `${selectedIds.value.size}개의 프로젝트가 선택되었습니다.`,
)

/* debug log */
const logText = ref('')
function log(m) {
  console.log(m)
  logText.value = (logText.value + `\n> ${m}`).trim()
}

/* WebRTC */
const localStream = ref(null)
const screenStream = ref(null)

const stompClientRef = ref(null)
const pc = ref(null)

const wsOpen = ref(false)

const roomIdx = computed(() => (route.query.id ? Number(route.query.id) : null))
// google STUN서버
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

const callDisabled = computed(() => !wsOpen.value || roomIdx.value == null)

function initWebSocket() {
  if (stompClientRef.value?.connected) return
  if (roomIdx.value == null) return

  const socket = new SockJS('/ws')
  const stomp = Stomp.over(socket)
  stomp.debug = null
  stompClientRef.value = stomp

  stomp.connect({}, () => {
    wsOpen.value = true
    log(`STOMP connected (room ${roomIdx.value} /sub/webrtc)`)

    stomp.subscribe('/sub/webrtc', async (message) => {
      const data = JSON.parse(message.body)
      if (data.senderId === senderId) return
      if (Number(data.roomIdx) !== Number(roomIdx.value)) return

      try {
        if (data.type === 'offer') await handleOffer(data.offer)
        else if (data.type === 'answer') await handleAnswer(data.answer)
        else if (data.type === 'candidate') await handleCandidate(data.candidate)
      } catch (err) {
        console.error(err)
        log(`Signal handle error: ${err?.message || err}`)
      }
    })
  })
}

function createPeerConnectionIfNeeded() {
  if (pc.value) return

  pc.value = new RTCPeerConnection(rtcConfig)

  // 로컬 트랙 추가 (없으면 수신 전용)
  if (localStream.value) {
    localStream.value.getTracks().forEach((track) => pc.value.addTrack(track, localStream.value))
  }

  // 상대방 트랙 수신
  pc.value.ontrack = (e) => {
    const [remoteStream] = e.streams
    if (remoteVideoRef.value) remoteVideoRef.value.srcObject = remoteStream
    log('Remote stream received')
  }

  // ICE 후보 전달
  pc.value.onicecandidate = (e) => {
    if (e.candidate && stompClientRef.value?.connected && roomIdx.value != null) {
      stompClientRef.value.send(
        `/pub/${roomIdx.value}/webrtc`,
        {},
        JSON.stringify({
          type: 'candidate',
          candidate: e.candidate,
          senderId,
          roomIdx: roomIdx.value,
        }),
      )
    }
  }

  pc.value.onconnectionstatechange = () => log(`PC state: ${pc.value.connectionState}`)
}

async function makeCall() {
  if (!localStream.value) {
    try {
      await startLocalMedia()
    } catch (e) {
      console.error(e)
      const isPermissionDenied =
        e?.name === 'NotAllowedError' || e?.message?.includes('Permission denied')
      if (isPermissionDenied) {
        alert('카메라/마이크 권한을 허용해주세요.')
      } else {
        alert(
          '카메라/마이크에 접근할 수 없습니다. 다른 탭이나 앱에서 사용 중이 아닌지 확인한 뒤 다시 시도해 주세요.',
        )
      }
      return
    }
  }
  initWebSocket()
  createPeerConnectionIfNeeded()

  const offer = await pc.value.createOffer()
  await pc.value.setLocalDescription(offer)

  stompClientRef.value.send(
    `/pub/${roomIdx.value}/webrtc`,
    {},
    JSON.stringify({ type: 'offer', offer, senderId, roomIdx: roomIdx.value }),
  )
  log('Offer sent')
}

async function handleOffer(offer) {
  if (!localStream.value) {
    try {
      await startLocalMedia()
    } catch (e) {
      console.warn('로컬 미디어 없이 수신 전용으로 연결합니다.', e)
      log('수신 전용 모드 (카메라 없이 상대 영상만 수신)')
    }
  }

  initWebSocket()
  createPeerConnectionIfNeeded()

  await pc.value.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await pc.value.createAnswer()
  await pc.value.setLocalDescription(answer)

  stompClientRef.value.send(
    `/pub/${roomIdx.value}/webrtc`,
    {},
    JSON.stringify({ type: 'answer', answer, senderId, roomIdx: roomIdx.value }),
  )
  log('Offer received → Answer sent')
}

async function handleAnswer(answer) {
  await pc.value.setRemoteDescription(new RTCSessionDescription(answer))
  log('Answer received → Connected')
}

async function handleCandidate(candidate) {
  if (!pc.value) return
  await pc.value.addIceCandidate(new RTCIceCandidate(candidate))
}

async function startLocalMedia() {
  localStream.value = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  if (localVideoRef.value) localVideoRef.value.srcObject = localStream.value
  log('Local media ready')

  const at = localStream.value.getAudioTracks()[0]
  const vt = localStream.value.getVideoTracks()[0]
  if (at) at.enabled = micOn.value
  if (vt) vt.enabled = camOn.value
}

async function startScreenShare() {
  try {
    screenStream.value = await navigator.mediaDevices.getDisplayMedia({ video: true })
    if (sharePreviewVideoRef.value) sharePreviewVideoRef.value.srcObject = screenStream.value
    sharePreviewVisible.value = true

    if (pc.value) {
      const sender = pc.value.getSenders().find((s) => s.track && s.track.kind === 'video')
      const newTrack = screenStream.value.getVideoTracks()[0]
      if (sender && newTrack) await sender.replaceTrack(newTrack)
    }
    screenStream.value.getVideoTracks()[0].onended = () => stopScreenShare()

    closeModal('shareModal')
  } catch (err) {
    console.error(err)
    log(`Screen share error: ${err?.message || err}`)
  }
}

async function stopScreenShare() {
  if (screenStream.value) {
    screenStream.value.getTracks().forEach((t) => t.stop())
    screenStream.value = null
  }
  sharePreviewVisible.value = false
  sharePreviewFullSize.value = false

  if (pc.value && localStream.value) {
    const sender = pc.value.getSenders().find((s) => s.track && s.track.kind === 'video')
    const camTrack = localStream.value.getVideoTracks()[0]
    if (sender && camTrack) await sender.replaceTrack(camTrack)
  }
}

/** UI handlers (same behavior) */
function toggleStatus(type) {
  if (type === 'mic') {
    micOn.value = !micOn.value
    const t = localStream.value?.getAudioTracks?.()[0]
    if (t) t.enabled = micOn.value
  } else {
    camOn.value = !camOn.value
    const t = localStream.value?.getVideoTracks?.()[0]
    if (t) t.enabled = camOn.value
  }
}

function handleShareClick() {
  if (screenStream.value) {
    stopScreenShare()
  } else {
    openModal('shareModal')
  }
}

function toggleShareSize() {
  if (sharePreviewVisible.value) sharePreviewFullSize.value = !sharePreviewFullSize.value
}

async function openModal(id) {
  modals.value[id] = true
  if (id === 'authModal') {
    await loadPortfolios()
  }
}

function closeModal(id) {
  modals.value[id] = false
}

function onBackdropClick(id, e) {
  if (e.target?.id === id) closeModal(id)
}

function toggleSidePanel() {
  sideCollapsed.value = !sideCollapsed.value
}

function flipCard() {
  cardFlipped.value = !cardFlipped.value
}

function toggleEnlarge() {
  localEnlarged.value = !localEnlarged.value
}

function togglePortfolio(id) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

function onPortfolioWheel(e) {
  const el = e.currentTarget
  if (el) el.scrollLeft += e.deltaY
}

function confirmAuth() {
  alert('부여되었습니다.')
  closeModal('authModal')
}

function goExit() {
  window.location.href = '/chat'
}

/* 상대방 정보 가져오기 */
async function loadPartnerInfo() {
  try {
    const roomId = route.query.id ? Number(route.query.id) : null
    if (!roomId) {
      console.warn('roomId가 없습니다.')
      return
    }

    const res = await chatApi.chatRoomList()
    if (res && res.data) {
      const room = res.data.find((r) => r.id === roomId)
      if (room) {
        partnerInfo.value = room
        console.log('상대방 정보 로드 완료:', room)
      } else {
        console.warn(`roomId ${roomId}에 해당하는 방을 찾을 수 없습니다.`)
      }
    } else if (Array.isArray(res)) {
      const room = res.find((r) => r.id === roomId)
      if (room) {
        partnerInfo.value = room
        console.log('상대방 정보 로드 완료:', room)
      }
    }
  } catch (error) {
    console.error('상대방 정보 로드 실패:', error)
  }
}

/* lifecycle */
onMounted(async () => {
  document.documentElement.classList.add('dark')

  // 상대방 정보 가져오기
  await loadPartnerInfo()

  initWebSocket()
  // 카메라/마이크는 CALL 버튼 클릭 시 요청 (사용자 동작 후에 요청)
})

onBeforeUnmount(() => {
  try {
    if (stompClientRef.value?.connected) stompClientRef.value.disconnect()
  } catch { }
  try {
    if (pc.value) pc.value.close()
  } catch { }

  try {
    if (screenStream.value) screenStream.value.getTracks().forEach((t) => t.stop())
  } catch { }
  try {
    if (localStream.value) localStream.value.getTracks().forEach((t) => t.stop())
  } catch { }
})
</script>

<style scoped>
:root {
  --bg: #000000;
  --card: #121214;
  --text: #fafafa;
  --accent: #facc15;
  --danger: #ef4444;
  --border: rgba(255, 255, 255, 0.08);
}

.page {
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
  margin: 0;
  width: 100%;
  height: 100%;
}

#remoteVideo {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  background-color: #000000;
}

#sharePreviewContainer {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 200px;
  aspect-ratio: 16/9;
  border-radius: 12px;
  border: 2px solid var(--accent);
  background: #000;
  z-index: 200;
  display: none;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

#sharePreviewContainer.full-size {
  width: calc(100vw - 48px);
  height: calc(100vh - 120px);
  top: 24px;
  right: 24px;
  z-index: 250;
}

#sharePreviewVideo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.local-video-container {
  position: fixed;
  bottom: 20px;
  right: 24px;
  width: 240px;
  z-index: 100;
  transition: width 0.3s ease;
}

.local-video-container.enlarged {
  width: 440px;
}

.local-video {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 16px;
  border: 2px solid var(--accent);
  object-fit: cover;
  background: #000;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
}

.side-panel {
  position: fixed;
  top: 0;
  left: 24px;
  width: 320px;
  background: rgba(18, 18, 20, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 0 0 20px 20px;
  border: 1px solid var(--border);
  border-top: none;
  transition: transform 0.4s ease;
  z-index: 50;
}

.side-panel.collapsed {
  transform: translateY(-100%);
}

.toggle-trigger {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 54px;
  height: 32px;
  background: rgba(18, 18, 20, 0.9);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--accent);
}

.controls {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(20px);
  padding: 14px 24px;
  border-radius: 28px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 150;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #71717a;
  border: 1px solid var(--border);
}

.control-btn.on {
  background: var(--accent);
  color: #000;
  border: none;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.status-label {
  font-size: 9px;
  font-weight: 800;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal.open {
  display: flex;
}

.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.flipped {
  transform: rotateY(180deg);
}

.portfolio-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}

.portfolio-scroll::-webkit-scrollbar {
  height: 6px;
}

.portfolio-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.portfolio-scroll::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 10px;
}

.portfolio-item {
  flex: 0 0 320px;
  background: #1c1c1f;
  border-radius: 24px;
  border: 3px solid transparent;
  padding: 28px;
  cursor: pointer;
}

.portfolio-item.selected {
  border-color: var(--accent);
  background: rgba(250, 204, 21, 0.05);
}

/* 디버그 로그 (필요없으면 display:none) */
#log {
  position: none;
  top: 16px;
  left: 16px;
  z-index: 999;
  font-size: 11px;
  color: #9ca3af;
  white-space: pre-line;
  pointer-events: none;
}
</style>

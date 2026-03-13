<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SectionEditor from '@/components/SectionEditor.vue';
import portfolioApi from '@/api/portfolio/index';

const router = useRouter();

const title = ref('');
const period = ref('');
const role = ref('');
const heroImage = ref(null);
const imagePreview = ref(null);
const sections = ref([
    { sectionTitle: '', contents: '', sectionOrder: 1, isVisible: true }
]);
const currentSectionIndex = ref(0);

const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        heroImage.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// 3. 섹션 추가 함수 (+)
const addSection = () => {
    const nextOrder = sections.value.length + 1;
    sections.value.push({
        sectionTitle: '',
        contents: '',
        sectionOrder: nextOrder,
        isVisible: true
    });
 
    currentSectionIndex.value = sections.value.length - 1;
};

const selectSection = (index) => {
    currentSectionIndex.value = index;
};

const submitPortfolio = async () => {
    if (!title.value.trim()) {
        alert('프로젝트 제목을 입력해주세요.');
        return;
    }

    try {
        // 1. FormData 객체 생성
        const formData = new FormData();

        // 2. 텍스트 데이터를 별도의 객체로 분리
        const dataPayload = {
            title: title.value,
            period: period.value,
            role: role.value,
            sectionList: sections.value,
            accentColor: null,
            fontFamily: null,
            layoutType: null
        };

        // 3. 'data' 키에 JSON Blob 추가 (타입을 application/json으로 명시하여 415 에러 방지)
        formData.append('data', new Blob([JSON.stringify(dataPayload)], {
            type: 'application/json'
        }));

        // 4. 'image' 키에 파일 객체 추가
        if (heroImage.value) {
            formData.append('image', heroImage.value);
        }

        // 5. 수정된 formData를 API로 전송
        const response = await portfolioApi.createPortfolio(formData);
        
        alert('성공적으로 저장되었습니다.');
  
        const newPortfolioIdx = response.data; 
        
        router.push({ path: '/portfolio-update-n-check', query: { idx: newPortfolioIdx } }); 
        
    } catch (error) {
        //
        console.error('포트폴리오 생성 실패:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
};

onMounted(async () => {
});
</script>

<template>
    <div class="bg-pattern text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col min-h-screen">
        <main class="flex-1 pt-24 pb-20 px-4">
            <div class="max-w-4xl mx-auto">

                <div class="mb-10 max-w-3xl mx-auto">
                    <div class="flex justify-between text-sm font-bold text-gray-400 mb-2 px-1">
                        <span class="text-yellow-300">01. 프로젝트 작성</span>
                        <span>02. 프로젝트 확인/수정</span>
                        <span>03. 스타일</span>
                    </div>
                    <div class="w-full h-2 bg-gray-300 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div class="w-1/3 h-full bg-yellow-300 rounded-full shadow-[0_0_10px_#FACC15] transition-all duration-500">
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8 md:p-10 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-point-yellow to-orange-300">
                    </div>

                    <div class="mb-10 text-center">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">프로젝트 & 경험</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">가장 돋보이고 싶은 프로젝트를 골라 자유롭게 구성해보세요.</p>
                    </div>

                    <form @submit.prevent="submitPortfolio" class="space-y-12">
                        <div class="space-y-6">
                            <div class="flex justify-between items-center">
                                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                                    <i class="fa-solid fa-pen-to-square"></i> 프로젝트 속성
                                </label>
                            </div>
                        </div>

                        <div class="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 space-y-5">
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-gray-500 dark:text-gray-400">프로젝트 제목</label>
                                <textarea v-model="title" placeholder="예: E-commerce 모바일 앱 리디자인"
                                    class="h-13 w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-point-yellow focus:ring-1 focus:ring-point-yellow outline-none transition-all text-gray-900 dark:text-white resize-none"></textarea>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400">진행 기간</label>
                                    <input v-model="period" type="text" placeholder="2023.01 - 2023.06"
                                        class="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-point-yellow outline-none text-gray-900 dark:text-white">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400">한 줄 소개</label>
                                    <input v-model="role" type="text" placeholder="예: UI/UX 디자이너로 참여하여 사용자 흐름 개선 및 인터페이스 리디자인 담당"
                                        class="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-point-yellow outline-none text-gray-900 dark:text-white">
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="text-xs font-bold text-gray-500 dark:text-gray-400">대표 이미지</label>
                                <div class="flex items-center gap-4">
                                    <input type="file" accept="image/*" @change="handleImageChange"
                                        class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 dark:file:bg-yellow-900/30 dark:file:text-yellow-500 dark:hover:file:bg-yellow-800/40 transition-all border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-point-yellow focus:outline-none focus:ring-1 focus:ring-point-yellow">
                                    <div v-if="imagePreview" class="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
                                        <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center">
                            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                                <i class="fa-solid fa-pen-to-square"></i> 프로젝트 상세
                            </label>
                        </div>

                        <div class="prj_detail bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 space-y-5">
                            <sidebar>
                                <label class="section text-xs font-bold text-gray-500 dark:text-gray-400">섹션</label>
                                
                                <a href="#" 
                                   v-for="(sec, index) in sections" 
                                   :key="index"
                                   @click.prevent="selectSection(index)"
                                   :class="['prj_select transition-colors', currentSectionIndex === index ? 'bg-yellow-400 text-white' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-gray-100 dark:border-zinc-800']">
                                    {{ index + 1 }}
                                </a>

                                <a href="#" @click.prevent="addSection"
                                    class="prj_select bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 p-6 border border-gray-100 dark:border-zinc-800 space-y-5">
                                    +
                                </a>
                            </sidebar>
                            <main class="prj_content">

                                <div class="space-y-1">
                                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400">
                                        섹션 {{ currentSectionIndex + 1 }} 소제목
                                    </label>
                                    <textarea v-model="sections[currentSectionIndex].sectionTitle" placeholder="본 섹션의 간단한 별명을 지어주세요"
                                        class="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-point-yellow focus:ring-1 focus:ring-point-yellow outline-none transition-all text-gray-900 dark:text-white h-13 resize-none"></textarea>
                                </div>
                                
                                <div class="space-y-1 mt-4">
    
                                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400">상세</label>
                                    <SectionEditor 
                                    :key="currentSectionIndex" 
                                    v-model="sections[currentSectionIndex].contents"      
                                    class="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:border-point-yellow focus:ring-1 focus:ring-point-yellow outline-none transition-all text-gray-900 dark:text-white">
                                </SectionEditor>
                            </div>
                            </main>
                        </div>

                        <div class="pt-6 flex justify-end items-center">
                            <button type="submit"
                                class="px-8 py-3 bg-yellow-50 dark:bg-zinc-800/50 border border-yellow-200 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded-2xl font-black tracking-tight hover:bg-yellow-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center">
                                다음 단계 <i class="fa-solid fa-arrow-right ml-2 text-lg"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
:deep(body) {
    font-family: 'Noto Sans KR', sans-serif;
}

.font-poppins {
    font-family: 'Poppins', sans-serif;
}

.bg-pattern {
    background-color: #f8fafc;
}

.dark .bg-pattern {
    background-color: #18181b;
}

.prj_detail {
    display: flex;
    flex-direction: row;
    gap: 20px;
}

.prj_content {
    flex: 1;
}

sidebar {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    width: 50px;
    align-items: center;
    gap: 10px;
}

.section {
    display: flex;
    width: 45px;
    height: 10px;
    justify-content: center;
    align-items: center;
    margin-top: 29px;
}

.prj_select {
    width: 45px;
    height: 45px;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
}
</style>
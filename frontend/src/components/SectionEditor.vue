<script setup>
import { defineProps, defineEmits } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// 1. 부모에서 v-model로 전달한 값을 받을 prop 정의
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

// 2. 값이 변경될 때 부모로 알릴 emit 정의
const emit = defineEmits(['update:modelValue'])

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  ['link', 'image', 'video', 'formula'],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'script': 'sub' }, { 'script': 'super' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  [{ 'direction': 'rtl' }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'font': [] }],
  [{ 'align': [] }],
];
</script>

<template>
  <QuillEditor 
    :content="modelValue"
    contentType="html"
    @update:content="emit('update:modelValue', $event)"
    :toolbar="toolbarOptions" 
    placeholder="프로젝트의 주요 성과와 해결 과정을 작성해주세요" 
    theme="snow" 
  />
</template>

<style>
/* 기존 스타일 그대로 유지 */
.ql-container {
  height: auto !important;
}

.ql-editor {
  min-height: 400px;
  max-height: 4000px;
  overflow-y: auto;
}

.ql-toolbar {
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  border-color: #e5e7eb;
}

.ql-container {
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  border-color: #e5e7eb;
}

.ql-editor.ql-blank::before {
  color: #9ca3af !important;
  font-style: normal;
  opacity: 1;
}
</style>

<style scoped></style>
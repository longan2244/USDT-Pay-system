<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  modalType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'submit'])

const visible = ref(props.show)

// 监听show属性变化
watch(() => props.show, (newVal) => {
  visible.value = newVal
})

// 关闭模态框
const closeModal = () => {
  visible.value = false
  emit('close')
}

// 提交模态框
const submitModal = () => {
  emit('submit')
}

// 阻止冒泡
const stopPropagation = (event) => {
  event.stopPropagation()
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal" @click="closeModal">
      <div class="modal-backdrop"></div>
      <div class="modal-container" @click="stopPropagation">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="btn-icon" @click="closeModal"><i class="ri-close-line"></i></button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="submitModal">确认</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="less" scoped></style>

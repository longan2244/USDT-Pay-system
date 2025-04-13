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
const mouseDownTarget = ref(null)
// 监听show属性变化
// 监听show属性变化
watch(() => props.show, (newVal) => {
  visible.value = newVal
})
// 记录鼠标按下的目标元素
const handleMouseDown = (event) => {
  mouseDownTarget.value = event.target
}

// 关闭模态框
const closeModal = () => {
  // 只有当鼠标按下和抬起的是同一个元素，且该元素是模态框背景时才关闭
  if (event && !event.target.classList.contains('modal')) {
    visible.value = false
    emit('close')
  }
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
    <div v-if="visible" class="modal" @click="closeModal" @mousedown="handleMouseDown">
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

<style lang="less" scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;

  .modal-container {
    transform: translateY(0);
  }
}

.modal {
  .modal-container {
    transition: transform 0.3s ease;
  }
}
</style>

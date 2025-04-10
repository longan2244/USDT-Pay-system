<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const visible = ref(props.show)
let timer = null

// 监听show属性变化
watch(() => props.show, (newVal) => {
  visible.value = newVal
  if (newVal && props.duration > 0) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      closeNotification()
    }, props.duration)
  }
})

// 关闭通知
const closeNotification = () => {
  visible.value = false
  emit('close')
}

// 获取通知图标
const getNotificationIcon = () => {
  switch (props.type) {
    case 'success':
      return 'ri-check-line'
    case 'error':
      return 'ri-close-circle-line'
    case 'warning':
      return 'ri-alert-line'
    case 'info':
      return 'ri-information-line'
    default:
      return 'ri-notification-line'
  }
}

// 组件挂载时，如果show为true，设置自动关闭定时器
onMounted(() => {
  if (props.show && props.duration > 0) {
    timer = setTimeout(() => {
      closeNotification()
    }, props.duration)
  }
})
</script>

<template>
  <transition name="notification-fade">
    <div v-if="visible" class="notification" :class="type">
      <div class="notification-icon">
        <i :class="getNotificationIcon()"></i>
      </div>
      <div class="notification-content">
        <h3 v-if="title">{{ title }}</h3>
        <p>{{ message }}</p>
      </div>
      <button class="notification-close" @click="closeNotification">
        <i class="ri-close-line"></i>
      </button>
    </div>
  </transition>
</template>

<style lang="less" scoped></style>

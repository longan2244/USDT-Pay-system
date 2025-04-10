<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  }
})

// 根据状态获取类名
const statusClass = computed(() => {
  switch (props.status) {
    case 'pending':
      return 'status-warning'
    case 'processing':
      return 'status-info'
    case 'completed':
      return 'status-success'
    case 'expired':
      return 'status-danger'
    case 'active':
      return 'status-success'
    case 'deleted':
      return 'status-danger'
    case 'available':
      return 'status-success'
    case 'used':
      return 'status-info'
    default:
      return ''
  }
})

// 根据状态获取文本
const statusText = computed(() => {



  if (props.text) {
    return props.text
  }

  switch (props.status) {
    case 'pending':
      return '待支付'
    case 'processing':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'expired':
      return '已取消'
    case 'active':
      return '上架中'
    case 'deleted':
      return '已下架'
    case 'available':
      return '可用'
    case 'used':
      return '已使用'
    default:
      return props.status
  }
})
</script>

<template>
  <span class="status-badge" :class="statusClass">
    {{ statusText }}
  </span>
</template>

<style lang="less" scoped></style>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  soldCount: {
    type: Number,
    required: true
  },
  availableCount: {
    type: Number,
    required: true
  }
})

const calculateProgress = computed(() => {
  const total = props.soldCount + props.availableCount
  if (!total) return 0
  const percentage = (props.soldCount / total) * 100
  return Math.round(percentage)
})
</script>

<template>
  <div class="product-progress">
    <div class="progress-bar">
      <div class="progress" :style="{ width: calculateProgress + '%' }"></div>
    </div>
    <span class="progress-text">{{ calculateProgress }}%</span>
  </div>
</template>

<style lang="less" scoped></style>

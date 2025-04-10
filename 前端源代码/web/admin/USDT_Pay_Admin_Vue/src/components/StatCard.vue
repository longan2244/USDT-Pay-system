<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="stat-card">
    <div class="stat-icon">
      <i :class="icon"></i>
    </div>
    <div class="stat-content">
      <h3>{{ title }}</h3>
      <p class="stat-value">{{ value }}</p>
      <p v-if="description" class="stat-desc">{{ description }}</p>
    </div>
  </div>
</template>

<style lang="less" scoped></style>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['refresh', 'view-all'])

const refreshData = () => {
  emit('refresh')
}

const viewAll = () => {
  emit('view-all')
}
</script>

<template>
  <div class="dashboard-card">
    <div class="card-header">
      <h2>{{ title }}</h2>
      <div class="card-actions" v-if="hasActions">
        <slot name="actions">
          <button class="btn-icon" @click="refreshData">
            <i class="ri-refresh-line"></i>
          </button>
          <button class="btn-primary" @click="viewAll">查看全部</button>
        </slot>
      </div>
    </div>
    <div class="card-body">
      <div v-if="loading" class="loading-state">
        <i class="ri-loader-4-line"></i>
        <p>加载中...</p>
      </div>
      <slot v-else></slot>
    </div>
  </div>
</template>

<style lang="less" scoped></style>

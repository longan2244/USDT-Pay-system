<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '过滤条件'
  }
})

const emit = defineEmits(['reset', 'apply'])

const resetFilters = () => {
  emit('reset')
}

const applyFilters = () => {
  emit('apply')
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-header">
      <h3>{{ title }}</h3>
      <button class="btn-text" @click="resetFilters">重置</button>
    </div>
    <div class="filter-body">
      <slot></slot>
      <div class="filter-row">
        <div class="filter-item filter-actions">
          <button class="btn-primary" @click="applyFilters">
            <i class="ri-search-line"></i> 搜索
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped></style>

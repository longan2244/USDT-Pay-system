<script setup>
import { ref, computed } from 'vue'
import StatusBadge from './StatusBadge.vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  headers: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '没有数据'
  },
  emptyIcon: {
    type: String,
    default: 'ri-file-list-3-line'
  }
})

const emit = defineEmits(['row-action'])

// 处理行操作
const handleRowAction = (action, item) => {
  emit('row-action', { action, item })
}

// 格式化单元格内容
const formatCellValue = (header, item) => {
  const value = item[header.value]



  if (header.formatter) {
    return header.formatter(value, item)
  }

  return value
}
</script>

<template>
  <div class="data-table-wrapper">
    <LoadingSpinner :is-loading="loading" />

    <div v-if="!loading && data.length === 0" class="empty-state">
      <i :class="emptyIcon"></i>
      <p>{{ emptyText }}</p>
    </div>

    <div v-else-if="!loading" class="data-table">
      <div class="table-header">
        <div v-for="header in headers" :key="header.value" class="table-cell" :style="header.style">
          {{ header.text }}
        </div>
      </div>

      <div v-for="(item, index) in data" :key="index" class="table-row">
        <div v-for="header in headers" :key="`${index}-${header.value}`" class="table-cell" :style="header.style">
          <!-- 状态列 -->
          <template v-if="header.type === 'status'">
            <template v-if="header.formatter">
              <StatusBadge 
                :status="formatCellValue(header, item).status || ''" 
                :text="formatCellValue(header, item).text || ''" 
              />
            </template>
            <template v-else>
              <StatusBadge :status="item[header.value] || ''" />
            </template>
          </template>

          <!-- 操作列 -->
          <template v-else-if="header.type === 'actions' && header.actions">
            <div class="action-buttons">
              <template v-for="action in header.actions" :key="action.action">
                <button v-if="!action.condition || (typeof action.condition === 'function' && action.condition(item))"
                  class="btn-icon" @click="handleRowAction(action.action, item)">
                  <i :class="typeof action.icon === 'function' ? action.icon(item) : action.icon"></i>
                </button>
              </template>
            </div>
          </template>

          <!-- 普通列 -->
          <template v-else>
            {{ formatCellValue(header, item) }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped></style>

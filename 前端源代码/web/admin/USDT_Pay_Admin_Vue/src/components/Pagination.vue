<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  page: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['page-change'])

// 计算可见页码
const visiblePages = computed(() => {
  const { page, totalPages, maxVisiblePages } = props

  if (totalPages <= maxVisiblePages) {
    // 如果总页数小于等于最大可见页数，则显示所有页码
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  // 计算起始页码和结束页码
  const halfVisible = Math.floor(maxVisiblePages / 2)
  let startPage = Math.max(page - halfVisible, 1)
  let endPage = startPage + maxVisiblePages - 1

  // 如果结束页码超出总页数，则调整起始页码
  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(endPage - maxVisiblePages + 1, 1)
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
})

// 跳转到指定页
const goToPage = (page) => {
  if (page < 1 || page > props.totalPages || page === props.page) {
    return
  }

  emit('page-change', page)
}
</script>

<template>
  <div class="pagination">
    <button class="pagination-btn" @click="goToPage(1)" :disabled="page === 1" title="第一页">
      <i class="ri-arrow-left-double-line"></i>
    </button>

    <button class="pagination-btn" @click="goToPage(page - 1)" :disabled="page === 1" title="上一页">
      <i class="ri-arrow-left-s-line"></i>
    </button>

    <div class="pagination-info">
      {{ page }} / {{ totalPages }}
      <span v-if="totalItems > 0">(共 {{ totalItems }} 条)</span>
    </div>

    <button class="pagination-btn" @click="goToPage(page + 1)" :disabled="page === totalPages" title="下一页">
      <i class="ri-arrow-right-s-line"></i>
    </button>

    <button class="pagination-btn" @click="goToPage(totalPages)" :disabled="page === totalPages" title="最后一页">
      <i class="ri-arrow-right-double-line"></i>
    </button>
  </div>
</template>

<style lang="less" scoped></style>

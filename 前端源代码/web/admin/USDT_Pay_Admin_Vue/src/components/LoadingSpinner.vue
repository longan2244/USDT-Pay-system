<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  fullScreen: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  text: {
    type: String,
    default: '加载中...'
  }
})

// 计算尺寸类
const sizeClass = computed(() => {
  return `spinner-${props.size}`
})
</script>

<template>
  <div v-if="isLoading" :class="['loading-spinner-container', { 'full-screen': fullScreen }]">
    <div class="loading-spinner-wrapper">
      <div :class="['loading-spinner', sizeClass]"></div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<style lang="less" scoped>
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  // box-shadow: ;

  &.full-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
    z-index: 9999;
    padding: 0;
  }

  .loading-spinner-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
    // box-shadow: var(--shadow-lg);
  }

  .loading-spinner {
    border-radius: 50%;
    border: 3px solid rgba(177, 74, 237, 0.2);
    border-top-color: var(--color-accent);
    animation: spin 1s infinite ease-in-out;

    &.spinner-small {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    &.spinner-medium {
      width: 40px;
      height: 40px;
      border-width: 3px;
    }

    &.spinner-large {
      width: 60px;
      height: 60px;
      border-width: 4px;
    }
  }

  .loading-text {
    margin-top: var(--spacing-md);
    font-size: var(--font-size-md);
    // color: var(--color-text-primary);
    color: var(--color-accent);
    font-weight: 500;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>

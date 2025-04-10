<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  pageTitle: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:searchQuery', 'toggle-mobile-menu'])

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})

const toggleMobileMenu = () => {
  emit('toggle-mobile-menu')
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <button class="mobile-menu-toggle" @click="toggleMobileMenu">
        <i class="ri-menu-line"></i>
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
    <div class="header-right">
      <div class="search-box">
        <i class="ri-search-line"></i>
        <input type="text" placeholder="搜索..." v-model.trim="localSearchQuery">
      </div>
      <div class="user-menu">
        <div class="user-avatar">
          <i class="ri-user-line"></i>
        </div>
        <span class="user-name">管理员</span>
      </div>
    </div>
  </header>
</template>

<style lang="less" scoped>
// // @import '../styles/variables.less';

// .header {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 15px 30px;
//   background-color: var(--header-bg);
//   border-bottom: 1px solid var(--border-color);
//   height: 70px;

//   .header-left {
//     display: flex;
//     align-items: center;

//     .mobile-menu-toggle {
//       display: none;
//       background: none;
//       border: none;
//       color: var(--text-color);
//       font-size: 24px;
//       cursor: pointer;
//       margin-right: 15px;
//       padding: 5px;

//       &:hover {
//         color: var(--primary-color);
//       }
//     }

//     .page-title {
//       font-size: 24px;
//       font-weight: 600;
//       color: var(--text-color);
//       margin: 0;
//     }
//   }

//   .header-right {
//     display: flex;
//     align-items: center;

//     .search-box {
//       position: relative;
//       margin-right: 20px;

//       i {
//         position: absolute;
//         left: 12px;
//         top: 50%;
//         transform: translateY(-50%);
//         color: var(--text-muted);
//         font-size: 18px;
//       }

//       input {
//         background-color: var(--input-bg);
//         border: 1px solid var(--border-color);
//         border-radius: 20px;
//         padding: 8px 15px 8px 40px;
//         width: 250px;
//         color: var(--text-color);
//         font-size: 14px;
//         transition: all 0.2s;

//         &:focus {
//           outline: none;
//           border-color: var(--primary-color);
//           box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
//         }

//         &::placeholder {
//           color: var(--text-muted);
//         }
//       }
//     }

//     .user-menu {
//       display: flex;
//       align-items: center;
//       cursor: pointer;
//       padding: 5px 10px;
//       border-radius: 20px;
//       transition: background-color 0.2s;

//       &:hover {
//         background-color: var(--hover-bg);
//       }

//       .user-avatar {
//         width: 36px;
//         height: 36px;
//         border-radius: 50%;
//         background-color: var(--primary-color);
//         color: white;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         margin-right: 10px;

//         i {
//           font-size: 20px;
//         }
//       }

//       .user-name {
//         font-weight: 500;
//         color: var(--text-color);
//       }
//     }
//   }
// }

// /* 移动端适配 */
// @media (max-width: 768px) {
//   .header {
//     padding: 15px 20px;

//     .header-left {
//       .mobile-menu-toggle {
//         display: block;
//       }
//     }

//     .header-right {
//       .search-box {
//         display: none;
//       }

//       .user-menu {
//         .user-name {
//           display: none;
//         }
//       }
//     }
//   }
// }

// @media (max-width: 480px) {
//   .header {
//     .page-title {
//       font-size: 20px;
//     }
//   }
// }
</style>

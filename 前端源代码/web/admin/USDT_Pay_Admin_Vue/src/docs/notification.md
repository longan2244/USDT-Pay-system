# 通知系统使用文档

本文档介绍了USDT收款系统中的全局通知系统的使用方法。

## 概述

通知系统提供了一种统一的方式来向用户显示操作结果、错误信息和其他重要提示。通知会在页面顶部显示，并在一定时间后自动消失。

## 通知类型

系统支持四种类型的通知：

- `success`: 成功通知，用于显示操作成功的消息
- `error`: 错误通知，用于显示操作失败或错误信息
- `warning`: 警告通知，用于显示警告信息
- `info`: 信息通知，用于显示一般信息

## 使用方法

### 在组件中使用（推荐）

在Vue组件中，可以使用组合式API的方式使用通知系统：

```javascript
import { useNotification } from '../composables/useNotification'

// 在setup函数或setup script中
const { showNotification } = useNotification()

// 显示通知
showNotification('success', '操作成功', '数据已成功保存')
showNotification('error', '操作失败', '保存数据时发生错误')
showNotification('warning', '注意', '此操作不可逆')
showNotification('info', '提示', '系统将在5分钟后维护')

// 自定义显示时间（毫秒）
showNotification('success', '操作成功', '数据已成功保存', 5000) // 显示5秒
```

### 在非组件中使用

在非组件的JavaScript文件中，可以直接从工具函数中导入：

```javascript
import { showNotification } from '../util/notification'

// 显示通知
showNotification('success', '操作成功', '数据已成功保存')
```

### 在模板中使用（不推荐）

在模板中，可以通过全局属性使用通知系统，但不推荐这种方式：

```html
<button @click="$notification.show('success', '成功', '操作已完成')">
  显示通知
</button>
```

## 最佳实践

1. **使用适当的通知类型**：根据消息的性质选择合适的通知类型。
   - `success`: 用于操作成功的反馈
   - `error`: 用于操作失败或错误的反馈
   - `warning`: 用于需要用户注意的警告
   - `info`: 用于一般性的信息提示

2. **简洁明了的标题和消息**：
   - 标题应简短明确，通常不超过5个字
   - 消息内容应清晰描述情况，但不要过长

3. **适当的显示时间**：
   - 默认显示时间为3秒（3000毫秒）
   - 对于重要的错误或警告，可以适当延长显示时间
   - 对于简单的成功提示，可以使用默认时间

4. **避免过多通知**：
   - 避免在短时间内显示多个通知
   - 对于批量操作，考虑合并为一个通知

## 示例

### 添加记录成功

```javascript
showNotification('success', '添加成功', '记录已成功添加到系统')
```

### 表单验证失败

```javascript
showNotification('error', '验证失败', '请填写所有必填字段')
```

### 操作确认

```javascript
showNotification('warning', '请确认', '此操作将永久删除数据，无法恢复', 5000)
```

### 系统通知

```javascript
showNotification('info', '系统通知', '系统将于今晚22:00进行维护')

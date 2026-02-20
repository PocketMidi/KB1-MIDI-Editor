<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="`toast-${type}`">
      <span class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000
});

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);

const icon = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
}[props.type];

onMounted(() => {
  visible.value = true;
  
  if (props.duration > 0) {
    setTimeout(() => {
      visible.value = false;
      setTimeout(() => emit('close'), 300); // Wait for transition
    }, props.duration);
  }
});
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  min-width: 280px;
  max-width: 420px;
  pointer-events: auto;
}

.toast-icon {
  font-size: 1.25rem;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-success {
  background: rgba(76, 175, 80, 0.95);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: white;
}

.toast-error {
  background: rgba(244, 67, 54, 0.95);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: white;
}

.toast-warning {
  background: rgba(255, 152, 0, 0.95);
  border: 1px solid rgba(255, 152, 0, 0.3);
  color: white;
}

.toast-info {
  background: rgba(33, 150, 243, 0.95);
  border: 1px solid rgba(33, 150, 243, 0.3);
  color: white;
}

/* Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>

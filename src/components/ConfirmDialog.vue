<template>
  <Transition name="dialog-fade">
    <div v-if="visible" class="confirm-overlay" @click.self="handleCancel">
      <div 
        class="confirm-dialog" 
        :style="dialogStyle"
        @click.stop
      >
        <div class="confirm-message">{{ message }}</div>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="handleCancel">Cancel</button>
          <button class="btn-confirm" @click="handleConfirm">OK</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface ConfirmDialogProps {
  message: string;
  position?: { x: number; y: number };
}

const props = defineProps<ConfirmDialogProps>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const visible = ref(true);

// Always center the dialog - position prop is ignored
const dialogStyle = computed(() => {
  return {}; // Use default centered positioning from CSS
});

function handleConfirm() {
  visible.value = false;
  setTimeout(() => emit('confirm'), 150);
}

function handleCancel() {
  visible.value = false;
  setTimeout(() => emit('cancel'), 150);
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-dialog {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.confirm-message {
  color: var(--color-text);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-cancel:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.btn-confirm {
  background: rgba(249, 172, 32, 0.2);
  border: 1px solid rgba(249, 172, 32, 0.4);
  color: var(--color-text);
}

.btn-confirm:hover {
  background: rgba(249, 172, 32, 0.3);
  border-color: rgba(249, 172, 32, 0.6);
  box-shadow: 0 0 8px rgba(249, 172, 32, 0.3);
}

.btn-cancel:active,
.btn-confirm:active {
  transform: scale(0.97);
}

/* Transition */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.15s ease;
}

.dialog-fade-enter-active .confirm-dialog,
.dialog-fade-leave-active .confirm-dialog {
  transition: all 0.15s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .confirm-dialog {
  transform: scale(0.95);
  opacity: 0;
}

.dialog-fade-leave-to .confirm-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>

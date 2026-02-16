<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="show"
        class="contextual-modal-overlay"
        @click.self="handleBackdropClick"
      >
        <div 
          class="contextual-modal"
          role="dialog"
          aria-labelledby="contextual-title"
          aria-describedby="contextual-description"
          @click.stop
        >
          <button 
            class="close-button"
            @click="handleDismiss"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
          
          <div class="modal-content">
            <AnimatedBLEIcon :size="90" alt="Bluetooth connection required" />
            
            <h3 id="contextual-title" class="modal-title">
              Connect KB1 First
            </h3>
            
            <p id="contextual-description" class="modal-description">
              Connect your device via Bluetooth to make changes to settings.
            </p>
            
            <div class="modal-actions">
              <button 
                class="connect-button"
                @click="handleConnect"
                ref="connectButtonRef"
              >
                Connect Now
              </button>
              
              <button 
                class="cancel-button"
                @click="handleDismiss"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import AnimatedBLEIcon from './AnimatedBLEIcon.vue';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  connect: [];
  dismiss: [];
}>();

const connectButtonRef = ref<HTMLButtonElement | null>(null);

// Small delay to ensure modal is fully rendered before focusing
const FOCUS_DELAY_MS = 100;

// Focus management
watch(() => props.show, (isShown) => {
  if (isShown) {
    // Focus the connect button when modal opens
    setTimeout(() => {
      connectButtonRef.value?.focus();
    }, FOCUS_DELAY_MS);
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);
  } else {
    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleDismiss();
  }
}

function handleConnect() {
  emit('connect');
}

function handleDismiss() {
  emit('dismiss');
}

function handleBackdropClick() {
  handleDismiss();
}
</script>

<style scoped>
.contextual-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  padding: 1rem;
}

.contextual-modal {
  background: #1A1A1A;
  border: 1px solid #74C4FF;
  border-radius: 6px;
  padding: 24px;
  max-width: 360px;
  width: 100%;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-button:hover {
  opacity: 1;
}

.close-button:focus-visible {
  opacity: 1;
  outline: 2px solid #74C4FF;
  outline-offset: 2px;
  border-radius: 4px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.modal-title {
  font-size: 0.8125rem; /* 13px */
  font-weight: 700;
  color: #EAEAEA;
  margin: 0;
  font-family: 'Roboto Mono';
}

.modal-description {
  font-size: 0.8125rem; /* 13px */
  color: rgba(234, 234, 234, 0.7);
  margin: 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.connect-button {
  flex: 1;
  background: #74C4FF;
  color: #0F0F0F;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 0.8125rem; /* 13px */
  font-weight: 700;
  font-family: 'Roboto Mono';
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.connect-button:hover {
  background: #8DD1FF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(116, 196, 255, 0.3);
}

.connect-button:focus-visible {
  outline: 2px solid #74C4FF;
  outline-offset: 4px;
}

.connect-button:active {
  transform: translateY(0);
}

.cancel-button {
  flex: 1;
  background: transparent;
  color: rgba(234, 234, 234, 0.5);
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.cancel-button:hover {
  color: rgba(234, 234, 234, 0.8);
  border-color: rgba(234, 234, 234, 0.4);
}

.cancel-button:focus-visible {
  color: rgba(234, 234, 234, 0.8);
  outline: 2px solid #74C4FF;
  outline-offset: 2px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .contextual-modal {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 0.8125rem; /* 13px */
  }
  
  .modal-description {
    font-size: 0.8125rem; /* 13px */
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .connect-button,
  .cancel-button {
    width: 100%;
  }
}
</style>

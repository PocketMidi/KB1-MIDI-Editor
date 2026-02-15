<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="show"
        class="first-time-overlay"
        role="dialog"
        aria-labelledby="first-time-title"
        aria-describedby="first-time-description"
        @click.self="handleBackdropClick"
      >
        <div class="modal-card" @click.stop>
          <button 
            class="close-button"
            @click="handleDismiss"
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
          
          <div class="modal-content">
            <AnimatedBLEIcon :size="180" alt="Bluetooth connection" />
            
            <h2 id="first-time-title" class="modal-title">
              Connect KB1 via Bluetooth
            </h2>
            
            <p id="first-time-description" class="modal-description">
              Connect your KB1 device to configure settings and save changes to firmware.
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
                class="skip-button"
                @click="handleDismiss"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue';
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
  // Allow dismissal by clicking backdrop
  handleDismiss();
}
</script>

<style scoped>
.first-time-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #1A1A1A;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: #EAEAEA;
  font-size: 32px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0;
  width: 32px;
  height: 32px;
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
  gap: 24px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #EAEAEA;
  margin: 0;
  font-family: 'Roboto Mono', monospace;
}

.modal-description {
  font-size: 16px;
  color: rgba(234, 234, 234, 0.7);
  margin: 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.connect-button {
  background: #74C4FF;
  color: #0F0F0F;
  border: none;
  border-radius: 6px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
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

.skip-button {
  background: transparent;
  color: rgba(234, 234, 234, 0.5);
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-family: 'Roboto Mono', monospace;
  cursor: pointer;
  transition: color 0.2s;
  text-decoration: underline;
}

.skip-button:hover {
  color: rgba(234, 234, 234, 0.8);
}

.skip-button:focus-visible {
  color: rgba(234, 234, 234, 0.8);
  outline: 2px solid #74C4FF;
  outline-offset: 2px;
  border-radius: 4px;
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
@media (max-width: 640px) {
  .modal-card {
    padding: 32px 24px;
  }
  
  .modal-title {
    font-size: 20px;
  }
  
  .modal-description {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .first-time-overlay {
    padding: 0.5rem;
  }
  
  .modal-card {
    padding: 24px 20px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-description {
    font-size: 13px;
  }
  
  .connect-button {
    padding: 12px 24px;
    font-size: 14px;
  }
}
</style>

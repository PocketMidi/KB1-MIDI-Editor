<template>
  <div class="custom-dropdown" ref="dropdownRef">
    <div class="dropdown-trigger-wrapper">
      <button 
        class="dropdown-trigger"
        @click="toggleOpen"
        :aria-expanded="isOpen"
      >
        <span class="dropdown-label">{{ displayLabel }}</span>
        <span class="dropdown-triangle" :class="{ 'is-open': isOpen }">▲</span>
      </button>
      
      <Transition name="dropdown">
        <div v-if="isOpen" class="dropdown-menu" ref="menuRef">
          <button
            v-for="option in options"
            :key="option.value"
            class="dropdown-item"
            :class="{ 'is-selected': option.value === modelValue }"
            @click="selectOption(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </Transition>
    </div>
    
    <!-- Spacer to push content down when dropdown is open -->
    <div v-if="isOpen" class="dropdown-spacer" :style="{ height: menuHeight + 'px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

interface DropdownOption {
  label: string;
  value: string | number;
}

const props = defineProps<{
  modelValue: string | number;
  options: DropdownOption[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuHeight = ref(0);

const displayLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue);
  return selected?.label || props.placeholder || 'Select...';
});

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function selectOption(value: string | number) {
  emit('update:modelValue', value);
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

// Update menu height when opened
watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    if (menuRef.value) {
      // Use scrollHeight to get actual content height regardless of animation
      // Add 4px for the gap between trigger and menu
      menuHeight.value = menuRef.value.scrollHeight + 4;
    }
  } else {
    menuHeight.value = 0;
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-dropdown {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.dropdown-trigger-wrapper {
  position: relative;
  width: auto;
}

.dropdown-trigger {
  width: auto;
  min-width: 280px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1px 0.5rem 1px 0.25rem;
  background: transparent !important;
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 400;
  cursor: pointer;
  text-align: right;
  transition: all 0.2s ease;
}

.dropdown-trigger:hover {
  background: rgba(234, 234, 234, 0.05);
}

.dropdown-label {
  text-align: right;
}

.dropdown-triangle {
  display: inline-block;
  margin-left: 0.5rem;
  color: rgba(234, 234, 234, 0.5);
  font-size: 0.625rem;
  transition: transform 0.2s ease;
  transform: rotate(180deg);
}

.dropdown-triangle.is-open {
  transform: rotate(0deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: auto;
  min-width: 280px;
  background: #1A1A1A;
  overflow: visible;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.dropdown-spacer {
  width: 100%;
  pointer-events: none;
  transition: height 0.2s ease;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 1px 0.5rem 1px 0.25rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid #0F0F0F;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: right;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease;
  margin-bottom: 1px;
}

.dropdown-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.dropdown-item:hover {
  background: rgba(66, 63, 59, 0.3);
}

.dropdown-item.is-selected {
  background: rgba(66, 63, 59, 0.5);
  font-weight: 600;
}

/* Transition animations */
.dropdown-enter-active {
  animation: dropdown-in 0.2s ease-out;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease-in;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .dropdown-trigger {
    min-width: 150px;
    max-width: 100%;
  }

  .dropdown-menu {
    min-width: 150px;
    max-width: min(280px, calc(100vw - 3rem));
    right: 0.5rem;
  }

  .dropdown-item {
    white-space: nowrap;
    overflow: visible;
  }
}
</style>

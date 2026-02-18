<template>
  <div class="accordion-section" :class="{ 'is-open': isOpen }">
    <button 
      class="accordion-header" 
      @click="toggle"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-content-${id}`"
    >
      <div class="accordion-title">
        <h3>
          {{ title }}
          <span v-if="titleSuffix" class="title-suffix" :class="{ fading: titleSuffixFading }">{{ titleSuffix }}</span>
        </h3>
        <div v-if="subtitle" class="accordion-subtitle">{{ subtitle }}</div>
      </div>
      <slot name="header-right">
        <div v-if="midiCc !== undefined" class="midi-cc-display">
          MIDI CC <span class="midi-cc-number">{{ midiCc }}</span>
        </div>
      </slot>
      <span class="accordion-icon">{{ isOpen ? '−' : '+' }}</span>
    </button>
    <div 
      :id="`accordion-content-${id}`"
      class="accordion-content"
      :class="{ 'is-open': isOpen }"
    >
      <div class="accordion-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  subtitle?: string;
  midiCc?: number;
  id?: string;
  defaultOpen?: boolean;
  titleSuffix?: string;
  titleSuffixFading?: boolean;
}>();

const isOpen = ref(props.defaultOpen ?? false);

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>

<style scoped>
.accordion-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem 0.5rem; /* 12px top, 20px left/right, 8px bottom */
  background: rgba(106, 104, 83, 0.2); /* #6A6853 at 20% */
  border: none;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  min-height: 44px; /* Mobile touch target */
  font-family: 'Roboto Mono';
}

.accordion-section.is-open .accordion-header {
  background: rgba(106, 104, 83, 0.35); /* Brighter when selected */
}

.accordion-header:hover {
  background: rgba(106, 104, 83, 0.3);
}

.accordion-header:active {
  background: rgba(106, 104, 83, 0.45);
}

.accordion-title {
  flex: 1;
}

.accordion-title h3 {
  margin: 0;
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  color: #848484;
  text-transform: uppercase;
  font-family: 'Roboto Mono';
}

.title-suffix {
  color: #F9AC20;
  margin-left: 0.5rem;
  font-weight: 500;
  text-transform: none;
  opacity: 1;
  transition: none;
}

.title-suffix.fading {
  opacity: 0;
  transition: opacity 2s ease-out;
}

.accordion-section.is-open .accordion-title h3 {
  font-weight: 700;
  color: #EAEAEA;
}

.accordion-subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
  line-height: 1.4;
  font-family: 'Roboto Mono';
}

.midi-cc-display {
  font-size: 0.8125rem; /* 13px */
  font-weight: 400;
  color: #848484;
  font-family: 'Roboto Mono';
  margin-right: 1rem;
}

.midi-cc-number {
  color: #F9AC20;
  font-weight: 600;
}

.accordion-icon {
  font-size: 0.8125rem; /* 13px */
  font-weight: 300;
  color: var(--color-text-muted);
  margin-left: 1rem;
  transition: transform 0.2s;
  min-width: 24px;
  text-align: center;
}

.accordion-section.is-open .accordion-icon {
  transform: rotate(0deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.accordion-content.is-open {
  max-height: 5000px;
  transition: max-height 0.3s ease-in;
}

.accordion-body {
  padding: 0; /* Remove all padding to let child control its own */
}

@media (max-width: 768px) {
  .accordion-header {
    padding: 0.875rem 1rem;
  }
  
  .accordion-body {
    padding: 0; /* Remove all padding on mobile too */
  }
  
  .accordion-icon {
    margin-left: 0.5rem;
  }
}
</style>

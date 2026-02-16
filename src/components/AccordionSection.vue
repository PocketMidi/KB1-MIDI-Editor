<template>
  <div class="accordion-section" :class="{ 'is-open': isOpen }">
    <button 
      class="accordion-header" 
      @click="toggle"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-content-${id}`"
    >
      <div class="accordion-title">
        <h3>{{ title }}</h3>
        <div v-if="subtitle" class="accordion-subtitle">{{ subtitle }}</div>
      </div>
      <div v-if="midiCc !== undefined" class="midi-cc-display">
        MIDI CC <span class="midi-cc-number">{{ midiCc }}</span>
      </div>
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
  border-radius: var(--kb1-radius-md, 8px);
  margin-bottom: 1rem;
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
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  min-height: 44px; /* Mobile touch target */
  font-family: 'Roboto Mono', monospace;
}

.accordion-header:hover {
  background: var(--color-background-mute);
}

.accordion-header:active {
  background: var(--color-background);
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
  font-family: 'Roboto Mono', monospace;
}

.accordion-subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
  line-height: 1.4;
  font-family: 'Roboto Mono', monospace;
}

.midi-cc-display {
  font-size: 0.8125rem; /* 13px */
  font-weight: 400;
  color: #848484;
  font-family: 'Roboto Mono', monospace;
  margin-right: 1rem;
}

.midi-cc-number {
  color: #F9AC20;
  font-weight: 600;
}

.accordion-icon {
  font-size: 1.5rem;
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
  padding: 0 1.25rem 1.25rem 1.25rem;
}

@media (max-width: 768px) {
  .accordion-header {
    padding: 0.875rem 1rem;
  }
  
  .accordion-body {
    padding: 0 1rem 1rem 1rem;
  }
  
  .accordion-icon {
    margin-left: 0.5rem;
  }
}
</style>

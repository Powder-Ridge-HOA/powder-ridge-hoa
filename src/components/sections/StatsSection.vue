<script setup>
import { computed } from 'vue';
const props = defineProps({ section: { type: Object, default: null } });
const stats = computed(() => props.section?.items || []);
</script>

<template>
  <section v-if="stats.length" class="py-14 px-6 text-white" style="background-color: var(--color-primary)">
    <div class="max-w-5xl mx-auto">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-center mb-10">{{ section.heading }}</h2>
      <div class="reveal-stagger grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div v-for="(s, i) in stats" :key="i">
          <p class="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
            <span v-if="s.prefix">{{ s.prefix }}</span>{{ s.value }}<span v-if="s.suffix" class="text-2xl md:text-3xl">{{ s.suffix }}</span>
          </p>
          <p class="text-white/85 text-sm font-medium uppercase tracking-wide">{{ s.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

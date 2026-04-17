<script setup>
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';
const props = defineProps({ section: { type: Object, default: null } });
const plans = computed(() => props.section?.plans || []);
</script>

<template>
  <section v-if="plans.length" class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div class="max-w-5xl mx-auto">
      <div v-if="section?.heading || section?.subheading" class="text-center mb-12">
        <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)] mb-3">{{ section.heading }}</h2>
        <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] text-base max-w-xl mx-auto">{{ section.subheading }}</p>
      </div>
      <div class="reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div v-for="(tier, i) in plans" :key="i" class="rounded-2xl border p-8 flex flex-col" :class="tier.highlighted ? 'text-white shadow-xl scale-105' : 'border-[var(--color-border)] bg-[var(--color-bg)]'" :style="tier.highlighted ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}">
          <div v-if="tier.highlighted" class="text-[0.8125rem] font-bold uppercase tracking-widest text-white/70 mb-3">Most Popular</div>
          <h3 v-if="tier.name" class="text-xl font-bold mb-1" :class="tier.highlighted ? 'text-white' : 'text-[var(--color-text)]'">{{ tier.name }}</h3>
          <p v-if="tier.description" class="text-sm mb-4" :class="tier.highlighted ? 'text-white/70' : 'text-[var(--color-text-secondary)]'">{{ tier.description }}</p>
          <div v-if="tier.price" class="mb-6">
            <div>
              <span class="text-4xl font-extrabold" :class="tier.highlighted ? 'text-white' : 'text-[var(--color-text)]'">{{ tier.price }}</span>
              <span v-if="tier.period" class="text-sm ml-1" :class="tier.highlighted ? 'text-white/75' : 'text-[var(--color-text-secondary)]'">{{ tier.period }}</span>
            </div>
            <div v-if="tier.maintenancePrice" class="mt-1">
              <span class="text-lg font-bold" :class="tier.highlighted ? 'text-white/90' : 'text-[var(--color-text)]'">{{ tier.maintenancePrice }}</span>
              <span v-if="tier.maintenanceLabel" class="text-[0.8125rem] ml-1" :class="tier.highlighted ? 'text-white/70' : 'text-[var(--color-text-secondary)]'">{{ tier.maintenanceLabel }}</span>
            </div>
          </div>
          <ul v-if="tier.features?.length" class="space-y-3 mb-8 flex-1">
            <li v-for="(f, fi) in tier.features" :key="fi" class="flex items-start gap-2 text-sm">
              <span :style="tier.highlighted ? 'color: rgba(255,255,255,0.65)' : 'color: var(--color-primary)'">✓</span>
              <span :class="tier.highlighted ? 'text-white/80' : 'text-[var(--color-text)]'">{{ f }}</span>
            </li>
          </ul>
          <SmartLink v-if="tier.ctaLabel || tier.ctaUrl" :to="tier.ctaUrl || '/contact'" class="block text-center py-3 rounded-xl font-semibold text-sm transition-colors" :class="tier.highlighted ? 'focus-ring-light bg-white hover:bg-[var(--color-accent)] hover:text-[#111827]' : 'focus-ring text-white hover:opacity-90'" :style="tier.highlighted ? { color: 'var(--color-primary)' } : { backgroundColor: 'var(--color-primary)' }">{{ tier.ctaLabel || 'Get Started' }}</SmartLink>
        </div>
      </div>
    </div>
  </section>
</template>

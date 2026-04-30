<script setup>
import { computed } from 'vue';
import SmartLink from '@/components/ui/SmartLink.vue';

const props = defineProps({ section: { type: Object, default: null } });
const items = computed(() => props.section?.items || []);
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading" class="max-w-3xl mx-auto mb-10">
      <h2 class="text-3xl font-bold text-[var(--color-text)] text-center">{{ section.heading }}</h2>
    </div>

    <ul v-if="items.length" class="community-info max-w-3xl mx-auto">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="community-info__item"
      >
        <p class="community-info__label">{{ item.label }}</p>
        <p class="community-info__value">
          <span class="community-info__value-text">{{ item.value }}</span>
          <SmartLink
            v-if="item.linkLabel && item.linkUrl"
            :to="item.linkUrl"
            class="community-info__link"
          >{{ item.linkLabel }}</SmartLink>
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.community-info {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  padding: 0;
  margin: 0;
}

@media (min-width: 768px) {
  .community-info {
    grid-template-columns: 1fr 1fr;
    column-gap: 3rem;
    row-gap: 0;
  }
}

.community-info__item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--color-border);
}

/* Drop the bottom border on the final row(s) so the grid doesn't end with a stray line. */
@media (min-width: 768px) {
  .community-info__item:nth-last-child(-n + 2):nth-child(odd),
  .community-info__item:nth-last-child(-n + 1):nth-child(even) {
    border-bottom: none;
  }
}

@media (max-width: 767px) {
  .community-info__item:last-child {
    border-bottom: none;
  }
}

.community-info__label {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.community-info__value {
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

.community-info__value-text {
  white-space: pre-wrap;
}

.community-info__link {
  display: inline;
  margin-left: 0.25rem;
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  transition: border-color 0.15s ease;
}

.community-info__link:hover {
  border-bottom-color: var(--color-primary);
}

.community-info__link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>

<script setup>
import { useHead } from '@unhead/vue';
import { useSanity } from '@/composables/useSanity';
import { sectionMap, pageQuery } from '@/composables/useSections';
import { useRevealObserver } from '@/composables/useRevealObserver';

// Private / auth-gated page: keep it out of search indexes and referrer leaks.
useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'referrer', content: 'no-referrer' },
  ],
});

const { data: page } = useSanity(pageQuery('/directory'));
useRevealObserver(page);
</script>

<template>
  <main class="page page--directory">
    <template v-for="section in (page?.sections || [])" :key="section._key">
      <component :is="sectionMap[section._type]" v-if="sectionMap[section._type]" :section="section" />
    </template>
  </main>
</template>

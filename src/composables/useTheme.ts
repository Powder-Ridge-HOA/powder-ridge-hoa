import { useLocalStorage } from '@vueuse/core';
import { watchEffect } from 'vue';

export function useTheme() {
  const theme = useLocalStorage<'light' | 'dark'>('theme', 'light');

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value);
  });

  return { theme, toggle };
}

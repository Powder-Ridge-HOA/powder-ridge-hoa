<script setup>
import { ref } from 'vue';
import { PortableText } from '@portabletext/vue';
import { useCollection } from '@/composables/useCollection';
const props = defineProps({ section: { type: Object, default: null } });
const { data: minutes, loading, error } = useCollection(
  `*[_type == "boardMinutes"] | order(meetingStart desc){
    _id, title, meetingStart, endTime, teleconference, tags,
    oldBusiness, newBusiness, treasurersReport
  }`,
  () => props.section?.minutes,
);
const open = ref(new Set());
const toggle = (id) => {
  const next = new Set(open.value);
  next.has(id) ? next.delete(id) : next.add(id);
  open.value = next;
};
const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};
const formatMoney = (cents) => {
  if (typeof cents !== 'number') return '';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading || section?.subheading" class="max-w-4xl mx-auto text-center mb-8">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)]">{{ section.heading }}</h2>
      <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] mt-2">{{ section.subheading }}</p>
    </div>
    <p v-if="loading && !minutes.length" class="text-center text-[var(--color-text-secondary)]">Loading minutes…</p>
    <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>
    <ul v-else-if="minutes.length" class="max-w-4xl mx-auto space-y-3">
      <li v-for="m in minutes" :key="m._id" class="bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
        <button
          type="button"
          class="w-full text-left px-4 py-3 flex justify-between items-center gap-4"
          :aria-expanded="open.has(m._id)"
          @click="toggle(m._id)"
        >
          <span>
            <span class="font-medium text-[var(--color-text)]">{{ m.title || formatDate(m.meetingStart) }}</span>
            <span v-if="m.teleconference" class="ml-2 text-xs uppercase tracking-wide text-[var(--color-primary)]">Teleconference</span>
          </span>
          <span class="text-[var(--color-text-secondary)]" aria-hidden="true">{{ open.has(m._id) ? '−' : '+' }}</span>
        </button>
        <div v-if="open.has(m._id)" class="px-4 pb-4 space-y-6 text-sm text-[var(--color-text)]">
          <div v-if="m.oldBusiness?.length">
            <h3 class="font-semibold mb-2">Old Business</h3>
            <div class="prose prose-sm max-w-none text-[var(--color-text-secondary)]">
              <PortableText :value="m.oldBusiness" />
            </div>
          </div>
          <div v-if="m.newBusiness?.length">
            <h3 class="font-semibold mb-2">New Business</h3>
            <div class="prose prose-sm max-w-none text-[var(--color-text-secondary)]">
              <PortableText :value="m.newBusiness" />
            </div>
          </div>
          <div v-if="m.treasurersReport" class="border-t border-[var(--color-border)] pt-4">
            <h3 class="font-semibold mb-2">Treasurer's Report</h3>
            <p v-if="m.treasurersReport.treasurersName" class="text-[var(--color-text-secondary)]">
              Reported by <span class="font-medium">{{ m.treasurersReport.treasurersName }}</span>
            </p>
            <p v-if="typeof m.treasurersReport.totalBalance === 'number'" class="mt-1">
              Balance: <span class="font-mono">{{ formatMoney(m.treasurersReport.totalBalance) }}</span>
            </p>
            <p v-if="m.treasurersReport.notes" class="mt-2 text-[var(--color-text-secondary)] whitespace-pre-wrap">{{ m.treasurersReport.notes }}</p>
            <table v-if="m.treasurersReport.expenses?.length" class="w-full mt-3 text-sm">
              <thead>
                <tr class="text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                  <th class="py-1 font-medium">Expense</th>
                  <th class="py-1 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in m.treasurersReport.expenses" :key="e._key" class="border-b border-[var(--color-border)]">
                  <td class="py-1">{{ e.nameOfExpense }}</td>
                  <td class="py-1 text-right font-mono">{{ formatMoney(e.amountOfExpense) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </li>
    </ul>
    <p v-else class="text-center text-[var(--color-text-secondary)]">No meeting minutes available.</p>
  </section>
</template>

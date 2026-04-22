<script setup>
import { ref } from 'vue';
import { useSiteStore } from '@/stores/useSiteStore';
defineProps({ section: { type: Object, default: null } });
const site = useSiteStore();
const contactForm = ref({ name: '', email: '', subject: '', recipient: 'Secretary', message: '' });
const recipientOptions = ['President', 'Secretary', 'Vice President', 'Treasurer', 'Committee Chairman'];
const contactSent = ref(false);
const contactError = ref('');
const submitting = ref(false);

async function sendContact() {
  const { name, email, subject, recipient, message } = contactForm.value;
  if (!name || !email || !subject || !recipient || !message) {
    contactError.value = 'Please fill out all fields.';
    return;
  }
  contactError.value = '';
  submitting.value = true;
  try {
    const res = await fetch('/.netlify/functions/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, recipient, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    contactSent.value = true;
  } catch (err) {
    contactError.value = err instanceof Error ? err.message : 'Failed to send. Please try again.';
  } finally {
    submitting.value = false;
  }
}

function formatPhone(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') return formatPhone(digits.slice(1));
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}
</script>

<template>
  <section class="py-16 px-6 bg-[var(--color-bg)]">
    <div class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div class="space-y-6">
          <div>
            <h2 class="text-3xl font-bold text-[var(--color-text)] mb-4 leading-tight">Get in Touch</h2>
            <p class="text-[var(--color-text-secondary)] text-base leading-relaxed">Use the form to reach the right board member directly. We'll get back to you as soon as we can.</p>
          </div>
          <div>
            <p class="text-[0.8125rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">Email</p>
            <a href="mailto:powderridgesecretary@gmail.com" class="text-sm font-medium text-[var(--color-primary)] hover:underline transition-colors rounded focus-ring">powderridgesecretary@gmail.com</a>
          </div>
          <div>
            <p class="text-[0.8125rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">Mailing Address</p>
            <p class="text-sm text-[var(--color-text)] leading-relaxed">
              P.O. Box 4574<br />
              Grand Junction, CO 81502
            </p>
          </div>
          <div>
            <p class="text-[0.8125rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">HOA Dues</p>
            <p class="text-sm text-[var(--color-text)] leading-relaxed">
              $150 per year, collected in March<br />
              Make checks payable to Powder Ridge HOA
            </p>
          </div>
          <div>
            <p class="text-[0.8125rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">Response Time</p>
            <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">Board members are volunteers — please allow a few days for a response.</p>
          </div>
        </div>
        <div v-if="!contactSent" class="bg-[var(--color-bg)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm space-y-4">
          <h3 class="text-lg font-semibold text-[var(--color-text)]">Send a Message</h3>
          <div>
            <label for="contact-name" class="block text-[0.8125rem] font-medium text-[var(--color-text-secondary)] mb-1">Full Name <span class="text-red-400" aria-hidden="true">*</span></label>
            <input id="contact-name" v-model="contactForm.name" type="text" placeholder="Your name" aria-required="true" :aria-describedby="contactError ? 'contact-error' : undefined" class="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] hover:border-[var(--color-primary)]" />
          </div>
          <div>
            <label for="contact-email" class="block text-[0.8125rem] font-medium text-[var(--color-text-secondary)] mb-1">Email <span class="text-red-400" aria-hidden="true">*</span></label>
            <input id="contact-email" v-model="contactForm.email" type="email" placeholder="your@email.com" aria-required="true" :aria-describedby="contactError ? 'contact-error' : undefined" class="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] hover:border-[var(--color-primary)]" />
          </div>
          <div>
            <label for="contact-subject" class="block text-[0.8125rem] font-medium text-[var(--color-text-secondary)] mb-1">Subject <span class="text-red-400" aria-hidden="true">*</span></label>
            <input id="contact-subject" v-model="contactForm.subject" type="text" placeholder="Reason for contacting?" aria-required="true" :aria-describedby="contactError ? 'contact-error' : undefined" class="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] hover:border-[var(--color-primary)]" />
          </div>
          <div>
            <label for="contact-recipient" class="block text-[0.8125rem] font-medium text-[var(--color-text-secondary)] mb-1">Who are you contacting? <span class="text-red-400" aria-hidden="true">*</span></label>
            <select id="contact-recipient" v-model="contactForm.recipient" aria-required="true" :aria-describedby="contactError ? 'contact-error' : undefined" class="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] hover:border-[var(--color-primary)]">
              <option v-for="option in recipientOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
          <div>
            <label for="contact-message" class="block text-[0.8125rem] font-medium text-[var(--color-text-secondary)] mb-1">Message <span class="text-red-400" aria-hidden="true">*</span></label>
            <textarea id="contact-message" v-model="contactForm.message" rows="4" placeholder="How can we help?" aria-required="true" :aria-describedby="contactError ? 'contact-error' : undefined" class="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] bg-[var(--color-bg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] hover:border-[var(--color-primary)] resize-none"></textarea>
          </div>
          <p v-if="contactError" id="contact-error" role="alert" class="text-red-500 text-sm">{{ contactError }}</p>
          <button @click="sendContact" :disabled="submitting" class="w-full py-3 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer hover:opacity-90 focus-ring disabled:opacity-50 disabled:cursor-not-allowed" style="background-color: var(--color-primary)">{{ submitting ? 'Sending...' : 'Send Message' }}</button>
        </div>
        <div v-else class="bg-[var(--color-bg)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm flex items-center justify-center min-h-70">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style="background-color: color-mix(in srgb, var(--color-primary) 10%, transparent)"><span class="text-xl">✓</span></div>
            <p class="font-semibold text-[var(--color-text)] mb-1">Message sent!</p>
            <p class="text-[var(--color-text-secondary)] text-sm">We'll be in touch shortly.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

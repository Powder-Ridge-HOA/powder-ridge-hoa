import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';
import { createAuth0 } from '@auth0/auth0-vue'

const app = createApp(App);
const pinia = createPinia();
const head = createHead();

app.use(pinia);
app.use(router);
app.use(head);


app.use(
  createAuth0(
    {
      domain: import.meta.env.VITE_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
        ...(import.meta.env.VITE_AUTH0_AUDIENCE ? { audience: import.meta.env.VITE_AUTH0_AUDIENCE } : {}),
      },
    },
    {
      // Don't let the SDK auto-process ?code= & ?state=. CallbackPage will
      // call handleRedirectCallback() explicitly. This prevents the SDK's
      // built-in URL cleanup (history.replaceState to "/") from racing
      // against our router.replace to the intended destination.
      skipRedirectCallback: true,
    },
  )
)

app.mount('#app');

// Allow Space key to activate links (a tags) for keyboard accessibility.
// Native <a> elements only respond to Enter; this adds Space parity with <button>.
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target instanceof HTMLAnchorElement) {
    e.preventDefault();
    e.target.click();
  }
});

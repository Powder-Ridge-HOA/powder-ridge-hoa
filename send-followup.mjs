#!/usr/bin/env node
// send-followup.mjs
// ----------------------------------------------------------------------------
// Plain-text-friendly follow-up to the welcome email. Tells residents what
// to do AFTER they set their password, in case Auth0's success page didn't
// redirect them automatically: visit /directory, log in with email + new
// password.
//
// Same recipient list as send-welcome.mjs (Auth0 Username-Password
// connection minus admin emails). No password-reset ticket is created
// here — the prior tickets are still valid for 7 days. We just send a
// plain reminder + login instructions.
//
// USAGE:
//   node send-followup.mjs              # dry-run: list who would receive
//   node send-followup.mjs --live       # send to every recipient
// ----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
for (const file of ['./.env', '../dashboard/.env']) {
  try {
    const text = readFileSync(new URL(file, here), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* ok if missing */ }
}

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Powder Ridge HOA <welcome@powderridgegrandmesa.com>';
const REPLY_TO = process.env.REPLY_TO || 'powderridgesecretary@gmail.com';
const DIRECTORY_URL = 'https://powderridgegrandmesa.com/directory';
const SEND_DELAY_MS = 700;

const SKIP_ADMINS = new Set([
  'powderridgepresident@gmail.com',
  'powderridgesecretary@gmail.com',
  'prhoageneral@gmail.com',
]);

const args = process.argv.slice(2);
const LIVE_MODE = args.includes('--live');

const missing = [];
if (!AUTH0_DOMAIN) missing.push('AUTH0_DOMAIN');
if (!RESEND_API_KEY) missing.push('RESEND_API_KEY');
if (missing.length) {
  console.error(`Missing required env var(s): ${missing.join(', ')}`);
  process.exit(1);
}

let mgmtToken = null;
async function getToken() {
  if (mgmtToken) return mgmtToken;
  const id = process.env.AUTH0_MGMT_CLIENT_ID;
  const secret = process.env.AUTH0_MGMT_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Need AUTH0_MGMT_CLIENT_ID + AUTH0_MGMT_CLIENT_SECRET');
  const r = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: id,
      client_secret: secret,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(j)}`);
  mgmtToken = j.access_token;
  return mgmtToken;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path) {
  const token = await getToken();
  await sleep(SEND_DELAY_MS);
  const r = await fetch(`https://${AUTH0_DOMAIN}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${await r.text()}`);
  return r.json();
}

async function fetchRecipients() {
  const recipients = [];
  let page = 0;
  while (true) {
    const u = `/api/v2/users?search_engine=v3&q=${encodeURIComponent('identities.connection:"Username-Password-Authentication"')}&per_page=100&page=${page}`;
    const batch = await api(u);
    for (const u of batch) {
      const email = String(u.email || '').toLowerCase().trim();
      if (!email) continue;
      if (SKIP_ADMINS.has(email)) continue;
      recipients.push({ email });
    }
    if (batch.length < 100) break;
    page++;
    if (page > 10) break;
  }
  recipients.sort((a, b) => a.email.localeCompare(b.email));
  return recipients;
}

function renderHtml() {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>How to log in to the Powder Ridge HOA website</title>
</head>
<body style="margin:0; padding:0; background-color:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; color:#1f2937; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td align="center" style="background-color:#016b37; padding:40px 24px;">
              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:0.5px; line-height:1.2;">Powder Ridge HOA</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:0.3px;">Grand Mesa, Colorado</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              <h2 style="margin:0 0 16px; color:#111827; font-size:20px; font-weight:700;">How to log in</h2>
              <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.6;">
                You recently received a welcome email asking you to set a password for the new Powder Ridge HOA website. After setting your password, the next step is to log in.
              </p>
              <ol style="margin:0 0 24px; padding-left:1.25rem; color:#374151; font-size:15px; line-height:1.7;">
                <li>Visit
                  <a href="${DIRECTORY_URL}" style="color:#016b37; text-decoration:underline; font-weight:600;">${DIRECTORY_URL}</a>
                </li>
                <li>Enter your email address and the password you just set</li>
                <li>You'll see the resident directory once you're signed in</li>
              </ol>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:8px; background-color:#016b37;">
                    <a href="${DIRECTORY_URL}" style="display:inline-block; padding:14px 32px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; border-radius:8px; letter-spacing:0.3px;">Go to the directory</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px; border-top:1px solid #e5e7eb;">
                <tr>
                  <td style="padding-top:20px; color:#6b7280; font-size:13px; line-height:1.6;">
                    <strong>Haven't set your password yet?</strong> Check your inbox for the welcome email titled &ldquo;Welcome to the new Powder Ridge HOA website&rdquo; and click the &ldquo;Set your password&rdquo; button there. The password-set link expires in 7 days from when it was sent.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px; color:#6b7280; font-size:13px; line-height:1.6;">
                    <strong>Can't find the welcome email?</strong> It may be in your spam or promotions folder. If you still can't find it, reply to this email and the Secretary will resend the password-set link.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px; color:#6b7280; font-size:13px; line-height:1.6;">
                    Questions: <a href="mailto:powderridgesecretary@gmail.com" style="color:#016b37; text-decoration:underline;">powderridgesecretary@gmail.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f3f4f6; padding:20px 40px; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#6b7280; font-size:12px; line-height:1.5;">Powder Ridge HOA &middot; P.O. Box 4574 &middot; Grand Junction, CO 81502</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText() {
  return [
    'How to log in to the Powder Ridge HOA website',
    '',
    'You recently received a welcome email asking you to set a password for',
    'the new Powder Ridge HOA website. After setting your password, the next',
    'step is to log in:',
    '',
    `  1. Visit ${DIRECTORY_URL}`,
    '  2. Enter your email and the password you just set',
    '  3. You will see the resident directory once you are signed in',
    '',
    'HAVEN\'T SET YOUR PASSWORD YET?',
    'Check your inbox for the welcome email titled "Welcome to the new Powder',
    'Ridge HOA website" and click the "Set your password" button there. The',
    'password-set link expires 7 days from when it was originally sent.',
    '',
    'CAN\'T FIND THE WELCOME EMAIL?',
    'Check your spam or promotions folder. If you still can\'t find it,',
    'reply to this email and the Secretary will resend the password-set link.',
    '',
    'Questions: powderridgesecretary@gmail.com',
    '',
    '— Powder Ridge HOA',
    'P.O. Box 4574, Grand Junction, CO 81502',
  ].join('\n');
}

async function sendEmail(to) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      reply_to: REPLY_TO,
      subject: 'How to log in to the Powder Ridge HOA website',
      html: renderHtml(),
      text: renderText(),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body.id;
}

async function main() {
  console.log(`Resolving recipient list from Auth0 (excluding ${SKIP_ADMINS.size} admin emails)...`);
  const recipients = await fetchRecipients();
  console.log('');
  console.log(`Mode: ${LIVE_MODE ? 'LIVE' : 'DRY-RUN'}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`Reply-To: ${REPLY_TO}`);
  console.log(`Recipients: ${recipients.length}`);
  console.log('');
  for (const r of recipients) console.log('  ' + r.email);
  console.log('');

  if (!LIVE_MODE) {
    console.log('Dry-run only. Re-run with --live to send.');
    return;
  }

  let okCount = 0;
  let failCount = 0;
  for (let i = 0; i < recipients.length; i++) {
    const { email } = recipients[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${recipients.length}] ${email.padEnd(42)} ... `);
    try {
      const msgId = await sendEmail(email);
      console.log(`OK  (resend id ${msgId})`);
      okCount++;
      await sleep(SEND_DELAY_MS);
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failCount++;
    }
  }
  console.log('');
  console.log(`Done. ${okCount} sent, ${failCount} failed.`);
  process.exit(failCount === 0 ? 0 : 2);
}

main().catch((e) => { console.error(e); process.exit(1); });

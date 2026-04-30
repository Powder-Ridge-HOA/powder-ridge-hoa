#!/usr/bin/env node
// send-welcome.mjs
// ----------------------------------------------------------------------------
// Sends branded password-set / welcome emails to Powder Ridge HOA residents.
//
// Recipients are fetched live from Auth0 (Username-Password connection),
// minus the admin-only addresses below. Each recipient gets a one-time
// password-change ticket from the Auth0 Management API, embedded in the
// branded HTML template, delivered via Resend.
//
// USAGE:
//   node send-welcome.mjs              # dry-run: list who would receive
//   node send-welcome.mjs --test       # send only to TEST_EMAIL (eric@…)
//   node send-welcome.mjs --live       # send to every recipient
//
// REQUIRED ENV (auto-loaded from ../dashboard/.env then ../frontend/.env):
//   AUTH0_DOMAIN
//   RESEND_API_KEY
//   AUTH0_MGMT_CLIENT_ID + AUTH0_MGMT_CLIENT_SECRET   (M2M creds)
//   OR AUTH0_MGMT_TOKEN                                (24h dashboard token)
//
// OPTIONAL ENV:
//   TEST_EMAIL (default eric@ericphiferllc.com)
//   FROM_EMAIL (default 'Powder Ridge HOA <welcome@powderridgegrandmesa.com>')
//   REPLY_TO   (default powderridgesecretary@gmail.com)
//   REDIRECT_URL (default https://powderridgegrandmesa.com/directory)
// ----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';

// Load env from sibling .env files unless already set in shell.
// frontend/.env wins because the M2M app authorized for create:user_tickets
// (the scope this script needs) lives there. The dashboard's M2M is a
// different app with different scopes and would silently fail here.
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
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://powderridgegrandmesa.com/directory';
const TEST_EMAIL = process.env.TEST_EMAIL || 'eric@ericphiferllc.com';
const TICKET_TTL_SEC = 604800; // 7 days
const SEND_DELAY_MS = 700;     // ~1.4 rps; safely under Auth0 + Resend limits

// Admins we deliberately do NOT send a "set your password" email to.
// Google-OAuth admins have no password to set; the secretary account
// was just created and the President will be told in person; the
// generic prho admin email isn't a real user inbox.
const SKIP_ADMINS = new Set([
  'powderridgepresident@gmail.com',
  'powderridgesecretary@gmail.com',
  'prhoageneral@gmail.com',
]);

const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const LIVE_MODE = args.includes('--live');

const missing = [];
if (!AUTH0_DOMAIN) missing.push('AUTH0_DOMAIN');
if (!RESEND_API_KEY) missing.push('RESEND_API_KEY');
if (missing.length) {
  console.error(`Missing required env var(s): ${missing.join(', ')}`);
  process.exit(1);
}

// ---- Auth0 token ----------------------------------------------------------

// Prefer M2M client credentials (auto-refreshable) over a manually-pasted
// AUTH0_MGMT_TOKEN, which is typically a 24h dashboard token that expires
// silently and surfaces as 401 mid-run.
let mgmtToken = null;
async function getToken() {
  if (mgmtToken) return mgmtToken;
  const id = process.env.AUTH0_MGMT_CLIENT_ID;
  const secret = process.env.AUTH0_MGMT_CLIENT_SECRET;
  if (!id || !secret) {
    if (process.env.AUTH0_MGMT_TOKEN) {
      mgmtToken = process.env.AUTH0_MGMT_TOKEN;
      return mgmtToken;
    }
    throw new Error(
      'Need AUTH0_MGMT_CLIENT_ID + AUTH0_MGMT_CLIENT_SECRET (preferred), OR AUTH0_MGMT_TOKEN',
    );
  }
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
  if (!r.ok || !j.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(j)}`);
  }
  mgmtToken = j.access_token;
  return mgmtToken;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body, retries = 3) {
  const token = await getToken();
  await sleep(SEND_DELAY_MS);
  const r = await fetch(`https://${AUTH0_DOMAIN}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 429 && retries > 0) {
    const wait = Math.max(2000, Number(r.headers.get('x-ratelimit-reset')) * 1000 - Date.now() || 2000);
    await sleep(wait);
    return api(method, path, body, retries - 1);
  }
  const text = await r.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!r.ok) {
    throw new Error(`${method} ${path} → ${r.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

// ---- Recipient discovery --------------------------------------------------

async function fetchRecipients() {
  const recipients = [];
  let page = 0;
  while (true) {
    const u = `/api/v2/users?search_engine=v3&q=${encodeURIComponent('identities.connection:"Username-Password-Authentication"')}&per_page=100&page=${page}`;
    const batch = await api('GET', u);
    for (const u of batch) {
      const email = String(u.email || '').toLowerCase().trim();
      if (!email) continue;
      if (SKIP_ADMINS.has(email)) continue;
      recipients.push({ user_id: u.user_id, email });
    }
    if (batch.length < 100) break;
    page++;
    if (page > 10) break;
  }
  recipients.sort((a, b) => a.email.localeCompare(b.email));
  return recipients;
}

// ---- Ticket + email helpers ----------------------------------------------

async function createTicket(userId) {
  const body = await api('POST', '/api/v2/tickets/password-change', {
    user_id: userId,
    result_url: REDIRECT_URL,
    ttl_sec: TICKET_TTL_SEC,
    mark_email_as_verified: true,
  });
  return body.ticket;
}

function renderEmail(ticketUrl, ttlDays) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to Powder Ridge HOA</title>
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
              <h2 style="margin:0 0 16px; color:#111827; font-size:20px; font-weight:700;">Welcome!</h2>
              <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.6;">
                The Powder Ridge HOA has launched a new website, and an account has been created for you using this email address.
              </p>
              <p style="margin:0 0 28px; color:#374151; font-size:15px; line-height:1.6;">
                To set your password and access the resident directory, click the button below. Once your password is set, visit
                <a href="https://powderridgegrandmesa.com/directory" style="color:#016b37; text-decoration:underline;">powderridgegrandmesa.com/directory</a>
                and log in with your email and new password.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:8px; background-color:#016b37;">
                    <a href="${ticketUrl}" style="display:inline-block; padding:14px 32px; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; border-radius:8px; letter-spacing:0.3px;">Set your password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 8px; color:#6b7280; font-size:13px; line-height:1.5;">Button not working? Copy and paste this URL into your browser:</p>
              <p style="margin:0 0 24px; word-break:break-all; font-size:12px; color:#374151;">
                <a href="${ticketUrl}" style="color:#016b37; text-decoration:underline;">${ticketUrl}</a>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px; border-top:1px solid #e5e7eb;">
                <tr>
                  <td style="padding-top:20px; color:#6b7280; font-size:13px; line-height:1.6;">
                    This link expires in ${ttlDays} days. If it expires before you use it, reply to this email and the Secretary will resend a new one.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px; color:#6b7280; font-size:13px; line-height:1.6;">
                    Not expecting this email, or have questions? Reach out to <a href="mailto:powderridgesecretary@gmail.com" style="color:#016b37; text-decoration:underline;">powderridgesecretary@gmail.com</a>.
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

function renderPlainText(ticketUrl, ttlDays) {
  return [
    'Welcome to the new Powder Ridge HOA website.',
    '',
    'An account has been created for you. To set your password and access',
    'the resident directory, open the link below:',
    '',
    ticketUrl,
    '',
    'Once your password is set, log in at:',
    '  https://powderridgegrandmesa.com/directory',
    '',
    `This password-set link expires in ${ttlDays} days. If it expires before`,
    'you use it, reply to this email and the Secretary will resend.',
    '',
    'Questions? powderridgesecretary@gmail.com',
    '',
    '— Powder Ridge HOA',
    'P.O. Box 4574, Grand Junction, CO 81502',
  ].join('\n');
}

async function sendEmail(to, ticketUrl) {
  const ttlDays = Math.round(TICKET_TTL_SEC / 86400);
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
      subject: 'Welcome to the new Powder Ridge HOA website',
      html: renderEmail(ticketUrl, ttlDays),
      text: renderPlainText(ticketUrl, ttlDays),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body.id;
}

// ---- Main -----------------------------------------------------------------

async function main() {
  console.log(`Resolving recipient list from Auth0 (excluding ${SKIP_ADMINS.size} admin emails)...`);
  let recipients = await fetchRecipients();

  if (TEST_MODE) {
    recipients = recipients.filter((r) => r.email === TEST_EMAIL.toLowerCase());
    if (!recipients.length) {
      // Fall back to a synthetic record so --test still works pre-account
      const userId = (await api('GET', `/api/v2/users-by-email?email=${encodeURIComponent(TEST_EMAIL)}`))?.[0]?.user_id;
      if (!userId) {
        console.error(`TEST_EMAIL ${TEST_EMAIL} not found in Auth0.`);
        process.exit(1);
      }
      recipients = [{ user_id: userId, email: TEST_EMAIL }];
    }
  }

  const mode = TEST_MODE ? 'TEST' : LIVE_MODE ? 'LIVE' : 'DRY-RUN';
  console.log('');
  console.log(`Mode: ${mode}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`Reply-To: ${REPLY_TO}`);
  console.log(`Redirect URL after password set: ${REDIRECT_URL}`);
  console.log(`Recipients: ${recipients.length}`);
  console.log('');
  for (const r of recipients) console.log('  ' + r.email);
  console.log('');

  if (!TEST_MODE && !LIVE_MODE) {
    console.log('Dry-run only. Re-run with --live to send, or --test to send to TEST_EMAIL.');
    return;
  }

  let okCount = 0;
  let failCount = 0;
  for (let i = 0; i < recipients.length; i++) {
    const { user_id, email } = recipients[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${recipients.length}] ${email.padEnd(42)} ... `);
    try {
      const ticket = await createTicket(user_id);
      const msgId = await sendEmail(email, ticket);
      console.log(`OK  (resend id ${msgId})`);
      okCount++;
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

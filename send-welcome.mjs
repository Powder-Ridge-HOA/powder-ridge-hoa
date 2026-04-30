#!/usr/bin/env node
// send-welcome.mjs
// ----------------------------------------------------------------------------
// Sends branded password-set / welcome emails to Powder Ridge HOA residents.
//
// Uses the Auth0 Management API to create one-time password-change tickets
// (no Auth0 email sent), then delivers a branded email via Resend with the
// ticket URL embedded. Sidesteps the Auth0 Free-tier email template lockout.
//
// Usage:
//   AUTH0_DOMAIN=dev-re6yi2zl62edxojz.us.auth0.com \
//   AUTH0_MGMT_TOKEN=<24h-token-from-Auth0-API-Explorer> \
//   RESEND_API_KEY=<your-resend-api-key> \
//   node send-welcome.mjs --test
//
//   # then, if test looked good:
//   AUTH0_DOMAIN=... AUTH0_MGMT_TOKEN=... RESEND_API_KEY=... \
//   node send-welcome.mjs --live
//
// Optional env overrides:
//   FROM_EMAIL     sender (default: "Powder Ridge HOA <welcome@powderridgegrandmesa.com>")
//   REPLY_TO       reply-to (default: "powderridgesecretary@gmail.com")
//   REDIRECT_URL   where residents land after setting password
//                  (default: "https://powderridgegrandmesa.com/directory")
//   TEST_EMAIL     email used by --test mode (default: "eric@ericphiferllc.com")
//
// Node 18+ required (uses global fetch). No npm install needed.
// ----------------------------------------------------------------------------

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_MGMT_TOKEN = process.env.AUTH0_MGMT_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Powder Ridge HOA <welcome@powderridgegrandmesa.com>';
const REPLY_TO = process.env.REPLY_TO || 'powderridgesecretary@gmail.com';
const REDIRECT_URL = process.env.REDIRECT_URL || 'https://powderridgegrandmesa.com/directory';
const TEST_EMAIL = process.env.TEST_EMAIL || 'eric@ericphiferllc.com';
const TICKET_TTL_SEC = 604800; // 7 days
const SEND_DELAY_MS = 600;     // 1.6 rps, safely under Auth0 + Resend limits

const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const LIVE_MODE = args.includes('--live');

const missing = [];
if (!AUTH0_DOMAIN) missing.push('AUTH0_DOMAIN');
if (!AUTH0_MGMT_TOKEN) missing.push('AUTH0_MGMT_TOKEN');
if (!RESEND_API_KEY) missing.push('RESEND_API_KEY');
if (missing.length) {
  console.error(`Missing required env var(s): ${missing.join(', ')}`);
  process.exit(1);
}
if (!TEST_MODE && !LIVE_MODE) {
  console.error('Specify --test (sends only to TEST_EMAIL) or --live (sends to all residents).');
  process.exit(1);
}

// Whitelist deduped + lowercased. eric@ericphiferllc.com used as the default
// TEST_EMAIL and also included here so --live covers every Auth0 account.
const EMAILS = [
  'frontdesk@huffco.com',
  'andrewwarrenfoster@gmail.com',
  'dinopeds@aol.com',
  'ivie_shelli@hotmail.com',
  'fotus@aol.com',
  'wood.76@gmail.com',
  'meagan.mccormick@gmail.com',
  'dhoops2004@yahoo.com',
  'brekke@tds.net',
  'j.lummis@me.com',
  'yellowquail@gmail.com',
  'jasonacastor@gmail.com',
  'soderberg777@gmail.com',
  'cesanderson81@gmail.com',
  'kate.morlan@gmail.com',
  'lucylarson8@gmail.com',
  'peggypat56@gmail.com',
  'merrileeclaverie@gmail.com',
  'parenteaurealtor@gmail.com',
  'pbhoops353@gmail.com',
  'triciacroman@msn.com',
  'jeremysanderson@live.com',
  'shay.boe@gmail.com',
  'rjprins@aol.com',
  'lowinemaker@gmail.com',
  'erica@rpm2017.com',
  'kenapplebee@yahoo.com',
  'csitomlee@aol.com',
  'haleaah@bresnan.net',
  'tysonblack@live.com',
  'popparch@aol.com',
  'laurenbrowni3@yahoo.com',
  'zg@flatirondevelopmentco.com',
  'eric@ericphiferllc.com',
  'prhoageneral@gmail.com',
  'romanfamilydc@yahoo.com',
];

// ---- Auth0 API ------------------------------------------------------------

async function getUserIdByEmail(email) {
  const url = `https://${AUTH0_DOMAIN}/api/v2/users-by-email?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${AUTH0_MGMT_TOKEN}` } });
  if (!res.ok) throw new Error(`users-by-email ${res.status}: ${await res.text()}`);
  const users = await res.json();
  if (!users.length) return null;
  // Prefer a Username-Password user if multiple identities exist for the email.
  const preferred = users.find((u) =>
    (u.identities || []).some((i) => i.connection === 'Username-Password-Authentication'),
  );
  return (preferred || users[0]).user_id;
}

async function createPasswordChangeTicket(userId) {
  const res = await fetch(`https://${AUTH0_DOMAIN}/api/v2/tickets/password-change`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTH0_MGMT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      result_url: REDIRECT_URL,
      ttl_sec: TICKET_TTL_SEC,
      mark_email_as_verified: true,
    }),
  });
  if (!res.ok) throw new Error(`password-change ticket ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body.ticket;
}

// ---- Email template --------------------------------------------------------

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
                To set your password and access the resident directory, click the button below.
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
    `This link expires in ${ttlDays} days. If it expires before you use it,`,
    'reply to this email and the Secretary will resend a new one.',
    '',
    'Questions? powderridgesecretary@gmail.com',
    '',
    '— Powder Ridge HOA',
    'P.O. Box 4574, Grand Junction, CO 81502',
  ].join('\n');
}

// ---- Resend ---------------------------------------------------------------

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

const targets = TEST_MODE ? [TEST_EMAIL] : EMAILS;
const mode = TEST_MODE ? 'TEST' : 'LIVE';

console.log(`Mode: ${mode}`);
console.log(`From: ${FROM_EMAIL}`);
console.log(`Redirect URL: ${REDIRECT_URL}`);
console.log(`Recipients: ${targets.length}`);
console.log('');

let okCount = 0;
let failCount = 0;

for (let i = 0; i < targets.length; i++) {
  const email = targets[i];
  process.stdout.write(`[${String(i + 1).padStart(2)}/${targets.length}] ${email.padEnd(42)} ... `);
  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) {
      console.log('SKIP (no Auth0 user with this email)');
      failCount++;
      continue;
    }
    const ticket = await createPasswordChangeTicket(userId);
    const msgId = await sendEmail(email, ticket);
    console.log(`OK  (resend id ${msgId})`);
    okCount++;
  } catch (err) {
    console.log(`FAIL: ${err.message}`);
    failCount++;
  }
  if (i < targets.length - 1) await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
}

console.log('');
console.log(`Done. ${okCount} sent, ${failCount} failed.`);
process.exit(failCount === 0 ? 0 : 2);

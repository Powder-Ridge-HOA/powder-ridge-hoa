import type { Context } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'powderridgesecretary@gmail.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

const SANITY_PROJECT_ID = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = process.env.VITE_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2024-01-01';

// Maps each "Who are you contacting?" dropdown value to a GROQ expression that
// resolves the destination email from Sanity, so the board can manage routing
// from Studio. Keyed by the exact dropdown value; the `recipient` string is
// never interpolated into a query — only these fixed, trusted expressions are
// ever sent — so there is no query-injection surface. Anything not in this map
// (or an empty/failed lookup) falls back to TO_EMAIL (the secretary).
const RECIPIENT_EMAIL_QUERIES: Record<string, string> = {
  President: `*[_type == "boardMember" && position == "President"][0].email`,
  'Vice President': `*[_type == "boardMember" && position == "Vice President"][0].email`,
  Secretary: `*[_type == "boardMember" && position match "*Secretary*"][0].email`,
  Treasurer: `*[_type == "boardMember" && position match "*Treasurer*"][0].email`,
  'Design Review Committee': `*[_type == "committee" && name match "Architectural*"][0].email`,
};

// Look up the destination email for the chosen recipient in Sanity, falling back
// to the secretary address on any miss so a message is never silently dropped.
async function resolveRecipientEmail(recipient: string): Promise<string> {
  const expr = RECIPIENT_EMAIL_QUERIES[recipient];
  if (!expr || !SANITY_PROJECT_ID) return TO_EMAIL;
  try {
    const url = new URL(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`);
    url.searchParams.set('query', expr);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error('[send-message] Sanity recipient lookup failed:', res.status);
      return TO_EMAIL;
    }
    const json = await res.json();
    const email = typeof json.result === 'string' ? json.result.trim() : '';
    return email || TO_EMAIL;
  } catch (err) {
    console.error('[send-message] Sanity recipient lookup error:', err);
    return TO_EMAIL;
  }
}

export default async (req: Request, _context: Context) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { name, email, subject, recipient, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !recipient || !message) {
      return new Response(JSON.stringify({ error: 'Name, email, subject, recipient, and message are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const toEmail = await resolveRecipientEmail(recipient);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      replyTo: email,
      subject: `[${recipient}] ${subject} — from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0e7490; margin-bottom: 24px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top; width: 180px;">Name</td>
              <td style="padding: 8px 12px; color: #1f2937;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top;">Email</td>
              <td style="padding: 8px 12px; color: #1f2937;"><a href="mailto:${escapeHtml(email)}" style="color: #0e7490;">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top;">Subject</td>
              <td style="padding: 8px 12px; color: #1f2937;">${escapeHtml(subject)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top;">Who are you contacting?</td>
              <td style="padding: 8px 12px; color: #1f2937;">${escapeHtml(recipient)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #4b5563; vertical-align: top;">Message</td>
              <td style="padding: 8px 12px; color: #1f2937; white-space: pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Sent from the contact form on ##CLIENT_DOMAIN##</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send message error:', err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

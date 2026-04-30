import type { Context } from '@netlify/functions';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const ROLES_CLAIM = process.env.AUTH0_ROLES_CLAIM || 'https://pws.app/roles';
const REQUIRED_ROLE = process.env.AUTH0_ROLE_NAME || 'Resident';
const SANITY_PROJECT_ID = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = process.env.VITE_SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2024-01-01';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!AUTH0_DOMAIN) throw new Error('AUTH0_DOMAIN not configured');
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
  }
  return jwks;
}

export default async (req: Request, _context: Context) => {
  try {
    // Diagnostic: print which env vars the function runtime sees. Shows in
    // the `netlify dev` terminal and in the Netlify Functions live log.
    console.log('[residents] env check', {
      AUTH0_DOMAIN: !!AUTH0_DOMAIN,
      AUTH0_AUDIENCE: !!AUTH0_AUDIENCE,
      rolesClaim: ROLES_CLAIM,
      requiredRole: REQUIRED_ROLE,
      SANITY_PROJECT_ID: !!SANITY_PROJECT_ID,
      SANITY_DATASET,
      authPrefixed: Object.keys(process.env).filter((k) => k.startsWith('AUTH0_') || k.startsWith('VITE_AUTH0_')),
      sanityPrefixed: Object.keys(process.env).filter((k) => k.includes('SANITY')),
    });

    if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

    if (!AUTH0_DOMAIN) {
      return jsonResponse({ error: 'AUTH0_DOMAIN env var is not set on the server' }, 500);
    }
    if (!AUTH0_AUDIENCE) {
      return jsonResponse({ error: 'AUTH0_AUDIENCE env var is not set on the server' }, 500);
    }
    if (!SANITY_PROJECT_ID) {
      return jsonResponse({ error: 'VITE_SANITY_PROJECT_ID / SANITY_PROJECT_ID env var is not set on the server' }, 500);
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
    if (!token) return jsonResponse({ error: 'Missing bearer token' }, 401);

    let payload: Record<string, unknown>;
    try {
      const result = await jwtVerify(token, getJwks(), {
        issuer: `https://${AUTH0_DOMAIN}/`,
        audience: AUTH0_AUDIENCE,
      });
      payload = result.payload as Record<string, unknown>;
    } catch (verifyErr) {
      console.error('[residents] JWT verify failed:', verifyErr);
      return jsonResponse({ error: `Invalid token: ${verifyErr instanceof Error ? verifyErr.message : 'unknown'}` }, 401);
    }

    const roles = payload[ROLES_CLAIM];
    if (!Array.isArray(roles) || !roles.includes(REQUIRED_ROLE)) {
      return jsonResponse({ error: `Missing required role "${REQUIRED_ROLE}" in claim "${ROLES_CLAIM}"` }, 403);
    }

    const query = `*[_type == "resident"] | order(lastname asc){
      _id, firstname, lastname, nickname, address, email, phone, organization,
      "additionalContacts": additionalContacts[]{ name, email, phone }
    }`;
    const url = new URL(`https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`);
    url.searchParams.set('query', query);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[residents] Sanity query failed:', res.status, text);
      return jsonResponse({ error: `Sanity query failed: ${res.status}` }, 502);
    }
    const json = await res.json();
    return jsonResponse({ residents: json.result || [] });
  } catch (err) {
    // Top-level safety net so we never return an empty 500.
    console.error('[residents] Unhandled error:', err);
    return jsonResponse({ error: `Unhandled error: ${err instanceof Error ? err.message : String(err)}` }, 500);
  }
};

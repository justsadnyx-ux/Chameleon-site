/**
 * Chameleon Key API Worker
 * Handles key generation and validation for the executor-style key system
 */

const SECRET = 'cham_v3_dark';
const KEY_TTL = 3 * 24 * 60 * 60 * 1000; // 3 days

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

function generateKey(hwid) {
  const input = hwid + '::' + SECRET;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (31 * hash + input.charCodeAt(i)) | 0;
  }
  const num = Math.abs(hash);
  const base = String(num % 1000000000000).padStart(12, '0');
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += parseInt(base[i]);
  const check = String.fromCharCode(65 + (sum % 26));
  return base.slice(0, 4) + '-' + base.slice(4, 8) + '-' + base.slice(8, 12) + check;
}

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST to /api/key
    if (request.method !== 'POST' || !request.url.includes('/api/key')) {
      return new Response(JSON.stringify({ success: false, error: 'not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const hwid = body.hwid;

      if (!hwid || typeof hwid !== 'string' || hwid.length < 4) {
        return new Response(JSON.stringify({ success: false, error: 'invalid hwid' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Generate key
      const key = generateKey(hwid);

      // Return key with metadata
      return new Response(JSON.stringify({
        success: true,
        key: key,
        expires_in: 3 * 24 * 60 * 60, // seconds
        format: 'XXXX-XXXX-XXXXL'
      }), {
        status: 200,
        headers: corsHeaders
      });

    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'server error' }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
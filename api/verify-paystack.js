// api/verify-paystack.js
export default async function handler(req, res) {
  // CORS - tighten later for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'failed', message: 'Method not allowed' });

  try {
    // Parse body (works with Vercel / raw body fallback)
    const body = req.body && Object.keys(req.body).length ? req.body : await bufferToJson(req);
    const { reference, cart: fallbackCart } = body || {};

    if (!reference) return res.status(400).json({ status: 'failed', message: 'Missing reference in request' });

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET not set in env');
      return res.status(500).json({ status: 'failed', message: 'Server not configured' });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    const verifyJson = await verifyRes.json();

    if (!verifyJson || verifyJson.status !== true || !verifyJson.data) {
      console.error('Paystack verify bad response', verifyJson);
      return res.status(400).json({ status: 'failed', message: 'Paystack verification returned non-success', detail: verifyJson });
    }

    const tx = verifyJson.data;
    if (tx.status !== 'success') {
      console.warn('Transaction status not success', tx.status);
      return res.status(400).json({ status: 'failed', message: 'Transaction not successful', txStatus: tx.status });
    }

    // Extract cart from metadata robustly
    let cart = [];
    try {
      if (tx.metadata) {
        // 1) If metadata.cart exists (stringified or array)
        if (tx.metadata.cart) {
          cart = Array.isArray(tx.metadata.cart) ? tx.metadata.cart : JSON.parse(tx.metadata.cart || '[]');
        } else if (Array.isArray(tx.metadata.custom_fields)) {
          // 2) If metadata.custom_fields is present (Paystack inline sets custom_fields)
          const cf = tx.metadata.custom_fields.find(f =>
            (f.variable_name && String(f.variable_name).toLowerCase() === 'cart')
            || (f.display_name && String(f.display_name).toLowerCase().includes('cart'))
          );
          if (cf && cf.value) {
            cart = Array.isArray(cf.value) ? cf.value : JSON.parse(cf.value || '[]');
          }
        }
      }
    } catch (err) {
      console.warn('Error parsing metadata cart/custom_fields', err);
      cart = [];
    }

    let usedFallback = false;
    // If metadata didn't contain cart, use fallback cart supplied in POST (debug only)
    if ((!cart || cart.length === 0) && Array.isArray(fallbackCart) && fallbackCart.length) {
      usedFallback = true;
      cart = fallbackCart;
      console.warn('Using fallback cart from POST body (less secure).');
    }

    // Compute expected amount (kobo)
    const computedKobo = Math.round((cart || []).reduce((s, it) => {
      const p = parseFloat(it.price || 0) || 0;
      const q = parseInt(it.qty || 1, 10) || 1;
      return s + (p * q * 100);
    }, 0));

    // Compare with Paystack's amount (tx.amount is in kobo)
    if (Number(tx.amount) !== computedKobo) {
      console.warn('Amount mismatch', { txAmount: tx.amount, computedKobo, usedFallback, cart });
      return res.status(400).json({
        status: 'failed',
        reason: 'amount_mismatch',
        message: 'Amount paid does not match expected amount from cart',
        details: { txAmount: tx.amount, expected: computedKobo, usedFallback, cart }
      });
    }

    // Map item ids to file urls — replace with your real file URLs
    const itemFiles = {
      'marriage-honorable': [
        'https://drive.google.com/uc?export=download&id=1TerxB66O3f1zk4FrWSMyUJ2zIArkMQoF'
      ],
      // add other product id -> [fileUrl] entries here
    };

    // Build files list
    const files = [];
    (cart || []).forEach(it => {
      const id = it.id || it.productId || it.sku || (it.title && String(it.title).replace(/\s+/g,'-').toLowerCase());
      if (!id) return;
      const mapped = itemFiles[id];
      if (mapped && Array.isArray(mapped)) {
        mapped.forEach(url => { if (!files.includes(url)) files.push(url); });
      }
    });

    // If no files matched, return empty list (or change to error if preferred)
    if (!files.length) {
      console.warn('No files mapped for cart items', cart);
      return res.json({ status: 'success', files: [] });
    }

    // Success — return file URLs
    return res.json({ status: 'success', files });

  } catch (err) {
    console.error('verify-paystack error', err);
    return res.status(500).json({ status: 'failed', message: 'Server error', error: err.message });
  }
}

// Helper to parse raw request body if req.body missing
async function bufferToJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const s = Buffer.concat(chunks).toString('utf8') || '{}';
  try { return JSON.parse(s); } catch(e) { return {}; }
}

// api/verify-paystack.js
// Vercel serverless function to verify Paystack transaction and return file URLs.
//
// Deploy: push to Vercel (or use vercel CLI). Set PAYSTACK_SECRET in Vercel dashboard.
// Note: Replace the itemFiles mapping with your real file URLs (Google Drive uc links or signed URLs).

export default async function handler(req, res) {
  // Basic CORS handling (allow all origins — change for production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await bufferToString(req));
    const { reference } = body || {};

    if (!reference) {
      return res.status(400).json({ status: 'failed', message: 'Missing reference' });
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
    if (!PAYSTACK_SECRET) {
      console.error('Missing PAYSTACK_SECRET env var.');
      return res.status(500).json({ status: 'failed', message: 'Server not configured' });
    }

    // call Paystack verify endpoint
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    const verifyJson = await verifyRes.json();

    if (!verifyJson || verifyJson.status !== true || !verifyJson.data) {
      console.warn('Paystack verify returned unexpected:', verifyJson);
      return res.status(400).json({ status: 'failed', message: 'Paystack verification failed', detail: verifyJson });
    }

    const tx = verifyJson.data;

    // ensure the transaction succeeded
    if (tx.status !== 'success') {
      return res.status(400).json({ status: 'failed', message: 'Transaction not successful', txStatus: tx.status });
    }

    // Parse cart from metadata (we expect client to send cart in metadata when opening Paystack)
    let cart = [];
    try {
      if (tx.metadata && tx.metadata.cart) {
        cart = Array.isArray(tx.metadata.cart) ? tx.metadata.cart : JSON.parse(tx.metadata.cart);
      }
    } catch (err) {
      console.warn('Error parsing metadata.cart', err);
      cart = [];
    }

    // Validate amount: Paystack returns amount in kobo (Naira * 100)
    // Compute expected amount from cart (use price * qty)
    const computedKobo = Math.round((cart || []).reduce((s, it) => {
      const p = parseFloat(it.price || 0) || 0;
      const q = parseInt(it.qty || 1, 10) || 1;
      return s + (p * q * 100);
    }, 0));

    // tx.amount is number in kobo
    if (Number(tx.amount) !== computedKobo) {
      console.warn('Amount mismatch', { txAmount: tx.amount, computedKobo });
      return res.status(400).json({ status: 'failed', reason: 'amount_mismatch', expected: computedKobo, received: tx.amount });
    }

    // Map purchased item ids to file URLs.
    // Replace the below mapping values with your actual hosted file URLs (Google Drive uc?export=download&id=...)
    const itemFiles = {
      'marriage-honorable': [
        "https://drive.google.com/uc?export=download&id=1TerxB66O3f1zk4FrWSMyUJ2zIArkMQoF",
        // optionally return multiple formats e.g. epub/mobi:
        // 'https://drive.google.com/uc?export=download&id=FILE_ID_EPUB',
      ],
    //   'becoming-balanced-man': [
    //     'https://drive.google.com/uc?export=download&id=FILE_ID_PDF_2'
    //   ],
    //   'accepting-responsibilities': [
    //     'https://drive.google.com/uc?export=download&id=FILE_ID_PDF_3'
    //   ]
      // add all your product id -> [fileUrls] mappings
    };

    // Build files array based on cart items (dedupe)
    const files = [];
    (cart || []).forEach(it => {
      const id = it.id || it.productId || it.sku;
      if (!id) return;
      const mapped = itemFiles[id];
      if (mapped && Array.isArray(mapped)) {
        mapped.forEach(url => {
          if (!files.includes(url)) files.push(url);
        });
      }
    });

    // If nothing matched, optionally return a default file list or an error
    if (!files.length) {
      console.warn('No files mapped for cart items', cart);
      // You can return 200 with empty files and handle on client; here we return 200 but with empty files
      return res.json({ status: 'success', files: [] });
    }

    // OPTIONAL: you could generate short-lived signed URLs here instead of returning direct links.
    // For now we return the mapped URLs (Google Drive uc links or direct storage links)
    return res.json({ status: 'success', files });

  } catch (err) {
    console.error('verify-paystack error', err);
    return res.status(500).json({ status: 'failed', message: 'Server error' });
  }
}

// small helper to read raw body if req.body is empty (Vercel sometimes provides parsed body)
async function bufferToString(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

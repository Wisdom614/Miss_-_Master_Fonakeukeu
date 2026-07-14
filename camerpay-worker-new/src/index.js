/**
 * CamerPay Payment Worker - Using Firebase REST API
 * No Node.js dependencies required - works in Cloudflare Workers
 */

// ============================================================
// CORS CONFIGURATION
// ============================================================
const allowedOrigins = [
  'https://vote.wisedev.online',
  'https://miss-master-fonakeukeu.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return allowedOrigins.includes(origin) ? origin : 'https://vote.wisedev.online';
}

// ============================================================
// FIREBASE REST API HELPERS
// ============================================================
function getFirebaseUrl(path) {
  const projectId = 'miss-master-vote';
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

async function firestoreGet(path) {
  const url = getFirebaseUrl(path);
  const response = await fetch(url);
  if (!response.ok) return null;
  return await response.json();
}

async function firestoreSet(path, data) {
  const url = getFirebaseUrl(path);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: convertToFirestoreFields(data)
    })
  });
  return response.ok;
}

async function firestoreUpdate(path, data) {
  const url = getFirebaseUrl(path);
  const fields = convertToFirestoreFields(data);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  return response.ok;
}

function convertToFirestoreFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: v })) } };
    } else if (value === null) {
      fields[key] = { nullValue: null };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return fields;
}

async function firestoreIncrement(path, field, amount) {
  // For increment, we need to use a transaction via REST
  // Simpler: read, update, write back
  const doc = await firestoreGet(path);
  if (!doc) return false;
  
  const currentValue = parseInt(doc.fields?.[field]?.integerValue || 0);
  const newValue = currentValue + amount;
  
  return firestoreUpdate(path, { [field]: newValue });
}

// ============================================================
// MAIN FETCH HANDLER
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const allowedOrigin = getAllowedOrigin(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response;
      
      if (path === '/create-payment' && request.method === 'POST') {
        response = await handleCreatePayment(request, env);
      } else if (path === '/webhook/camerpay' && request.method === 'POST') {
        response = await handleCamerPayWebhook(request, env);
      } else if (path === '/check-payment' && request.method === 'GET') {
        response = await handleCheckPayment(request);
      } else if (path === '/health') {
        response = new Response(JSON.stringify({ 
          status: 'ok', 
          platform: 'camerpay',
          timestamp: new Date().toISOString() 
        }), {});
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
        });
      }
      
      // Add CORS headers
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      responseHeaders.set('Access-Control-Max-Age', '86400');
      
      if (!responseHeaders.has('Content-Type')) {
        responseHeaders.set('Content-Type', 'application/json');
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

// ============================================================
// HANDLE: CHECK PAYMENT STATUS
// ============================================================
async function handleCheckPayment(request) {
  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get('invoiceId');
    
    if (!invoiceId) {
      return new Response(JSON.stringify({ 
        error: 'Missing invoiceId parameter' 
      }), { status: 400 });
    }

    console.log(`🔍 Checking payment status for: ${invoiceId}`);

    // Check in transactions using REST API
    const transactionData = await firestoreGet(`transactions/${invoiceId}`);
    
    if (transactionData && transactionData.fields) {
      const data = {};
      for (const [key, value] of Object.entries(transactionData.fields)) {
        if (value.stringValue !== undefined) data[key] = value.stringValue;
        else if (value.integerValue !== undefined) data[key] = value.integerValue;
        else if (value.booleanValue !== undefined) data[key] = value.booleanValue;
        else if (value.timestampValue !== undefined) data[key] = value.timestampValue;
      }
      console.log(`📋 Transaction found: ${data.status}`);
      return new Response(JSON.stringify({
        success: true,
        invoiceId: invoiceId,
        status: data.status || 'UNKNOWN',
        data: data,
      }));
    }

    // Check pending_votes as fallback
    const pendingData = await firestoreGet(`pending_votes/${invoiceId}`);
    
    if (pendingData && pendingData.fields) {
      const data = {};
      for (const [key, value] of Object.entries(pendingData.fields)) {
        if (value.stringValue !== undefined) data[key] = value.stringValue;
        else if (value.integerValue !== undefined) data[key] = value.integerValue;
        else if (value.booleanValue !== undefined) data[key] = value.booleanValue;
        else if (value.timestampValue !== undefined) data[key] = value.timestampValue;
      }
      console.log(`📋 Pending vote found: ${data.status}`);
      return new Response(JSON.stringify({
        success: true,
        invoiceId: invoiceId,
        status: data.status || 'UNKNOWN',
        data: data,
      }));
    }

    console.log(`❌ Transaction ${invoiceId} not found`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Transaction not found',
      invoiceId: invoiceId,
    }), { status: 404 });

  } catch (error) {
    console.error('❌ Check payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check payment status',
      message: error.message 
    }), { status: 500 });
  }
}

// ============================================================
// HANDLE: CREATE PAYMENT LINK
// ============================================================
async function handleCreatePayment(request, env) {
  try {
    const body = await request.json();
    const { 
      amount, 
      candidateId, 
      candidateName, 
      votes, 
      email, 
      phone 
    } = body;

    console.log('📝 Creating payment link:', { 
      amount, 
      candidateId, 
      candidateName, 
      votes,
      phone 
    });

    if (!amount || !candidateId || !votes) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: amount, candidateId, votes' 
      }), { status: 400 });
    }

    // Generate unique invoice ID
    const invoiceId = `VOTE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const customerPhone = phone || '699123456';

    // ============================================================
    // STORE TRANSACTION IN FIRESTORE (REST API)
    // ============================================================
    await firestoreSet(`transactions/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: amount,
      email: email || 'anonymous@voter.com',
      phone: customerPhone,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Also store in pending_votes for backup
    await firestoreSet(`pending_votes/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: amount,
      email: email || 'anonymous@voter.com',
      phone: customerPhone,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Stored pending transaction: ${invoiceId}`);

    // ============================================================
    // GET CAMERPAY TOKEN FROM ENVIRONMENT
    // ============================================================
    const token = env.CAMERPAY_TOKEN;
    if (!token) {
      console.error('❌ CamerPay token not configured');
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured',
        message: 'CamerPay token is missing'
      }), { status: 500 });
    }

    // ============================================================
    // CREATE PAYMENT LINK VIA CAMERPAY API
    // ============================================================
    const paymentData = {
      amount: amount,
      currency: 'XAF',
      customer_phone: customerPhone,
      merchant_invoice_id: invoiceId,
      merchant_callback_url: 'https://camerpay-worker.missmaster.workers.dev/webhook/camerpay',
      merchant_return_url: 'https://vote.wisedev.online/payment-result',
      source: 'api',
      description: `Vote for ${candidateName} (${votes} votes)`,
      metadata: {
        candidateId: candidateId,
        candidateName: candidateName,
        votes: votes,
        email: email || 'anonymous@voter.com',
        phone: customerPhone,
      },
    };

    console.log('📤 Sending to CamerPay:', JSON.stringify(paymentData, null, 2));

    const response = await fetch('https://camerpay.biz/api/payment/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 CamerPay response status:', response.status);
    console.log('📥 CamerPay response body:', responseText);

    if (!response.ok) {
      console.error('❌ CamerPay API error:', response.status, responseText);
      
      // Update transaction with error
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: 'ERROR',
        error: responseText,
        updatedAt: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ 
        error: 'CamerPay API error', 
        message: responseText,
        status: response.status
      }), { status: response.status || 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response:', responseText);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from payment service' 
      }), { status: 500 });
    }

    console.log('✅ CamerPay success response:', data);

    const paymentUrl = data.pay_url || data.redirect_url || data.url;
    
    if (!paymentUrl) {
      console.error('❌ No payment URL in response:', data);
      return new Response(JSON.stringify({ 
        error: 'No payment URL in response',
        details: data
      }), { status: 500 });
    }

    console.log(`✅ Payment URL: ${paymentUrl}`);

    // Update transaction with payment URL
    await firestoreUpdate(`transactions/${invoiceId}`, {
      paymentUrl: paymentUrl,
      transactionId: data.transaction_uuid || data.id,
      updatedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceId,
      paymentUrl: paymentUrl,
      transactionId: data.transaction_uuid || data.id || data.transaction_id,
    }));

  } catch (error) {
    console.error('❌ Create payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create payment link', 
      message: error.message,
      stack: error.stack
    }), { status: 500 });
  }
}

// ============================================================
// HANDLE: WEBHOOK (Complete fix)
// ============================================================
async function handleCamerPayWebhook(request, env) {
  try {
    const rawBody = await request.text();
    console.log('🔔 WEBHOOK RECEIVED');
    console.log('Raw body:', rawBody);
    
    // Parse form-urlencoded body (CamerPay sends webhooks as form data)
    const params = new URLSearchParams(rawBody);
    const webhookData = {};
    for (const [key, value] of params) {
      webhookData[key] = value;
    }
    console.log('Parsed webhook data:', JSON.stringify(webhookData, null, 2));

    // Check if this is a test webhook
    const isTest = webhookData.test === '1' || webhookData.uuid?.startsWith('TEST-');
    
    if (isTest) {
      console.log('🔧 Test webhook - returning success');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Test webhook received successfully',
        test: true
      }), { status: 200 });
    }

    // ============================================================
    // IMPORTANT: Extract webhook data (CamerPay uses specific field names)
    // ============================================================
    const {
      uuid,                    // CamerPay's transaction UUID
      invoice_id,              // Your merchant_invoice_id
      merchant_invoice_id,     // Alternative field name
      status,                  // Status of the transaction
      amount,                  // Amount paid
      failure_reason,          // Why it failed (if applicable)
      failure_code,            // Error code (if applicable)
      is_sandbox,              // Sandbox flag
      metadata,                // Your metadata from the payment
    } = webhookData;

    // Use the correct invoice_id field (CamerPay uses merchant_invoice_id or invoice_id)
    const invoiceId = invoice_id || merchant_invoice_id;
    
    console.log('📋 Processing webhook for invoice:', invoiceId);
    console.log('📋 Status:', status);
    console.log('📋 Amount:', amount);
    console.log('📋 UUID:', uuid);

    // ============================================================
    // PROCESS PENDING STATUS
    // ============================================================
    if (status === 'pending' || status === 'processing') {
      console.log(`⏳ Payment ${invoiceId} is ${status}`);
      
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: status.toUpperCase(),
        webhookData: JSON.stringify(webhookData),
        updatedAt: new Date().toISOString(),
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Pending webhook received' 
      }), { status: 200 });
    }

    // ============================================================
    // PROCESS COMPLETED STATUS - THIS IS WHAT WE NEED
    // ============================================================
    if (status === 'completed' || status === 'confirmed' || status === 'paid') {
      console.log(`✅ Payment ${invoiceId} completed!`);
      
      // Get transaction from Firestore
      let transactionData = await firestoreGet(`transactions/${invoiceId}`);
      let transactionFields = null;
      
      if (transactionData && transactionData.fields) {
        transactionFields = {};
        for (const [key, value] of Object.entries(transactionData.fields)) {
          if (value.stringValue !== undefined) transactionFields[key] = value.stringValue;
          else if (value.integerValue !== undefined) transactionFields[key] = value.integerValue;
          else if (value.booleanValue !== undefined) transactionFields[key] = value.booleanValue;
          else if (value.timestampValue !== undefined) transactionFields[key] = value.timestampValue;
        }
      }
      
      // If not found in transactions, check pending_votes
      if (!transactionFields) {
        console.log('🔍 Checking pending_votes...');
        const pendingData = await firestoreGet(`pending_votes/${invoiceId}`);
        if (pendingData && pendingData.fields) {
          transactionFields = {};
          for (const [key, value] of Object.entries(pendingData.fields)) {
            if (value.stringValue !== undefined) transactionFields[key] = value.stringValue;
            else if (value.integerValue !== undefined) transactionFields[key] = value.integerValue;
            else if (value.booleanValue !== undefined) transactionFields[key] = value.booleanValue;
            else if (value.timestampValue !== undefined) transactionFields[key] = value.timestampValue;
          }
          console.log('📋 Found transaction in pending_votes');
        }
      }
      
      if (!transactionFields) {
        console.error(`❌ Transaction ${invoiceId} not found in database`);
        
        // Store for manual review
        await firestoreSet(`webhook_review/${invoiceId || uuid}`, {
          invoiceId: invoiceId || uuid,
          webhookData: JSON.stringify(webhookData),
          status: 'PENDING_REVIEW',
          reason: 'Transaction not found',
          receivedAt: new Date().toISOString(),
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Webhook received but transaction not found - stored for review',
          requiresReview: true
        }), { status: 200 });
      }

      // Extract candidate and vote info
      const candidateId = transactionFields.candidateId || webhookData.candidateId;
      const votes = parseInt(transactionFields.votes) || 1;
      const amountValue = parseFloat(amount) || parseFloat(transactionFields.amount) || 0;

      console.log('📊 Candidate ID:', candidateId);
      console.log('📊 Votes to add:', votes);

      if (!candidateId) {
        console.error(`❌ No candidateId found for transaction ${invoiceId}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing candidateId' 
        }), { status: 404 });
      }

      // ============================================================
      // ADD VOTES TO CANDIDATE
      // ============================================================
      console.log(`🔍 Looking up candidate: ${candidateId}`);
      const candidateData = await firestoreGet(`candidates/${candidateId}`);
      let currentVotes = 0;
      
      if (candidateData && candidateData.fields) {
        currentVotes = parseInt(candidateData.fields.votes?.integerValue || 0);
        console.log(`📊 Current votes for candidate: ${currentVotes}`);
      } else {
        console.error(`❌ Candidate ${candidateId} not found in Firestore`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Candidate not found' 
        }), { status: 404 });
      }
      
      const newVoteCount = currentVotes + votes;
      console.log(`📊 New vote count: ${newVoteCount}`);
      
      // Update candidate votes
      await firestoreUpdate(`candidates/${candidateId}`, {
        votes: newVoteCount,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Added ${votes} votes to candidate ${candidateId} (now ${newVoteCount})`);

      // ============================================================
      // UPDATE TRANSACTION STATUS
      // ============================================================
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: 'COMPLETED',
        transactionId: uuid || '',
        amount: amountValue,
        votes: votes,
        candidateId: candidateId,
        webhookData: JSON.stringify(webhookData),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update pending_votes
      await firestoreUpdate(`pending_votes/${invoiceId}`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // ============================================================
      // VERIFY VOTES WERE ADDED
      // ============================================================
      const verifyData = await firestoreGet(`candidates/${candidateId}`);
      let verifyVotes = 0;
      if (verifyData && verifyData.fields) {
        verifyVotes = parseInt(verifyData.fields.votes?.integerValue || 0);
      }
      console.log(`✅ Verification: Candidate now has ${verifyVotes} votes`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Added ${votes} votes to candidate ${candidateId}` 
      }), { status: 200 });
    }

    // ============================================================
    // PROCESS FAILED STATUS
    // ============================================================
    if (status === 'failed' || status === 'cancelled' || status === 'expired') {
      console.log(`⚠️ Payment ${invoiceId} ${status}: ${failure_reason || 'Unknown reason'}`);
      
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: status.toUpperCase(),
        failureReason: failure_reason || '',
        failureCode: failure_code || '',
        webhookData: JSON.stringify(webhookData),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      await firestoreUpdate(`pending_votes/${invoiceId}`, {
        status: status.toUpperCase(),
        failureReason: failure_reason || '',
        failureCode: failure_code || '',
        updatedAt: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed' 
    }), { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 200 });
  }
}
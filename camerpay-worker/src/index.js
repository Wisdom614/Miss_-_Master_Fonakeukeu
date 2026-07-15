/**
 * CamerPay Worker - Complete Payment Integration
 * Supports: Orange Money, MTN MoMo, and Card Payments
 */

// ============================================================
// CONFIGURATION
// ============================================================

const CAMERPAY_API_URL = 'https://camerpay.biz/api/payment/initiate';

// ============================================================
// CORS HEADERS
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// ============================================================
// FIREBASE REST API HELPERS
// ============================================================

async function firestoreGet(path) {
  const projectId = 'miss-master-vote';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return await response.json();
}

async function firestoreSet(path, data) {
  const projectId = 'miss-master-vote';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
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
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  return response.ok;
}

async function firestoreUpdate(path, data) {
  const projectId = 'miss-master-vote';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
  
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
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  
  const updateMask = Object.keys(data).map(key => `updateMask.fieldPaths=${key}`).join('&');
  const fullUrl = `${url}?${updateMask}`;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firestore update error:', response.status, errorText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Firestore update error:', error);
    return false;
  }
}

// ============================================================
// MAIN FETCH HANDLER
// ============================================================
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response;
      
      if (path === '/create-card-payment' && request.method === 'POST') {
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
        }), { headers: corsHeaders });
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
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
        headers: corsHeaders,
      });
    }
  },
};

// ============================================================
// HANDLE: CREATE PAYMENT - WITH BETTER ERROR MESSAGES
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
      phone,
      payment_method = 'orange_money'
    } = body;

    console.log('💳 Creating CamerPay payment:', { 
      amount, 
      candidateId, 
      candidateName, 
      votes,
      payment_method
    });

    if (!amount || !candidateId || !votes) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const invoiceId = `CARD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const token = env.CAMERPAY_TOKEN;
    
    if (!token) {
      console.error('❌ CamerPay token not configured');
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured',
        message: 'Le service de paiement par carte n\'est pas configuré. Veuillez utiliser Mobile Money.'
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const paymentData = {
      amount: amount,
      currency: 'XAF',
      merchant_invoice_id: invoiceId,
      customer_email: email || 'anonymous@voter.com',
      customer_phone: phone || '699123456',
      merchant_callback_url: 'https://camerpay-worker.missmaster.workers.dev/webhook/camerpay',
      merchant_return_url: `https://vote.wisedev.online/payment-result?userId=${invoiceId}&candidate=${candidateId}`,
      source: 'api',
      metadata: {
        candidateId: candidateId,
        candidateName: candidateName,
        votes: votes,
        invoiceId: invoiceId,
        payment_method: payment_method,
      },
    };

    console.log('📤 Sending to CamerPay:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(CAMERPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 CamerPay response status:', response.status);
    console.log('📥 CamerPay response body:', responseText);

    // ✅ Handle 520 error specially
    if (response.status === 520) {
      console.error('❌ CamerPay API 520 error - service unavailable');
      return new Response(JSON.stringify({ 
        error: 'Payment service temporarily unavailable',
        message: 'Le service de paiement par carte est temporairement indisponible. Veuillez réessayer dans quelques minutes ou utiliser Mobile Money.',
        status: 520,
        retry: true
      }), { 
        status: 520,
        headers: corsHeaders 
      });
    }

    if (!response.ok) {
      console.error('❌ CamerPay API error:', response.status, responseText);
      
      let errorMessage = 'Le service de paiement est temporairement indisponible. Veuillez réessayer.';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {}
      
      return new Response(JSON.stringify({ 
        error: 'Payment service error', 
        message: errorMessage,
        status: response.status
      }), { 
        status: response.status || 500,
        headers: corsHeaders 
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response:', responseText);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from payment service',
        message: 'Erreur de communication avec le service de paiement. Veuillez réessayer.'
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log('✅ CamerPay success response:', data);

    const paymentUrl = data.pay_url || data.payment_url || data.redirect_url;

    if (!paymentUrl) {
      console.error('❌ No payment URL in response:', data);
      return new Response(JSON.stringify({ 
        error: 'No payment URL in response',
        message: 'Erreur lors de la création du paiement. Veuillez réessayer.'
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Store pending transaction
    await firestoreSet(`pending_votes/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: amount,
      email: email || 'anonymous@voter.com',
      phone: phone || '',
      paymentUrl: paymentUrl,
      transactionUuid: data.transaction_uuid || '',
      payment_method: payment_method,
      payment_type: 'camerpay',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await firestoreSet(`transactions/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: amount,
      email: email || 'anonymous@voter.com',
      phone: phone || '',
      paymentUrl: paymentUrl,
      transactionUuid: data.transaction_uuid || '',
      payment_method: payment_method,
      payment_type: 'camerpay',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Stored pending transaction: ${invoiceId}`);

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceId,
      paymentUrl: paymentUrl,
      transactionUuid: data.transaction_uuid || '',
    }), { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Create payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create payment link', 
      message: 'Erreur lors de la création du paiement. Veuillez réessayer ou utiliser Mobile Money.',
      details: error.message
    }), { 
      status: 500,
      headers: corsHeaders 
    });
  }
}
// ============================================================
// HANDLE: CAMERPAY WEBHOOK - WITH TEST DETECTION
// ============================================================
async function handleCamerPayWebhook(request, env) {
  try {
    const rawBody = await request.text();
    console.log('🔔 CAMERPAY WEBHOOK RECEIVED');
    console.log('Raw body:', rawBody);
    
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
    } catch (e) {
      const params = new URLSearchParams(rawBody);
      webhookData = {};
      for (const [key, value] of params) {
        webhookData[key] = value;
      }
    }
    console.log('Parsed webhook data:', JSON.stringify(webhookData, null, 2));

    const { 
      transaction_uuid,
      invoice_id,
      status,
      amount,
      payment_method,
      signature,
    } = webhookData;

    const invoiceId = invoice_id || webhookData.invoiceId;

    console.log('📋 Processing webhook for invoice:', invoiceId);
    console.log('📋 Status:', status);

    // ✅ Check if this is a test webhook
    if (invoiceId && invoiceId.startsWith('TEST-')) {
      console.log('🧪 Test webhook detected - returning success');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Test webhook received successfully',
        test: true
      }), { status: 200 });
    }

    if (!invoiceId) {
      console.error('❌ No invoice ID in webhook');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No invoice ID' 
      }), { status: 400 });
    }

    // ✅ Verify signature
    const webhookSecret = env.CAMERPAY_WEBHOOK_SECRET || '4da71cb0ddbe6f321efa044a48973a34f2433b37daa32a4f';
    if (signature && transaction_uuid && invoice_id && status && amount) {
      const dataToSign = `${transaction_uuid}|${invoice_id}|${status}|${amount}`;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const messageData = encoder.encode(dataToSign);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      console.log('🔐 Signature verification:', expectedSignature === signature ? '✅ Valid' : '❌ Invalid');
      
      if (expectedSignature !== signature) {
        console.error('❌ Invalid signature!');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid signature' 
        }), { status: 401 });
      }
    }

    if (status === 'completed' || status === 'success') {
      console.log(`✅ Payment ${invoiceId} completed!`);
      
      // Get transaction data
      const transactionData = await firestoreGet(`transactions/${invoiceId}`);
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
      
      if (!transactionFields) {
        const pendingData = await firestoreGet(`pending_votes/${invoiceId}`);
        if (pendingData && pendingData.fields) {
          transactionFields = {};
          for (const [key, value] of Object.entries(pendingData.fields)) {
            if (value.stringValue !== undefined) transactionFields[key] = value.stringValue;
            else if (value.integerValue !== undefined) transactionFields[key] = value.integerValue;
            else if (value.booleanValue !== undefined) transactionFields[key] = value.booleanValue;
            else if (value.timestampValue !== undefined) transactionFields[key] = value.timestampValue;
          }
        }
      }

      const finalCandidateId = transactionFields?.candidateId;
      const finalVotes = parseInt(transactionFields?.votes) || 1;

      if (!finalCandidateId) {
        console.error(`❌ No candidateId found for transaction ${invoiceId}`);
        // Store for manual review
        await firestoreSet(`webhook_review/${invoiceId}`, {
          invoiceId: invoiceId,
          webhookData: webhookData,
          status: 'PENDING_REVIEW',
          reason: 'No candidateId found',
          receivedAt: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Webhook received but no candidateId - stored for review' 
        }), { status: 200 });
      }

      // ✅ ADD VOTES TO CANDIDATE
      const candidatePath = `candidates/${finalCandidateId}`;
      const candidateData = await firestoreGet(candidatePath);
      let currentVotes = 0;
      
      if (candidateData && candidateData.fields && candidateData.fields.votes) {
        currentVotes = parseInt(candidateData.fields.votes.integerValue || 0);
      }
      
      const newVoteCount = currentVotes + finalVotes;
      console.log(`📊 Adding ${finalVotes} votes (${currentVotes} → ${newVoteCount})`);
      
      await firestoreUpdate(candidatePath, {
        votes: newVoteCount,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Added ${finalVotes} votes to candidate ${finalCandidateId} via CamerPay`);

      // Update transaction
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: 'COMPLETED',
        transactionUuid: transaction_uuid || '',
        amount: parseFloat(amount) || 0,
        paymentMethod: payment_method || '',
        votes: finalVotes,
        candidateId: finalCandidateId,
        webhookData: JSON.stringify(webhookData),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await firestoreUpdate(`pending_votes/${invoiceId}`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Added ${finalVotes} votes to candidate ${finalCandidateId}` 
      }), { status: 200 });
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
      }), { headers: corsHeaders });
    }

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
        status: data.status || 'PENDING',
        data: data,
      }), { headers: corsHeaders });
    }

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
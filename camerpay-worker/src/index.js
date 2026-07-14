/**
 * CamerPay Worker - Card Payments Only
 * Works alongside Fapshi - doesn't affect existing votes
 */

const CAMERPAY_BASE_URL = 'https://api.camerpay.biz'; // Use actual CamerPay URL
const CAMERPAY_CARD_URL = `${CAMERPAY_BASE_URL}/payments/initiate`; // Card endpoint

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Same Firestore helpers as Fapshi (reuse existing code)
async function firestoreGet(path) { /* ... same as before */ }
async function firestoreSet(path, data) { /* ... same as before */ }
async function firestoreUpdate(path, data) { /* ... same as before */ }

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response;
      
      if (path === '/create-card-payment' && request.method === 'POST') {
        response = await handleCardPayment(request, env);
      } else if (path === '/webhook/camerpay' && request.method === 'POST') {
        response = await handleCamerPayWebhook(request, env);
      } else if (path === '/health') {
        response = new Response(JSON.stringify({ 
          status: 'ok', 
          platform: 'camerpay-cards',
          timestamp: new Date().toISOString() 
        }), { headers: corsHeaders });
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      
      // Add CORS headers
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
// HANDLE: Card Payment Creation
// ============================================================
async function handleCardPayment(request, env) {
  try {
    const body = await request.json();
    const { 
      amount, 
      candidateId, 
      candidateName, 
      votes, 
      email,
    } = body;

    console.log('💳 Creating CamerPay card payment:', { amount, candidateId, candidateName, votes });

    if (!amount || !candidateId || !votes) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const invoiceId = `CARD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const apiUsername = env.CAMERPAY_USERNAME;
    const apiPassword = env.CAMERPAY_PASSWORD;
    
    if (!apiUsername || !apiPassword) {
      console.error('❌ CamerPay credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured'
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // CamerPay card payment request
    const paymentData = {
      amount: amount,
      currency: 'XAF',
      description: `Vote for ${candidateName}`,
      external_reference: invoiceId,
      first_name: email || 'Voter',
      last_name: 'Anonymous',
      email: email || 'anonymous@voter.com',
      redirect_url: `https://vote.wisedev.online/payment-result?userId=${invoiceId}&candidate=${candidateId}`,
      failure_redirect_url: `https://vote.wisedev.online/payment-result?status=failed`,
      payment_options: 'CARD', // Only cards
      metadata: {
        candidateId: candidateId,
        candidateName: candidateName,
        votes: votes,
        invoiceId: invoiceId,
        payment_type: 'card',
      },
    };

    console.log('📤 Sending to CamerPay:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(CAMERPAY_CARD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${apiUsername}:${apiPassword}`)}`,
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 CamerPay response status:', response.status);
    console.log('📥 CamerPay response body:', responseText);

    if (!response.ok) {
      console.error('❌ CamerPay API error:', response.status, responseText);
      return new Response(JSON.stringify({ 
        error: 'CamerPay API error', 
        message: responseText,
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
        error: 'Invalid response from payment service'
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log('✅ CamerPay success response:', data);

    // CamerPay returns a payment link
    const paymentUrl = data.link || data.payment_url || data.redirect_url;

    if (!paymentUrl) {
      console.error('❌ No payment URL in response:', data);
      return new Response(JSON.stringify({ 
        error: 'No payment URL in response',
        details: data
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Store pending transaction (same structure as Fapshi)
    await firestoreSet(`pending_votes/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: amount,
      email: email || 'anonymous@voter.com',
      paymentUrl: paymentUrl,
      payment_type: 'card',
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
      paymentUrl: paymentUrl,
      payment_type: 'card',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Stored pending card transaction: ${invoiceId}`);

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceId,
      paymentUrl: paymentUrl,
    }), { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Create card payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create card payment link', 
      message: error.message
    }), { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

// ============================================================
// HANDLE: CamerPay Webhook (Card Payments)
// ============================================================
async function handleCamerPayWebhook(request, env) {
  try {
    const rawBody = await request.text();
    console.log('🔔 CAMERPAY WEBHOOK RECEIVED');
    
    const webhookData = JSON.parse(rawBody);
    console.log('Parsed webhook data:', JSON.stringify(webhookData, null, 2));

    const { 
      reference,
      external_reference,
      status,
      amount,
    } = webhookData;

    const invoiceId = external_reference;

    console.log('📋 Processing webhook for invoice:', invoiceId);
    console.log('📋 Status:', status);

    if (!invoiceId) {
      console.error('❌ No invoice ID in webhook');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No invoice ID' 
      }), { status: 400 });
    }

    if (status === 'SUCCESSFUL') {
      console.log(`✅ Card payment ${invoiceId} completed!`);
      
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
      
      // Also check pending_votes
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
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing candidateId' 
        }), { status: 404 });
      }

      // ✅ ADD VOTES TO CANDIDATE (same as Fapshi)
      const candidatePath = `candidates/${finalCandidateId}`;
      const candidateData = await firestoreGet(candidatePath);
      let currentVotes = 0;
      
      if (candidateData && candidateData.fields && candidateData.fields.votes) {
        currentVotes = parseInt(candidateData.fields.votes.integerValue || 0);
      }
      
      const newVoteCount = currentVotes + finalVotes;
      console.log(`📊 Adding ${finalVotes} card votes (${currentVotes} → ${newVoteCount})`);
      
      await firestoreUpdate(candidatePath, {
        votes: newVoteCount,
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Added ${finalVotes} votes to candidate ${finalCandidateId} via CamerPay`);

      // ✅ Update transaction status
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: 'COMPLETED',
        transactionId: reference || '',
        amount: parseFloat(amount) || 0,
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
        message: `Added ${finalVotes} votes to candidate ${finalCandidateId} via card` 
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
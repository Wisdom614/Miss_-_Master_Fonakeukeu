/**
 * Fapshi Payment Worker - Complete Integration
 * Webhook now adds votes (handles network loss)
 */

// ============================================================
// CONFIGURATION
// ============================================================

const FAPSHI_BASE_URL = 'https://live.fapshi.com';
const FAPSHI_API_URL = `${FAPSHI_BASE_URL}/initiate-pay`;

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
      
      if (path === '/create-payment' && request.method === 'POST') {
        response = await handleCreatePayment(request, env);
      } else if (path === '/webhook/fapshi' && request.method === 'POST') {
        response = await handleFapshiWebhook(request, env);
      } else if (path === '/check-payment' && request.method === 'GET') {
        response = await handleCheckPayment(request);
      } else if (path === '/complete-vote' && request.method === 'GET') {
        response = await handleCompleteVote(request);
      } else if (path === '/direct-add-vote' && request.method === 'GET') {
        response = await handleDirectAddVote(request);
      } else if (path === '/health') {
        response = new Response(JSON.stringify({ 
          status: 'ok', 
          platform: 'fapshi',
          baseUrl: FAPSHI_BASE_URL,
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
        headers: corsHeaders,
      });
    }
  },
};

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
      email 
    } = body;

    console.log('📝 Creating Fapshi payment:', { amount, candidateId, candidateName, votes });

    if (!amount || !candidateId || !votes) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const invoiceId = `VOTE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const apiUser = env.FAPSHI_API_USER;
    const apiKey = env.FAPSHI_API_KEY;
    
    if (!apiUser || !apiKey) {
      console.error('❌ Fapshi credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured'
      }), { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const paymentData = {
      amount: amount,
      email: email || 'anonymous@voter.com',
      userId: invoiceId,
      externalId: candidateId,
      message: `Vote for ${candidateName}`,
      redirectUrl: `https://vote.wisedev.online/payment-result?userId=${invoiceId}&candidate=${candidateId}`,
      metadata: {
        candidateId: candidateId,
        candidateName: candidateName,
        votes: votes,
        invoiceId: invoiceId,
      },
    };

    console.log('📤 Sending to Fapshi:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(FAPSHI_API_URL, {
      method: 'POST',
      headers: {
        'apiUser': apiUser,
        'apiKey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 Fapshi response status:', response.status);
    console.log('📥 Fapshi response body:', responseText);

    if (!response.ok) {
      console.error('❌ Fapshi API error:', response.status, responseText);
      return new Response(JSON.stringify({ 
        error: 'Fapshi API error', 
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

    console.log('✅ Fapshi success response:', data);

    const paymentUrl = data.link || data.paymentLink || data.payUrl || data.redirectUrl || data.url;

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

    await firestoreSet(`pending_votes/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: amount,
      email: email || 'anonymous@voter.com',
      paymentUrl: paymentUrl,
      transactionId: data.transactionId || data.id || '',
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
      transactionId: data.transactionId || data.id || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Stored pending transaction: ${invoiceId}`);

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceId,
      paymentUrl: paymentUrl,
      transactionId: data.transactionId || data.id || '',
    }), { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Create payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create payment link', 
      message: error.message
    }), { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

// ============================================================
// HANDLE: DIRECT ADD VOTE (Fallback for frontend)
// ============================================================
async function handleDirectAddVote(request) {
  try {
    const url = new URL(request.url);
    const candidateId = url.searchParams.get('candidateId');
    const votesParam = url.searchParams.get('votes');
    const candidateName = url.searchParams.get('candidateName') || 'le candidat';
    const invoiceId = url.searchParams.get('invoiceId') || `txn-${Date.now()}`;

    console.log('🔧 DIRECT ADD VOTE REQUEST:');
    console.log('  Candidate ID:', candidateId);
    console.log('  Votes Param:', votesParam);
    console.log('  Candidate Name:', candidateName);
    console.log('  Invoice ID:', invoiceId);

    if (!candidateId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing candidateId' 
      }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    const votesToAdd = parseInt(votesParam) || 1;
    console.log(`📊 Adding ${votesToAdd} votes to candidate ${candidateId}`);

    // Check if already completed
    const existingTxn = await firestoreGet(`transactions/${invoiceId}`);
    if (existingTxn && existingTxn.fields) {
      const status = existingTxn.fields.status?.stringValue || '';
      if (status === 'COMPLETED') {
        console.log(`⚠️ Transaction ${invoiceId} already completed - skipping`);
        return new Response(JSON.stringify({
          success: true,
          alreadyCompleted: true,
          message: 'Vote already added'
        }), { 
          status: 200,
          headers: corsHeaders
        });
      }
    }

    // Get current candidate votes
    const candidatePath = `candidates/${candidateId}`;
    const candidateData = await firestoreGet(candidatePath);
    
    let currentVotes = 0;
    if (candidateData && candidateData.fields && candidateData.fields.votes) {
      currentVotes = parseInt(candidateData.fields.votes.integerValue || 0);
      console.log(`📊 Current votes: ${currentVotes}`);
    }
    
    const newVoteCount = currentVotes + votesToAdd;
    console.log(`📊 New vote count: ${newVoteCount} (adding ${votesToAdd} votes)`);
    
    await firestoreUpdate(candidatePath, {
      votes: newVoteCount,
      updatedAt: new Date().toISOString(),
    });

    await firestoreSet(`transactions/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votesToAdd,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      source: 'direct_add',
    });

    return new Response(JSON.stringify({
      success: true,
      candidateId: candidateId,
      candidateName: candidateName,
      votesAdded: votesToAdd,
      newVoteCount: newVoteCount,
      message: `Added ${votesToAdd} votes to ${candidateName}`
    }), { 
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('❌ Direct add vote error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// ============================================================
// HANDLE: FAPSHI WEBHOOK - FIXED VOTE COUNT
// ============================================================
async function handleFapshiWebhook(request, env) {
  try {
    const rawBody = await request.text();
    console.log('🔔 FAPSHI WEBHOOK RECEIVED');
    console.log('Raw body:', rawBody);
    
    const webhookData = JSON.parse(rawBody);
    console.log('Parsed webhook data:', JSON.stringify(webhookData, null, 2));

    const { 
      transId,
      amount,
      status,
      userId,
      externalId,
      metadata,
    } = webhookData;

    const invoiceId = userId || metadata?.invoiceId;
    const candidateId = externalId || metadata?.candidateId;
    
    // ✅ Get votes from metadata - try multiple sources
    let votes = 1;
    if (metadata?.votes) {
      votes = parseInt(metadata.votes) || 1;
    } else if (webhookData.votes) {
      votes = parseInt(webhookData.votes) || 1;
    } else {
      // Fallback: calculate from amount (100 FCFA = 1 vote)
      votes = Math.floor((parseFloat(amount) || 0) / 100) || 1;
    }
    
    console.log(`📋 Processing webhook for invoice: ${invoiceId}`);
    console.log(`📋 Status: ${status}`);
    console.log(`📋 Votes to add: ${votes}`);
    console.log(`📋 Amount: ${amount}`);

    if (!invoiceId) {
      console.error('❌ No invoice ID in webhook');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No invoice ID' 
      }), { status: 400 });
    }

    if (status === 'SUCCESSFUL' || status === 'COMPLETED') {
      console.log(`✅ Payment ${invoiceId} completed! Adding ${votes} votes...`);
      
      // Get transaction data to verify
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
        console.log('📋 Transaction fields:', transactionFields);
      }
      
      // ✅ If metadata didn't have votes, try to get from transaction
      if (votes === 1 && transactionFields && transactionFields.votes) {
        votes = parseInt(transactionFields.votes) || 1;
        console.log(`📋 Found votes in transaction: ${votes}`);
      }

      const finalCandidateId = candidateId || transactionFields?.candidateId;

      if (!finalCandidateId) {
        console.error(`❌ No candidateId found for transaction ${invoiceId}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing candidateId' 
        }), { status: 404 });
      }

      // ✅ ADD VOTES TO CANDIDATE
      const candidatePath = `candidates/${finalCandidateId}`;
      const candidateData = await firestoreGet(candidatePath);
      let currentVotes = 0;
      
      if (candidateData && candidateData.fields && candidateData.fields.votes) {
        currentVotes = parseInt(candidateData.fields.votes.integerValue || 0);
        console.log(`📊 Current votes: ${currentVotes}`);
      }
      
      const newVoteCount = currentVotes + votes;
      console.log(`📊 Adding ${votes} votes (${currentVotes} → ${newVoteCount})`);
      
      const updateSuccess = await firestoreUpdate(candidatePath, {
        votes: newVoteCount,
        updatedAt: new Date().toISOString(),
      });

      if (!updateSuccess) {
        console.error('❌ Failed to update candidate votes from webhook');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to update candidate votes' 
        }), { status: 500 });
      }

      console.log(`✅ Added ${votes} votes to candidate ${finalCandidateId} via webhook`);

      // ✅ Update transaction status
      await firestoreUpdate(`transactions/${invoiceId}`, {
        status: 'COMPLETED',
        transactionId: transId || '',
        amount: parseFloat(amount) || 0,
        votes: votes,
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

      // ✅ Verify the update
      const verifyData = await firestoreGet(candidatePath);
      let verifiedVotes = 0;
      if (verifyData && verifyData.fields && verifyData.fields.votes) {
        verifiedVotes = parseInt(verifyData.fields.votes.integerValue || 0);
      }
      console.log(`✅ Verification: Candidate now has ${verifiedVotes} votes`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Added ${votes} votes to candidate ${finalCandidateId}` 
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
      return new Response(JSON.stringify({
        success: true,
        invoiceId: invoiceId,
        status: data.status || 'UNKNOWN',
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

// ============================================================
// HANDLE: COMPLETE PENDING VOTE (Manual Fix)
// ============================================================
async function handleCompleteVote(request) {
  try {
    const url = new URL(request.url);
    const invoiceId = url.searchParams.get('invoiceId');
    
    if (!invoiceId) {
      return new Response(JSON.stringify({ 
        error: 'Missing invoiceId parameter' 
      }), { status: 400 });
    }

    const pendingData = await firestoreGet(`pending_votes/${invoiceId}`);
    
    if (!pendingData || !pendingData.fields) {
      return new Response(JSON.stringify({ 
        error: 'Pending vote not found',
        invoiceId: invoiceId
      }), { status: 404 });
    }

    const pendingFields = {};
    for (const [key, value] of Object.entries(pendingData.fields)) {
      if (value.stringValue !== undefined) pendingFields[key] = value.stringValue;
      else if (value.integerValue !== undefined) pendingFields[key] = value.integerValue;
      else if (value.booleanValue !== undefined) pendingFields[key] = value.booleanValue;
      else if (value.timestampValue !== undefined) pendingFields[key] = value.timestampValue;
    }

    const candidateId = pendingFields.candidateId;
    const votes = parseInt(pendingFields.votes) || 1;
    const candidateName = pendingFields.candidateName || '';

    if (!candidateId) {
      return new Response(JSON.stringify({ 
        error: 'No candidateId found in pending vote'
      }), { status: 400 });
    }

    const candidatePath = `candidates/${candidateId}`;
    const candidateData = await firestoreGet(candidatePath);
    let currentVotes = 0;
    
    if (candidateData && candidateData.fields) {
      currentVotes = parseInt(candidateData.fields.votes?.integerValue || 0);
    }
    
    const newVoteCount = currentVotes + votes;

    const updateSuccess = await firestoreUpdate(candidatePath, {
      votes: newVoteCount,
      updatedAt: new Date().toISOString(),
    });

    if (!updateSuccess) {
      return new Response(JSON.stringify({ 
        error: 'Failed to update candidate votes' 
      }), { status: 500 });
    }

    await firestoreSet(`transactions/${invoiceId}`, {
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      amount: parseInt(pendingFields.amount) || 0,
      email: pendingFields.email || '',
      phone: pendingFields.phone || '',
      status: 'COMPLETED',
      createdAt: pendingFields.createdAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual_completion',
    });

    await firestoreUpdate(`pending_votes/${invoiceId}`, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceId,
      candidateId: candidateId,
      candidateName: candidateName,
      votes: votes,
      newVoteCount: newVoteCount,
      message: `Added ${votes} votes to ${candidateName || candidateId}`
    }), { status: 200 });

  } catch (error) {
    console.error('❌ Complete vote error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete vote', 
      message: error.message 
    }), { status: 500 });
  }
}
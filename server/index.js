/**
 * VOCA AI Lead Gen - Backend Server
 * Express server with Ultravox integration for voice calls
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  createOutboundCall,
  getCallStatus,
  getCallMessages,
  extractLeadDataFromTranscript,
  listVoices
} from './services/ultravoxService.js';
import { endCallByPhoneNumber } from './services/twilioService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Format phone number to E.164 format
 * E.164 format: +[country code][number] e.g., +919876543210, +15551234567
 */
function formatToE164(phone, defaultCountryCode = '+91') {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If already starts with +, assume it's already E.164
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }
  
  // For Indian numbers (10 digits starting with 6-9)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return '+91' + cleaned;
  }
  
  // For US numbers (10 digits)
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  // If 11 digits starting with 1 (US with country code but no +)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }
  
  // If 12 digits starting with 91 (India with country code but no +)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  }
  
  // Default: add the default country code
  return defaultCountryCode + cleaned;
}

/**
 * POST /outbound-call
 * Initiates an outbound call to a lead using Ultravox + Twilio
 */
app.post('/outbound-call', async (req, res) => {
  try {
    const { phoneNumber, leadId, agentId, systemPrompt, voice, languageHint } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Format phone number to E.164
    const formattedPhone = formatToE164(phoneNumber);
    
    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid phone number format. Got: ${phoneNumber}, formatted: ${formattedPhone}. Expected E.164 format like +919876543210` 
      });
    }

    // Default system prompt if not provided
    const prompt = systemPrompt || `You are a friendly sales representative for VOCA Solar. 
Your goal is to introduce yourself and gauge the customer's interest in solar energy solutions.
Be natural, conversational, and listen carefully to their responses.
Ask about their current energy costs and if they've considered solar before.
If they're interested, offer to schedule a follow-up call with a specialist.
Speak naturally and don't be pushy.`;

    // Use provided voice or default to terrence
    const selectedVoice = voice || 'terrence';
    const selectedLanguage = languageHint || 'en-US';

    console.log(`[Ultravox] Starting outbound call to ${formattedPhone} (original: ${phoneNumber}) for lead ${leadId}`);
    console.log(`[Ultravox] Voice: ${selectedVoice}, Language: ${selectedLanguage}, Recording: ENABLED`);

    // Create call with Ultravox
    const callResponse = await createOutboundCall({
      phoneNumber: formattedPhone,
      systemPrompt: prompt,
      voice: selectedVoice,
      languageHint: selectedLanguage,
      twilioFrom: process.env.TWILIO_PHONE_NUMBER,
      callbackUrl: process.env.BACKEND_URL,
      metadata: { leadId, agentId }
    });

    console.log(`[Ultravox] Call created:`, callResponse.callId);

    // Log call to Supabase
    const { data: callLog, error: callError } = await supabase
      .from('calls')
      .insert({
        lead_id: leadId,
        ultravox_call_id: callResponse.callId,
        started_at: new Date().toISOString(),
        status: 'ongoing',
        summary: 'Call initiated via Ultravox'
      })
      .select()
      .single();

    if (callError) {
      console.error('[Supabase] Error logging call:', callError);
    }

    res.json({
      success: true,
      callSid: callResponse.callId,
      ultravoxCallId: callResponse.callId,
      joinUrl: callResponse.joinUrl,
      status: 'initiated',
      dbCallId: callLog?.id
    });

  } catch (error) {
    console.error('[Ultravox] Error creating call:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate call'
    });
  }
});

/**
 * POST /webhooks/ultravox/call-ended
 * Webhook handler for when a call ends
 */
app.post('/webhooks/ultravox/call-ended', async (req, res) => {
  try {
    const { callId, endReason, duration } = req.body;
    
    console.log(`[Webhook] Call ended: ${callId}, reason: ${endReason}, duration: ${duration}s`);

    // Get call transcript
    const messages = await getCallMessages(callId);
    
    // Extract lead data from transcript
    const extractedData = extractLeadDataFromTranscript(messages.results || []);
    
    console.log(`[Webhook] Extracted interest level: ${extractedData.interestLevel}`);

    // Update call record in Supabase
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        status: 'completed',
        summary: extractedData.transcript?.substring(0, 500) || 'Call completed'
      })
      .eq('ultravox_call_id', callId);

    if (updateError) {
      console.error('[Supabase] Error updating call:', updateError);
    }

    // Update lead status based on extracted data
    const { data: callRecord } = await supabase
      .from('calls')
      .select('lead_id')
      .eq('ultravox_call_id', callId)
      .single();

    if (callRecord?.lead_id && extractedData.interestLevel !== 'unknown') {
      await supabase
        .from('leads')
        .update({
          status: extractedData.interestLevel,
          notes: extractedData.notes || `Call completed. Interest: ${extractedData.interestLevel}`
        })
        .eq('id', callRecord.lead_id);
      
      console.log(`[Supabase] Updated lead ${callRecord.lead_id} status to ${extractedData.interestLevel}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('[Webhook] Error processing call end:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /end-call
 * End an active call for a specific phone number
 */
app.post('/end-call', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    // Format if needed, but for now pass raw as Twilio might handle it or we reuse format fn
    const formattedPhone = formatToE164(phoneNumber);
    
    const result = await endCallByPhoneNumber(formattedPhone || phoneNumber);
    
    if (result.success) {
      res.json({ success: true, callSid: result.callSid });
    } else {
      res.status(404).json({ success: false, error: result.error });
    }
    
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /calls/:callId/status
 * Get status of a specific call
 */
app.get('/calls/:callId/status', async (req, res) => {
  try {
    const { callId } = req.params;
    const status = await getCallStatus(callId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /calls/:callId/messages
 * Get transcript/messages of a specific call
 */
app.get('/calls/:callId/messages', async (req, res) => {
  try {
    const { callId } = req.params;
    const messages = await getCallMessages(callId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /calls/:callId/recording
 * Get recording URL for a completed call
 */
app.get('/calls/:callId/recording', async (req, res) => {
  try {
    const { callId } = req.params;
    const apiKey = process.env.ULTRAVOX_API_KEY;
    
    // Get call details which include recording URL
    const response = await fetch(`https://api.ultravox.ai/api/calls/${callId}`, {
      headers: {
        'X-API-Key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get call: ${response.status}`);
    }

    const callData = await response.json();
    
    if (callData.recordingUrl) {
      res.json({ 
        success: true, 
        recordingUrl: callData.recordingUrl,
        duration: callData.duration
      });
    } else {
      res.json({ 
        success: false, 
        error: 'Recording not available yet or recording was not enabled' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /voices
 * List available Ultravox voices
 */
app.get('/voices', async (req, res) => {
  try {
    const voices = await listVoices();
    res.json(voices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 VOCA AI Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Outbound call: POST http://localhost:${PORT}/outbound-call`);
  console.log(`\n📋 Configuration:`);
  console.log(`   Ultravox API Key: ${process.env.ULTRAVOX_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`   Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '✗ Missing'}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`   Callback URL: ${process.env.BACKEND_URL || 'Not set (webhooks disabled)'}\n`);
});

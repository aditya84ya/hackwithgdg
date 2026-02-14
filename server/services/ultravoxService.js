/**
 * Ultravox API Service
 * Wrapper for making calls to Ultravox REST API
 */

const ULTRAVOX_API_BASE = 'https://api.ultravox.ai/api';

/**
 * Create an outbound call using Ultravox with Twilio
 * @param {Object} options Call configuration
 * @returns {Promise<Object>} Call response from Ultravox
 */
export async function createOutboundCall({
  phoneNumber,
  systemPrompt,
  voice = 'terrence',
  languageHint = 'en-US',
  twilioFrom,
  callbackUrl,
  metadata = {}
}) {
  const apiKey = process.env.ULTRAVOX_API_KEY;
  
  if (!apiKey) {
    throw new Error('ULTRAVOX_API_KEY is not configured');
  }

  // Check if voice is an ElevenLabs ID (short alphanumeric) or Ultravox UUID
  let voiceConfig = voice;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(voice);
  
  if (!isUUID && voice && voice.length < 30) {
     // Assume ElevenLabs ID
     console.log(`Detected ElevenLabs ID: ${voice}, using dynamic voice definition.`);
     voiceConfig = {
        name: "Custom Voice",
        definition: {
            elevenLabs: {
                voiceId: voice,
                model: "eleven_turbo_v2_5"
            }
        }
     };
  }

  const callConfig = {
    systemPrompt,
    voice: voiceConfig,
    languageHint,
    medium: {
      twilio: {
        outgoing: {
          to: phoneNumber,
          from: twilioFrom || process.env.TWILIO_PHONE_NUMBER
        }
      }
    },
    firstSpeakerSettings: {
      user: {}  // User speaks first (they answer the phone)
    },
    recordingEnabled: true,
    metadata
  };

  // Add callback if provided
  if (callbackUrl) {
    callConfig.callbacks = {
      ended: { url: `${callbackUrl}/webhooks/ultravox/call-ended` }
    };
  }

  const response = await fetch(`${ULTRAVOX_API_BASE}/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(callConfig)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ultravox API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get call status from Ultravox
 * @param {string} callId Ultravox call ID
 * @returns {Promise<Object>} Call status
 */
export async function getCallStatus(callId) {
  const apiKey = process.env.ULTRAVOX_API_KEY;

  const response = await fetch(`${ULTRAVOX_API_BASE}/calls/${callId}`, {
    headers: {
      'X-API-Key': apiKey
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`[Ultravox] Call ID ${callId} not found (404). returning null status.`);
      return { status: 'unknown', error: 'Call not found' };
    }
    throw new Error(`Failed to get call status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get call transcript/messages from Ultravox
 * @param {string} callId Ultravox call ID
 * @returns {Promise<Object>} Call messages
 */
export async function getCallMessages(callId) {
  const apiKey = process.env.ULTRAVOX_API_KEY;

  if (!callId) return { results: [] };

  const response = await fetch(`${ULTRAVOX_API_BASE}/calls/${callId}/messages`, {
    headers: {
      'X-API-Key': apiKey
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
       console.warn(`[Ultravox] Call ID ${callId} not found (404). returning empty messages.`);
       return { results: [] };
    }
    throw new Error(`Failed to get call messages: ${response.status}`);
  }

  return response.json();
}

/**
 * Extract lead data from call transcript
 * Parses transcript to find key information
 * @param {Array} messages Array of call messages
 * @returns {Object} Extracted lead data
 */
export function extractLeadDataFromTranscript(messages) {
  const transcript = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.role}: ${m.text}`)
    .join('\n');

  // Enhanced extraction with more keywords
  const extracted = {
    transcript,
    interestLevel: 'unknown',
    notes: '',
    followUpRequired: false,
    scheduledTime: null
  };

  const lowerTranscript = transcript.toLowerCase();

  // Positive indicators (English + Tamil transliteration)
  const highInterestKeywords = [
    'very interested', 'definitely', 'sign me up', 'let\'s do it',
    'schedule', 'appointment', 'meeting', 'tomorrow', 'next week',
    'call me back', 'send details', 'whatsapp',
    // Tamil/Tanglish
    'seri', 'ok pa', 'sure', 'romba nalla iruku', 'interested ah irukken'
  ];

  const moderateInterestKeywords = [
    'interested', 'tell me more', 'sounds good', 'maybe', 'possibly',
    'how much', 'price', 'cost', 'what is the rate',
    // Tamil/Tanglish
    'sollunga', 'konjam yosikaren', 'pakalaam'
  ];

  const negativeKeywords = [
    'not interested', 'no thanks', 'busy', 'don\'t call', 'stop calling',
    'wrong number', 'remove my number', 'do not call',
    // Tamil/Tanglish
    'venda', 'time illa', 'busy ah irukken', 'call panna vendaam'
  ];

  // Check for scheduled callback/meeting
  const schedulePatterns = [
    /tomorrow at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /call (?:me )?(?:back )?at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:ku|la)?\s*call pannunga/i
  ];

  for (const pattern of schedulePatterns) {
    const match = lowerTranscript.match(pattern);
    if (match) {
      extracted.scheduledTime = match[1];
      extracted.followUpRequired = true;
      extracted.notes = `Callback requested: ${match[1]}`;
      break;
    }
  }

  // Determine interest level
  if (negativeKeywords.some(kw => lowerTranscript.includes(kw))) {
    extracted.interestLevel = 'Not Interested';
    extracted.notes = extracted.notes || 'Lead declined or asked not to be called';
  } else if (highInterestKeywords.some(kw => lowerTranscript.includes(kw))) {
    extracted.interestLevel = 'Interested';
    extracted.followUpRequired = true;
    extracted.notes = extracted.notes || 'High interest - schedule follow-up';
  } else if (moderateInterestKeywords.some(kw => lowerTranscript.includes(kw))) {
    extracted.interestLevel = 'Interested';
    extracted.notes = extracted.notes || 'Moderate interest - may need nurturing';
  } else if (transcript.length > 100) {
    // Had a conversation but no clear signals
    extracted.interestLevel = 'Contacted';
    extracted.notes = extracted.notes || 'Call completed - needs review';
  } else {
    extracted.interestLevel = 'Contacted';
    extracted.notes = extracted.notes || 'Brief call - may have been missed/busy';
  }

  return extracted;
}

/**
 * List available voices from Ultravox
 * @returns {Promise<Object>} Available voices
 */
export async function listVoices() {
  const apiKey = process.env.ULTRAVOX_API_KEY;

  const response = await fetch(`${ULTRAVOX_API_BASE}/voices`, {
    headers: {
      'X-API-Key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list voices: ${response.status}`);
  }

  return response.json();
}

export default {
  createOutboundCall,
  getCallStatus,
  getCallMessages,
  extractLeadDataFromTranscript,
  listVoices
};

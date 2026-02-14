/**
 * Twilio Service
 * Wrapper for making calls to Twilio API
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * End a call by phone number (kills the active call with this number)
 * @param {string} phoneNumber The phone number to look for in active calls
 * @returns {Promise<Object>} Result of the operation
 */
export async function endCallByPhoneNumber(phoneNumber) {
  if (!client) {
    console.error('Twilio client not initialized - check env vars');
    return { success: false, error: 'Twilio configuration missing' };
  }

  try {
    console.log(`[Twilio] Attempting to find and end call for: ${phoneNumber}`);
    
    // Statuses to check - user might want to cancel while ringing or queued too
    const statusesToCheck = ['in-progress', 'ringing', 'queued'];
    let activeCall = null;

    // Check each status until found
    for (const status of statusesToCheck) {
        const calls = await client.calls.list({
            status: status,
            limit: 20
        });
        
        activeCall = calls.find(c => c.to === phoneNumber || c.from === phoneNumber);
        
        if (activeCall) {
            console.log(`[Twilio] Found active call in status '${status}' with SID: ${activeCall.sid}`);
            break;
        }
    }

    if (!activeCall) {
      console.log(`[Twilio] No active call found for ${phoneNumber}`);
      return { success: false, error: 'No active call found' };
    }

    console.log(`[Twilio] Terminating call SID: ${activeCall.sid}...`);

    // Update the call status to 'completed' to end it
    await client.calls(activeCall.sid).update({ status: 'completed' });

    console.log(`[Twilio] Call ${activeCall.sid} terminated successfully`);
    return { success: true, callSid: activeCall.sid };

  } catch (error) {
    console.error('[Twilio] Error ending call:', error);
    return { success: false, error: error.message };
  }
}

export default {
    endCallByPhoneNumber
};

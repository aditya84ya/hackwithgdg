
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Find .env file
const possiblePaths = [
  path.resolve(process.cwd(), 'server/.env'), // Run from root
  path.resolve(process.cwd(), '.env'),        // Run from server
];

const envPath = possiblePaths.find(p => fs.existsSync(p));

if (envPath) {
  console.log(`Loading .env from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.error('Could not find .env file');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixVoiceId() {
  const invalidVoiceId = 'elevenlabs-V9LCAAi4tTlqe9JadbCo';
  // Use Mark (ElevenLabs) as valid replacement
  const validVoiceId = 'c09f0a7d-97da-4041-9c50-6b92a19667da'; 

  console.log(`Checking for agents with invalid voice ID: ${invalidVoiceId}`);

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('*')
    .eq('voice_id', invalidVoiceId);

  if (fetchError) {
    console.error('Error fetching agents:', fetchError);
    return;
  }

  if (agents.length === 0) {
    console.log('No agents found with invalid voice ID.');
    
    // Check if there are any agents at all
    const { count, error: countError } = await supabase.from('agents').select('*', { count: 'exact', head: true });
    if(countError) console.error("Error counting", countError);
    else console.log(`Total agents in DB: ${count}`);
    
    return;
  }

  console.log(`Found ${agents.length} agents with invalid voice ID. Updating...`);

  const { error: updateError } = await supabase
    .from('agents')
    .update({ voice_id: validVoiceId })
    .eq('voice_id', invalidVoiceId);

  if (updateError) {
    console.error('Error updating agents:', updateError);
  } else {
    console.log('Successfully updated agents.');
    console.log(`Replaced '${invalidVoiceId}' with '${validVoiceId}'`);
  }
}

fixVoiceId();

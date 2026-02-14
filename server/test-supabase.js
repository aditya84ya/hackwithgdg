
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

console.log(`Checking connection to ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to get the health of the service or just a simple query
    // Since we don't know if 'calls' table exists or has data, we can try to list tables 
    // or just checking if we can perform a select.
    // A simple way is to check if we can select from a table that should exist, 
    // or use a lighter weight check if possible.
    
    // Attempt to select from 'calls' as it's used in the main app
    const { data, error } = await supabase
      .from('calls')
      .select('count', { count: 'exact', head: true });

    if (error) {
       // If table doesn't exist, code is 42P01
       if (error.code === '42P01') {
           console.log('✅ Connection Successful! (Table "calls" does not exist yet, but auth worked)');
           return;
       }
       throw error;
    }

    console.log('✅ Connection Successful! Supabase is reachable and authorized.');
    
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    if (error.message.includes('Invalid API key')) {
        console.error('   👉 Please double check your SUPABASE_SERVICE_KEY in server/.env');
    }
    process.exit(1);
  }
}

testConnection();

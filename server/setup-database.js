import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://jsbixsnfwsdgmhzgzgkr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // You'll need the service role key for this

if (!supabaseServiceKey) {
  console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
  console.log('You can find this in Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });

    if (error) {
      console.error('❌ Error executing schema:', error);
      console.log('\n⚠️  Please run the schema manually in Supabase SQL Editor:');
      console.log('   1. Go to https://supabase.com/dashboard/project/jsbixsnfwsdgmhzgzgkr/sql');
      console.log('   2. Open server/schema.sql');
      console.log('   3. Copy and paste the entire content');
      console.log('   4. Click Run\n');
      process.exit(1);
    }

    console.log('✅ Database tables created successfully!');
    console.log('✅ Indexes created!');
    console.log('✅ Row Level Security enabled!');
    console.log('✅ Policies configured!\n');
    console.log('🎉 Database setup complete!\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n⚠️  Please run the schema manually in Supabase SQL Editor:');
    console.log('   1. Go to https://supabase.com/dashboard/project/jsbixsnfwsdgmhzgzgkr/sql');
    console.log('   2. Open server/schema.sql');
    console.log('   3. Copy and paste the entire content');
    console.log('   4. Click Run\n');
  }
}

setupDatabase();

/**
 * Environment variable checker - Run this to debug env issues
 * Usage: npx tsx src/utils/checkEnv.ts
 */
import 'dotenv/config';

console.log('=== Environment Variable Check ===\n');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

const optionalVars = [
  'PORT',
  'GITHUB_TOKEN'
];

console.log('Required Variables:');
let allPresent = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  const isPresent = !!value;
  const preview = value ? `${value.slice(0, 10)}...` : 'MISSING';
  
  console.log(`  ${varName}: ${isPresent ? '✅' : '❌'} ${preview}`);
  if (!isPresent) {
    allPresent = false;
  }
}

console.log('\nOptional Variables:');
for (const varName of optionalVars) {
  const value = process.env[varName];
  const isPresent = !!value;
  const preview = value ? `${value.slice(0, 10)}...` : 'not set';
  
  console.log(`  ${varName}: ${isPresent ? '✅' : '⚪'} ${preview}`);
}

console.log('\n=== File Location Check ===');
console.log('Make sure your .env file is located at: backend/.env');
console.log('NOT at: root/.env or frontend/.env\n');

if (allPresent) {
  console.log('✅ All required environment variables are present!');
  console.log('✅ OpenAI client should initialize correctly.');
} else {
  console.log('❌ Some required environment variables are missing!');
  console.log('❌ Check your backend/.env file and restart the server.');
}

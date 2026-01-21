/**
 * Re-encrypt API keys with new ENCRYPTION_KEY
 *
 * Usage:
 *   bun run scripts/reencrypt-api-keys.ts <actual-api-key>
 *
 * Example:
 *   bun run scripts/reencrypt-api-keys.ts sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */

import { db } from '@sambung-chat/db';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { eq } from 'drizzle-orm';
import { encrypt, extractLastChars } from '../packages/api/src/lib/encryption';

async function reencryptApiKey(newPlaintextKey: string) {
  console.log('🔄 Re-encrypting API key...');

  // Get the existing API key record
  const results = await db.select().from(apiKeys).limit(1);

  if (results.length === 0) {
    console.log('❌ No API keys found in database');
    process.exit(1);
  }

  const existingKey = results[0];

  console.log('📋 Found API key:');
  console.log('   ID:', existingKey.id);
  console.log('   Provider:', existingKey.provider);
  console.log('   Name:', existingKey.name);
  console.log('   Last 4:', existingKey.keyLast4);

  // Validate the new key matches the last 4
  const newLast4 = extractLastChars(newPlaintextKey, 4);
  if (newLast4 !== existingKey.keyLast4) {
    console.log("\n⚠️  Warning: New key last 4 chars don't match!");
    console.log('   Existing last 4:', existingKey.keyLast4);
    console.log('   New key last 4:', newLast4);
    console.log('\n   Continue anyway? Press Ctrl+C to cancel, or Enter to continue...');
    await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });
  }

  // Encrypt the new key
  console.log('\n🔐 Encrypting new key...');
  const encryptedData = encrypt(newPlaintextKey);

  // Update the database
  console.log('📝 Updating database...');
  await db
    .update(apiKeys)
    .set({
      encryptedKey: encryptedData.encrypted,
      keyLast4: newLast4,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, existingKey.id));

  console.log('\n✅ Success! API key has been re-encrypted');
  console.log('   ID:', existingKey.id);
  console.log('   Provider:', existingKey.provider);
  console.log('   Name:', existingKey.name);
  console.log('\n🎉 You can now use the chat feature!');
}

// Main execution
async function main() {
  const apiKey = process.argv[2];

  if (!apiKey) {
    console.error('❌ Error: Please provide your API key as argument');
    console.error('\nUsage:');
    console.error('  bun run scripts/reencrypt-api-keys.ts <your-api-key>');
    console.error('\nExample:');
    console.error(
      '  bun run scripts/reencrypt-api-keys.ts sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    );
    process.exit(1);
  }

  if (apiKey.length < 8) {
    console.error('❌ Error: API key appears to be too short');
    process.exit(1);
  }

  try {
    await reencryptApiKey(apiKey);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

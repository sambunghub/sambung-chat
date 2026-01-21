/**
 * Re-encrypt API keys with new ENCRYPTION_KEY
 *
 * Usage:
 *   bun run scripts/reencrypt-api-keys.ts <actual-api-key> [--key-id <id>]
 *
 * Example (re-encrypt first found key):
 *   bun run scripts/reencrypt-api-keys.ts sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Example (re-encrypt specific key):
 *   bun run scripts/reencrypt-api-keys.ts sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --key-id 123
 */

import { db } from '@sambung-chat/db';
import { apiKeys } from '@sambung-chat/db/schema/api-key';
import { eq } from 'drizzle-orm';
import { encrypt, extractLastChars } from '@sambung-chat/api/lib/encryption';

async function reencryptApiKey(newPlaintextKey: string, keyId?: number) {
  console.log('🔄 Re-encrypting API key...');

  let results;

  if (keyId !== undefined) {
    // Re-encrypt specific key by ID
    console.log(`🔍 Looking for API key with ID: ${keyId}`);
    results = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
  } else {
    // Re-encrypt first available key (original behavior)
    console.log('🔍 Looking for first available API key...');
    results = await db.select().from(apiKeys).limit(1);
  }

  if (results.length === 0) {
    console.log(`❌ No API key found${keyId ? ` with ID ${keyId}` : ''} in database`);
    process.exit(1);
  }

  const existingKey = results[0]!;

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

    // Check if running in interactive TTY environment
    if (!process.stdin.isTTY) {
      console.error('\n❌ Error: Last 4 characters mismatch in non-interactive environment');
      console.error(
        '   This script requires interactive confirmation when key last 4 chars differ'
      );
      console.error('   Existing key last 4:', existingKey.keyLast4);
      console.error('   New key last 4:', newLast4);
      console.error('\n   Please verify the API key and try again');
      process.exit(1);
    }

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
  const args = process.argv.slice(2);
  const apiKey = args[0];

  // Parse --key-id argument
  let keyId: number | undefined;
  const keyIdIndex = args.indexOf('--key-id');
  if (keyIdIndex !== -1 && args[keyIdIndex + 1]) {
    const parsedKeyId = parseInt(args[keyIdIndex + 1], 10);
    if (isNaN(parsedKeyId)) {
      console.error('❌ Error: --key-id must be a valid number');
      process.exit(1);
    }
    keyId = parsedKeyId;
  }

  if (!apiKey || apiKey.startsWith('--key-id')) {
    console.error('❌ Error: Please provide your API key as first argument');
    console.error('\nUsage:');
    console.error('  bun run scripts/reencrypt-api-keys.ts <your-api-key> [--key-id <id>]');
    console.error('\nExamples:');
    console.error(
      '  bun run scripts/reencrypt-api-keys.ts sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    );
    console.error(
      '  bun run scripts/reencrypt-api-keys.ts sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --key-id 123'
    );
    process.exit(1);
  }

  if (apiKey.length < 8) {
    console.error('❌ Error: API key appears to be too short');
    process.exit(1);
  }

  try {
    await reencryptApiKey(apiKey, keyId);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

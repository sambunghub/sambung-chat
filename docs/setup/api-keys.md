# API Key Encryption Setup

**Version:** 0.1.0
**Last Updated:** January 20, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Encryption Key Generation](#encryption-key-generation)
3. [Environment Configuration](#environment-configuration)
4. [Key Rotation Process](#key-rotation-process)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

SambungChat uses **AES-256-GCM** encryption to secure API keys at rest in the database. This ensures that even if the database is compromised, API keys remain protected.

### Security Architecture

- **Algorithm**: AES-256-GCM (Authenticated Encryption with Associated Data)
- **Key Derivation**: scrypt with memory-hard parameters (cost: 2^14)
- **Random IV**: Unique 12-byte initialization vector per encryption
- **Authentication**: 16-byte GCM authentication tag prevents tampering
- **Key Storage**: Environment variable (never committed to git)

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Key Input  │────▶│  AES-256-GCM     │────▶│  Encrypted Data │
│  (sk-...)       │     │  Encryption      │     │  (Base64)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ├─ Random IV (12 bytes)
                              ├─ Auth Tag (16 bytes)
                              └─ Key from ENCRYPTION_KEY
```

---

## Encryption Key Generation

The `ENCRYPTION_KEY` environment variable must be a **32-byte base64-encoded key** (256 bits).

### Quick Generation

Choose one of the following methods to generate a secure encryption key:

#### Method 1: OpenSSL (Recommended)

```bash
openssl rand -base64 32
```

#### Method 2: Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Method 3: Bun

```bash
bun -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

#### Method 4: Using the Helper Script

```bash
bun run scripts/generate-encryption-key.ts
```

### Output Example

A valid `ENCRYPTION_KEY` looks like this:

```
dGhpc2lzYW5leGFtcGxlb2ZhMzJieXRlYmFzZTY0ZW5jb2RlZGtleQ==
```

**Characteristics:**

- Base64 encoded (only A-Z, a-z, 0-9, +, /, =)
- When decoded, exactly 32 bytes (256 bits)
- Unique per installation

### ⚠️ Security Warning

**CRITICAL:** Never use the example keys in documentation or commits. Always generate your own unique key.

**DATA LOSS WARNING:** If you lose your `ENCRYPTION_KEY`, all encrypted API keys in the database will be **permanently unreadable**. Back up this key securely.

---

## Environment Configuration

### Step 1: Set ENCRYPTION_KEY in Environment

Add the generated key to your environment file:

```bash
# apps/server/.env
ENCRYPTION_KEY=your-generated-base32-key-here
```

### Step 2: Validate Configuration

The application validates the `ENCRYPTION_KEY` at startup. If invalid, you'll see an error:

```
Error: ENCRYPTION_KEY must be a 32-byte base64-encoded key (256 bits).
Generate one with: openssl rand -base64 32
```

### Step 3: Verification

Test your configuration before deployment:

```bash
# Development
bun run dev

# Production (preview)
bun run build && bun run preview
```

If the application starts successfully, your encryption key is properly configured.

---

## Key Rotation Process

**WARNING:** Key rotation requires re-encrypting all API keys in the database. This operation is destructive if not done correctly.

### When to Rotate

- After a security incident
- On a regular schedule (e.g., annually)
- When an employee with access leaves
- If the key may have been compromised

### Rotation Steps

#### 1. Generate New Key

```bash
openssl rand -base64 32 > /tmp/new-encryption-key.txt
```

#### 2. Backup Current Key

```bash
# Save current key securely
cp apps/server/.env apps/server/.env.backup.$(date +%Y%m%d)
```

#### 3. Update Environment

```bash
# apps/server/.env
ENCRYPTION_KEY=new-generated-key-here
```

#### 4. Migration Required

⚠️ **IMPORTANT:** Simply changing the `ENCRYPTION_KEY` will break access to existing encrypted API keys. A migration script is needed to:

1. Decrypt all API keys with the old key
2. Re-encrypt them with the new key
3. Update the database

**Migration script coming soon.** For now, contact your database administrator for manual migration.

#### 5. Test Verification

After rotation:

```bash
# Test that API keys can be decrypted
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/rpc/apiKey/getAll
```

### Emergency Rollback

If issues occur:

```bash
# Restore previous key
cp apps/server/.env.backup.20260120 apps/server/.env
# Restart server
```

---

## Security Best Practices

### Key Storage

✅ **DO:**

- Store in environment files (`.env`)
- Use secret management systems (e.g., AWS Secrets Manager, HashiCorp Vault)
- Restrict file permissions (`chmod 600 .env`)
- Backup keys securely (encrypted storage)
- Use different keys for dev/staging/production

❌ **DON'T:**

- Commit keys to git
- Store in plain text files
- Share via chat/email
- Use weak or predictable keys
- Reuse keys across applications

### Key Generation

✅ **DO:**

- Use cryptographically secure random number generators
- Generate 32-byte keys (256 bits)
- Generate unique keys per environment
- Use proven methods (OpenSSL, Node.js crypto)

❌ **DON'T:**

- Use passwords or passphrases
- Use online "key generators"
- Use predictable patterns
- Use keys shorter than 32 bytes

### Access Control

✅ **DO:**

- Limit access to `.env` files
- Use different keys per environment
- Rotate keys regularly
- Audit access logs
- Use principle of least privilege

❌ **DON'T:**

- Share keys broadly
- Log keys in error messages
- Include keys in debug output
- Store keys in code

### Operational Security

✅ **DO:**

- Monitor for unauthorized access
- Use key rotation schedules
- Document key procedures
- Test recovery procedures
- Use secure deletion when decommissioning

❌ **DON'T:**

- Ignore security alerts
- Use production keys in development
- Skip key rotation
- Forget to backup keys
- Leave keys in terminated instances

---

## Troubleshooting

### Common Issues

#### Issue 1: "ENCRYPTION_KEY not set"

**Error:**

```
Error: ENCRYPTION_KEY environment variable is not set
```

**Solution:**

```bash
# Check if .env file exists
ls -la apps/server/.env

# Add ENCRYPTION_KEY to apps/server/.env
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> apps/server/.env
```

#### Issue 2: "Invalid base64 encoding"

**Error:**

```
Error: ENCRYPTION_KEY must be a 32-byte base64-encoded key
```

**Cause:** Key contains invalid characters or is not base64 encoded.

**Solution:**

```bash
# Verify the key is valid base64
echo "your-key-here" | base64 -d

# Regenerate if needed
openssl rand -base64 32
```

#### Issue 3: "Key length mismatch"

**Error:**

```
Error: ENCRYPTION_KEY must be exactly 32 bytes (256 bits), got 16 bytes
```

**Cause:** Key was generated with wrong parameters (e.g., `openssl rand -hex 16`).

**Solution:**

```bash
# Generate correct key
openssl rand -base64 32

# Verify length
openssl rand -base64 32 | base64 -d | wc -c
# Should output: 32
```

#### Issue 4: "Decryption failed"

**Error:**

```
Error: Decryption failed: Unsupported state or unable to authenticate data
```

**Cause:** Database contains API keys encrypted with a different `ENCRYPTION_KEY`.

**Solution:**

1. Restore the original `ENCRYPTION_KEY` from backup
2. Or re-encrypt all API keys with the new key (requires migration script)
3. See [Key Rotation Process](#key-rotation-process)

#### Issue 5: Tests failing with encryption errors

**Error:**

```
Error: ENCRYPTION_KEY is required for API key encryption
```

**Solution:**

```bash
# Set ENCRYPTION_KEY for tests
export ENCRYPTION_KEY=test-key-for-development-only-do-not-use-in-production-32b

# Run tests
bun run test
```

### Debugging

Enable debug logging to troubleshoot encryption issues:

```bash
# Set debug level
LOG_LEVEL=debug bun run dev

# Check encryption configuration
bun -e "import { validateEncryptionConfig } from './packages/api/src/lib/encryption.ts'; validateEncryptionConfig(); console.log('✅ Encryption config valid')"
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](../TROUBLESHOOTING.md)
2. Review [Environment Variables](../ENVIRONMENT.md)
3. Open an issue on [GitHub](https://github.com/sambunghub/sambung-chat/issues)

---

## Additional Resources

- [Environment Variables Reference](../ENVIRONMENT.md)
- [Security Best Practices](../architecture.md#security)
- [Database Schema](../database.md#api-keys-table)
- [API Documentation](./api.md)
- [Contributing Guide](../CONTRIBUTING.md)

---

**Last Updated:** January 20, 2026

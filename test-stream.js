// Test streaming functionality with Node.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/ai',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: process.env.SESSION_COOKIE || '',
  },
};

const testData = {
  messages: [
    {
      role: 'user',
      parts: [
        {
          type: 'text',
          text: 'Say "Hello, this is a streaming test!" and count to 5.',
        },
      ],
    },
  ],
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('\nStreaming response:');

  res.setEncoding('utf8');
  let chunkCount = 0;
  let fullText = '';

  res.on('data', (chunk) => {
    chunkCount++;
    process.stdout.write(chunk);
    fullText += chunk;
  });

  res.on('end', () => {
    console.log('\n\n--- Summary ---');
    console.log('Total chunks received:', chunkCount);
    console.log('Total characters:', fullText.length);

    if (chunkCount > 1) {
      console.log('✓ Streaming is working (multiple chunks received)');
    } else if (chunkCount === 1) {
      console.log('⚠ Single chunk received (may not be streaming)');
    } else {
      console.log('✗ No chunks received');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testData));
req.end();

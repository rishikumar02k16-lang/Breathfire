const https = require('https');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API key not configured on server' })
    };
  }

  try {
    // Parse and rebuild body with correct model
    const incoming = JSON.parse(event.body);
    const requestBody = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: incoming.max_tokens || 600,
      system: incoming.system,
      messages: incoming.messages
    });

    console.log('Calling Anthropic with model: claude-haiku-4-5-20251001');
    console.log('Messages count:', incoming.messages ? incoming.messages.length : 0);

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Anthropic response status:', res.statusCode);
          console.log('Anthropic response:', data.substring(0, 200));
          resolve({ statusCode: res.statusCode, body: data });
        });
      });

      req.on('error', (e) => {
        console.log('Request error:', e.message);
        reject(e);
      });
      req.write(requestBody);
      req.end();
    });

    return {
      statusCode: result.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: result.body
    };

  } catch (error) {
    console.log('Function error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

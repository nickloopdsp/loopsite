// api/gpt.js

export default async function handler(req, res) {
  // CORS Headers to allow your Cargo site to communicate with this backend
  res.setHeader('Access-Control-Allow-Origin', 'https://loopv1-copy.cargo.site'); // Replace with your Cargo site URL
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling preflight OPTIONS request');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`Method not allowed: ${req.method}`);
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  // Ensure that Content-Type is application/json
  if (req.headers['content-type'] !== 'application/json') {
    console.log(`Unsupported Content-Type: ${req.headers['content-type']}`);
    res.status(415).json({ error: 'Unsupported Media Type. Use application/json.' });
    return;
  }

  // Parse the JSON body manually
  let body = '';
  try {
    for await (const chunk of req) {
      body += chunk;
    }
    body = JSON.parse(body);
  } catch (error) {
    console.error('Error parsing request body:', error);
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const { message } = body;

  if (!message) {
    console.log('No message provided in the request');
    res.status(400).json({ error: 'No message provided.' });
    return;
  }

  try {
    console.log(`Received message: "${message}"`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
        messages: [{ role: 'user', content: message }]
      })
    });

    console.log(`OpenAI API responded with status: ${response.status}`);

    // Check if the response from OpenAI is OK
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ error: errorData.error.message || 'OpenAI API error.' });
    }

    const data = await response.json();

    console.log('OpenAI API response data:', JSON.stringify(data));

    // Ensure the response structure is as expected
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Unexpected OpenAI API response structure:', data);
      return res.status(500).json({ error: 'Unexpected response from OpenAI API.' });
    }

    const botReply = data.choices[0].message.content;

    console.log(`Bot reply: "${botReply}"`);

    res.status(200).json({ reply: botReply });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Error calling OpenAI API.' });
  }
}

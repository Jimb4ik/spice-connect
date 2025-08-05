import fetch from 'node-fetch';

const API_KEY = process.env.SPICE_API_KEY;
const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Upload photo endpoint called');
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);

  const sessionId = req.query.session_id;
  const isPrivate = req.query.is_private || '0';

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  console.log('Session ID:', sessionId);
  console.log('Is Private:', isPrivate);

  try {
    // Since direct API works, let's just proxy the request body directly
    console.log('Content-Type:', req.headers['content-type']);
    
    // Build URL with parameters  
    const url = `${BASE_URL}/ajax_api/upload_photo?session_id=${sessionId}&api_key=${API_KEY}&is_private=${isPrivate}`;
    
    console.log('Proxying to:', url.replace(API_KEY, 'HIDDEN_KEY'));

    // Forward the request directly to Spice API
    const response = await fetch(url, {
      method: 'POST',
      body: req,
      headers: {
        'Content-Type': req.headers['content-type']
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);
      res.status(response.status).json(data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).json({
        error: 'Invalid response from API',
        details: responseText,
        parseError: parseError.message
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
}
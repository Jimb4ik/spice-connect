// Simple endpoint to provide API key from environment variables
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const API_KEY = process.env.SPICE_API_KEY;
    const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';
  
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
  
    res.json({
      apiKey: API_KEY,
      baseUrl: BASE_URL
    });
  }
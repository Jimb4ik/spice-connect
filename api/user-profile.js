/**
 * User Profile API Proxy
 * Simple endpoint to get user profile data including email
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    const BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';
    const API_KEY = process.env.SPICE_API_KEY;
  
    if (!API_KEY) {
      return res.status(500).json({ 
        error: 'API_KEY not configured',
        success: false 
      });
    }
  
    try {
      const { session_id, id, pseudo } = req.method === 'GET' ? req.query : req.body;
      
      if (!session_id || (!id && !pseudo)) {
        return res.status(400).json({ 
          error: 'session_id and (id or pseudo) are required',
          success: false 
        });
      }
      
      // Build query parameters (API requires api_key in URL)
      const queryParams = new URLSearchParams({
        api_key: API_KEY,
        session_id: session_id
      });
      
      // Add id or pseudo parameter
      if (id) {
        queryParams.append('id', id);
      } else {
        queryParams.append('pseudo', pseudo);
      }
      
      const apiUrl = `${BASE_URL}/index_api/user?${queryParams}`;
      
      // console.log('[USER-PROFILE] Request to:', apiUrl.replace(API_KEY, 'HIDDEN_KEY'));
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Lavrilo/1.0'
        }
      });
  
      const data = await response.json();
      
      // console.log('[USER-PROFILE] Response status:', response.status);
      // console.log('[USER-PROFILE] Response data:', data);
  
      // Check if request was successful
      const isSuccess = response.ok && data.connected === 1 && data.result;
      
      const enhancedData = {
        ...data,
        success: isSuccess
      };
  
      res.status(response.ok ? 200 : 400).json(enhancedData);
      
    } catch (error) {
      console.error('[USER-PROFILE] Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        success: false,
        details: error.message 
      });
    }
  }

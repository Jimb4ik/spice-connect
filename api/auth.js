/**
 * Lavrilo Authentication API Proxy
 * Handles login, registration, and password recovery
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
      const { action, ...params } = req.method === 'GET' ? req.query : req.body;
      
      let endpoint = '';
      let method = 'POST';
      
      // Determine endpoint based on action
      switch (action) {
        case 'login':
          endpoint = '/index_api/login';
          break;
        case 'register':
          endpoint = '/index_api/subscribe';
          break;
        case 'changepass':
          endpoint = '/index_api/changepass';
          break;
        case 'logout':
          endpoint = '/index_api/logout';
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid action',
            success: false 
          });
      }
  
      // Build query parameters (API requires api_key in URL)
      const queryParams = new URLSearchParams({
        api_key: API_KEY,
        ...params
      });
  
      const apiUrl = `${BASE_URL}${endpoint}?${queryParams}`;
      
      console.log(`[AUTH API] ${action.toUpperCase()} request to:`, apiUrl);
  
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Lavrilo/1.0'
        }
      });
  
      const data = await response.json();
      
      console.log(`[AUTH API] ${action.toUpperCase()} response:`, data);
  
      // Enhance response with success flag
      // For registration: check accepted === 1 and presence of user_id/session_id
      // For login: check connected === 1
      // For other actions: check error === 0 or result === 'ok'
      let isSuccess = false;
      
      if (action === 'register') {
        // Registration is successful if accepted and we have user_id and session_id
        isSuccess = data.accepted === 1 && data.user_id && data.session_id;
      } else if (action === 'login') {
        // Login is successful if connected
        isSuccess = data.connected === 1;
      } else {
        // Other actions use generic success criteria
        isSuccess = data.error === 0 || data.result === 'ok';
      }
      
      const enhancedData = {
        ...data,
        success: isSuccess
      };
  
      res.status(response.ok ? 200 : 400).json(enhancedData);
      
    } catch (error) {
      console.error('[AUTH API] Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        success: false,
        details: error.message 
      });
    }
  }
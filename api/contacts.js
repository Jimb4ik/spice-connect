/**
 * Lavrilo Contacts API Proxy
 * Handles contact creation, friend requests, and contact management
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
      const { action, session_id, user_id, ...params } = req.method === 'GET' ? req.query : req.body;
      
      if (!session_id) {
        return res.status(400).json({ 
          error: 'Session ID required',
          success: false 
        });
      }
      
      let endpoint = '';
      let method = 'POST';
      
      // Determine endpoint based on action
      switch (action) {
        case 'add_contact':
          endpoint = '/ajax_api/add_contact';
          break;
        case 'add_friend':
          endpoint = '/ajax_api/add_friend';
          break;
        case 'load_contacts':
          endpoint = '/ajax_api/load_contacts';
          method = 'GET';
          break;
        case 'remove_contact':
          endpoint = '/ajax_api/remove_contact';
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid action. Use: add_contact, add_friend, load_contacts, remove_contact',
            success: false 
          });
      }
  
      // Build query parameters (API requires api_key in URL)
      const queryParams = new URLSearchParams({
        api_key: API_KEY,
        session_id: session_id,
        ...params
      });
      
      // Add user_id if provided
      if (user_id) {
        queryParams.set('id_user', user_id);
        queryParams.set('user_id', user_id);
      }
  
      const apiUrl = `${BASE_URL}${endpoint}?${queryParams}`;
      
      console.log(`[CONTACTS API] ${action.toUpperCase()} request to:`, apiUrl.replace(API_KEY, 'HIDDEN_KEY'));
  
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Lavrilo/1.0'
        }
      });
  
      const data = await response.json();
      
      console.log(`[CONTACTS API] ${action.toUpperCase()} response:`, data);
  
      // Return the response
      return res.status(200).json({
        success: true,
        data: data,
        action: action
      });
      
    } catch (error) {
      console.error(`[CONTACTS API] Error:`, error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to process contact request',
        details: error.message 
      });
    }
  }
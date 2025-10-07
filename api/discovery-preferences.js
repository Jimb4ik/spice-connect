/**
 * Discovery Preferences API
 * Handles saving and loading user discovery preferences
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
        if (req.method === 'POST') {
            // Save discovery preferences
            return await saveDiscoveryPreferences(req, res, BASE_URL, API_KEY);
        } else if (req.method === 'GET') {
            // Load current user profile to get preferences
            return await loadDiscoveryPreferences(req, res, BASE_URL, API_KEY);
        }
        
        return res.status(405).json({ 
            error: 'Method not allowed',
            success: false 
        });
        
    } catch (error) {
        console.error('[DISCOVERY-PREFERENCES] Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            success: false,
            details: error.message
        });
    }
}

/**
 * Save discovery preferences using wanttomeet API
 */
async function saveDiscoveryPreferences(req, res, BASE_URL, API_KEY) {
    const { 
        session_id, 
        cherche1,      // Gender preference (1=male, 2=female, 3=couple)
        with_age,      // Age range array
        pour           // Dating type preference
    } = req.body;
    
    if (!session_id) {
        return res.status(400).json({ 
            error: 'session_id is required',
            success: false 
        });
    }
    
    // Build query parameters for wanttomeet API
    const queryParams = new URLSearchParams({
        api_key: API_KEY,
        session_id: session_id
    });
    
    // Add optional parameters
    if (cherche1) queryParams.append('cherche1', cherche1);
    if (pour) queryParams.append('pour', pour);
    if (with_age && Array.isArray(with_age)) {
        with_age.forEach(age => queryParams.append('with_age[]', age));
    }
    
    const apiUrl = `${BASE_URL}/index_api/user/modify/wanttomeet?${queryParams}`;
    
    // console.log('[DISCOVERY-PREFERENCES] Saving preferences to:', apiUrl.replace(API_KEY, 'HIDDEN_KEY'));
    // console.log('[DISCOVERY-PREFERENCES] Parameters:', { cherche1, with_age, pour });

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Lavrilo/1.0'
        }
    });

    const data = await response.json();
    
    // console.log('[DISCOVERY-PREFERENCES] Save response:', data);

    const isSuccess = response.ok && (data.result === 'success' || data.success === true);
    
    return res.status(response.status).json({
        ...data,
        success: isSuccess
    });
}

/**
 * Load current user profile to get discovery preferences
 */
async function loadDiscoveryPreferences(req, res, BASE_URL, API_KEY) {
    const { session_id, user_id } = req.query;
    
    if (!session_id || !user_id) {
        return res.status(400).json({ 
            error: 'session_id and user_id are required',
            success: false 
        });
    }
    
    // Build query parameters for user profile API
    const queryParams = new URLSearchParams({
        api_key: API_KEY,
        session_id: session_id,
        id: user_id
    });
    
    const apiUrl = `${BASE_URL}/index_api/user?${queryParams}`;
    
    // console.log('[DISCOVERY-PREFERENCES] Loading preferences from:', apiUrl.replace(API_KEY, 'HIDDEN_KEY'));

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Lavrilo/1.0'
        }
    });

    const data = await response.json();
    
    // console.log('[DISCOVERY-PREFERENCES] Load response:', data);

    const isSuccess = response.ok && data.connected === 1 && data.result;
    
    if (isSuccess) {
        // Extract discovery preferences from user profile
        const profile = data.result;
        const preferences = {
            cherche1: profile.cherche1 || 2, // Default to female
            pour: profile.pour || 1,         // Default to first dating type
            age_min: profile.age_min || 18,  // Default age range
            age_max: profile.age_max || 80
        };
        
        return res.status(200).json({
            success: true,
            preferences: preferences,
            profile: profile
        });
    }
    
    return res.status(response.status).json({
        ...data,
        success: isSuccess
    });
}

// API for admin panel to fetch user data from Spice API
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;
    const SPICE_API_KEY = process.env.SPICE_API_KEY || '';
    const SPICE_BASE_URL = process.env.SPICE_BASE_URL || 'https://dev2018.de5a7.com';

    if (!SPICE_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'SPICE_API_KEY not configured'
        });
    }

    try {
        switch (action) {
            case 'search_users':
                return await searchUsers(req, res, SPICE_BASE_URL, SPICE_API_KEY);
            
            case 'get_user':
                return await getUser(req, res, SPICE_BASE_URL, SPICE_API_KEY);
            
            case 'get_user_transactions':
                return await getUserTransactions(req, res, SPICE_BASE_URL, SPICE_API_KEY);
            
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
        }
    } catch (error) {
        console.error('[ADMIN-API] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Search users using Spice API
async function searchUsers(req, res, baseUrl, apiKey) {
    const { 
        limit = 100, 
        page = 0,
        sex = '',
        is_online = '',
        age_from = '',
        age_to = ''
    } = req.query;

    try {
        // Build query parameters for Spice API
        const params = new URLSearchParams({
            api_key: apiKey,
            page: page,
            pas: limit
        });

        if (sex) params.append('sex', sex);
        if (is_online) params.append('is_online', is_online);
        if (age_from) params.append('age_from', age_from);
        if (age_to) params.append('age_to', age_to);

        console.log('[ADMIN-API] Searching users with params:', params.toString());

        const apiUrl = `${baseUrl}/index_api/search?${params.toString()}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('[ADMIN-API] Search response:', result);

        // Check if the result has users
        if (result && result.result) {
            // Transform user data for admin panel
            const users = result.result.map(user => ({
                id: user.id_membre || user.id,
                pseudo: user.pseudo || user.nickname || 'Unknown',
                email: user.email || 'N/A',
                age: user.age || null,
                city: user.ville || user.city || 'Unknown',
                sexe1: user.sexe1 || null,
                status: user.is_online ? 'online' : 'active',
                credits: user.credits || 0,
                created_at: user.date_inscription || user.created_at || null,
                profile_views: user.visite || 0,
                matches: user.matches || 0,
                last_login: user.last_connection || null
            }));

            return res.status(200).json({
                success: true,
                data: users,
                total: result.total || users.length,
                page: parseInt(page),
                limit: parseInt(limit)
            });
        } else {
            return res.status(200).json({
                success: true,
                data: [],
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit)
            });
        }
    } catch (error) {
        console.error('[ADMIN-API] Error searching users:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Get specific user details
async function getUser(req, res, baseUrl, apiKey) {
    const { user_id, session_id } = req.query;

    if (!user_id && !session_id) {
        return res.status(400).json({
            success: false,
            error: 'user_id or session_id required'
        });
    }

    try {
        const params = new URLSearchParams({
            api_key: apiKey
        });

        if (user_id) params.append('id', user_id);
        if (session_id) params.append('session_id', session_id);

        const apiUrl = `${baseUrl}/index_api/user?${params.toString()}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result && result.user) {
            const user = result.user;
            return res.status(200).json({
                success: true,
                data: {
                    id: user.id_membre || user.id,
                    pseudo: user.pseudo || user.nickname,
                    email: user.email,
                    age: user.age,
                    city: user.ville || user.city,
                    sexe1: user.sexe1,
                    status: user.is_online ? 'online' : 'active',
                    credits: user.credits || 0,
                    created_at: user.date_inscription,
                    profile_views: user.visite || 0,
                    matches: user.matches || 0,
                    last_login: user.last_connection,
                    profile_complete: user.profil_rempli || false,
                    photos: user.tab_photo || [],
                    description: user.description || ''
                }
            });
        } else {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
    } catch (error) {
        console.error('[ADMIN-API] Error getting user:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Get user transactions from our database
async function getUserTransactions(req, res, baseUrl, apiKey) {
    const { user_id, session_id, limit = 50 } = req.query;

    if (!user_id && !session_id) {
        return res.status(400).json({
            success: false,
            error: 'user_id or session_id required'
        });
    }

    try {
        // Call our wallet-transactions API
        const transactionsUrl = new URL('/api/wallet-transactions', 
            `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`);
        
        transactionsUrl.searchParams.append('action', 'get_wallet_transactions');
        if (user_id) transactionsUrl.searchParams.append('user_id', user_id);
        if (session_id) transactionsUrl.searchParams.append('session_id', session_id);
        transactionsUrl.searchParams.append('limit', limit);

        const response = await fetch(transactionsUrl.toString());
        const result = await response.json();

        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data,
                wallet: result.wallet
            });
        } else {
            return res.status(200).json({
                success: true,
                data: [],
                wallet: null
            });
        }
    } catch (error) {
        console.error('[ADMIN-API] Error getting user transactions:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}



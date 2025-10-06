// Admin Panel JavaScript - Lavrilo CRM

// Global variables
window.allUsers = [];
window.allTransactions = [];
window.filteredUsers = [];
window.currentPage = 1;
window.usersPerPage = 20;

// Check authentication
function checkAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
        window.location.href = 'admin-auth.html';
        return false;
    }
    
    try {
        const session = JSON.parse(adminSession);
        // Check if session is still valid (less than 24 hours old)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursSinceLogin >= 24) {
            // Session expired
            localStorage.removeItem('adminSession');
            window.location.href = 'admin-auth.html';
            return false;
        }
        
        // Update UI with admin name
        document.getElementById('adminName').textContent = session.username;
        document.getElementById('headerAdminName').textContent = session.username;
        
        return true;
    } catch (e) {
        localStorage.removeItem('adminSession');
        window.location.href = 'admin-auth.html';
        return false;
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminSession');
        window.location.href = 'admin-auth.html';
    }
}

// Navigation (variables already declared globally above)

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    // Setup navigation
    setupNavigation();
    
    // Load dashboard data
    loadDashboard();
    
    // Load users
    loadUsers();
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
            
            // Update page title
            const pageTitle = item.querySelector('span:last-child').textContent;
            document.getElementById('pageTitle').textContent = pageTitle;
            
            // Load section data
            switch(targetSection) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'transactions':
                    loadTransactions();
                    break;
                case 'moderation':
                    loadModeration();
                    break;
            }
        });
    });
}

// Load Dashboard
async function loadDashboard() {
    try {
        // Simulate loading dashboard stats
        // В реальном приложении здесь будут API вызовы
        
        // Update stats
        document.getElementById('totalUsers').textContent = '37,542';
        document.getElementById('activeToday').textContent = '1,247';
        document.getElementById('totalRevenue').textContent = '$124,567';
        document.getElementById('pendingModeration').textContent = '12';
        
        // Quick stats
        document.getElementById('newUsers24h').textContent = '156';
        document.getElementById('matchesToday').textContent = '892';
        document.getElementById('messagesToday').textContent = '3,421';
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    
    const activities = [
        { user: 'Alex Johnson', action: 'Credits Purchased', amount: '+500 Credits', time: '2 min ago', avatar: 'AJ' },
        { user: 'Maria Garcia', action: 'New Registration', time: '15 min ago', avatar: 'MG' },
        { user: 'John Smith', action: 'Profile Updated', time: '32 min ago', avatar: 'JS' },
        { user: 'Emma Wilson', action: 'Credits Purchased', amount: '+250 Credits', time: '1 hour ago', avatar: 'EW' },
        { user: 'David Brown', action: 'Withdrawal Request', amount: '$45.00', time: '2 hours ago', avatar: 'DB' }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-avatar">${activity.avatar}</div>
            <div class="activity-info">
                <strong>${activity.user}</strong>
                <small>${activity.action} ${activity.amount || ''} • ${activity.time}</small>
            </div>
        </div>
    `).join('');
}

// Load Users
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Loading users...</td></tr>';
    
    try {
        // Check if we have API key
        const apiKeyResponse = await fetch('/api/get-api-key');
        const apiKeyData = await apiKeyResponse.json();
        
        if (!apiKeyData.apiKey) {
            throw new Error('API key not available');
        }
        
        // Use search API like in search.html to get all users
        const params = new URLSearchParams({
            page: 0,
            pas: 100, // Get 100 users at once
            is_photo: 1, // Only users with photos
            get_picture_430: 1 // Get high-res photos
        });
        
        console.log('[ADMIN] Loading users with params:', params.toString());
        
        const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&${params.toString()}`);
        const result = await response.json();
        
        console.log('[ADMIN] Users API response:', result);
        
        if (result.success && result.data && result.data.result) {
            allUsers = result.data.result.map(user => ({
                id: user.id || user.id_membre,
                pseudo: user.pseudo,
                prenom: user.prenom,
                age: user.age,
                sexe1: user.sexe1,
                location: user.zone_name || 'Unknown',
                status: user.online === 1 ? 'online' : 'active',
                photoCount: user.photo || 0,
                rating: user.moyenne || 0,
                votes: user.vote || 0,
                photos_v2: user.photos_v2 || [],
                photos: user.photos || []
            }));
            
            filteredUsers = [...allUsers];
            displayUsers();
        } else {
            // Fallback to demo data if API fails
            console.warn('[ADMIN] Failed to load users from API, using demo data');
            loadDemoUsers();
        }
    } catch (error) {
        console.error('[ADMIN] Error loading users:', error);
        loadDemoUsers();
    }
}

function loadDemoUsers() {
    // Demo users for testing
    allUsers = [
        {
            id: 1,
            pseudo: 'alex_johnson',
            email: 'alex.johnson@email.com',
            age: 28,
            city: 'New York',
            status: 'online',
            credits: 1250,
            created_at: '2025-01-15T10:30:00Z'
        },
        {
            id: 2,
            pseudo: 'maria_garcia',
            email: 'maria.garcia@email.com',
            age: 25,
            city: 'Los Angeles',
            status: 'active',
            credits: 850,
            created_at: '2025-02-10T14:20:00Z'
        },
        {
            id: 3,
            pseudo: 'john_smith',
            email: 'john.smith@email.com',
            age: 32,
            city: 'Chicago',
            status: 'inactive',
            credits: 500,
            created_at: '2024-12-05T09:15:00Z'
        },
        {
            id: 4,
            pseudo: 'emma_wilson',
            email: 'emma.wilson@email.com',
            age: 27,
            city: 'Miami',
            status: 'online',
            credits: 2100,
            created_at: '2025-03-01T16:45:00Z'
        },
        {
            id: 5,
            pseudo: 'david_brown',
            email: 'david.brown@email.com',
            age: 30,
            city: 'Houston',
            status: 'active',
            credits: 750,
            created_at: '2025-01-20T11:30:00Z'
        }
    ];
    
    filteredUsers = [...allUsers];
    displayUsers();
}

function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex);
    
    if (usersToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = usersToDisplay.map(user => {
        // Get photo URL (like in search-page.js)
        let photoUrl = null;
        if (user.photos_v2 && user.photos_v2.length > 0) {
            const photo = user.photos_v2[0];
            photoUrl = photo.sq_middle || photo.sq_430 || photo.normal || photo.sq_small;
        } else if (user.photos && user.photos.length > 0) {
            const photo = user.photos[0];
            photoUrl = photo.url_middle || photo.url_big || photo.url_small;
        }
        
        const initials = user.pseudo ? user.pseudo.substring(0, 2).toUpperCase() : 'XX';
        
        // Gender icon and text - FIX: проверяем sexe1 правильно
        let genderIcon, genderText;
        if (user.sexe1 === 1) {
            genderIcon = '♂';
            genderText = 'Male';
        } else if (user.sexe1 === 2) {
            genderIcon = '♀';
            genderText = 'Female';
        } else if (user.sexe1 === 3) {
            genderIcon = '⚥';
            genderText = 'Couple';
        } else {
            genderIcon = '?';
            genderText = 'Unknown';
        }
        
        // Status - заменяем на verified/not verified
        const isVerified = user.status === 'online' || user.photoCount > 0;
        const statusText = isVerified ? 'verified' : 'not verified';
        const statusClass = isVerified ? 'online' : 'inactive';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        ${photoUrl ? 
                            `<img src="${photoUrl}" alt="${user.pseudo}" class="user-avatar" style="object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="user-avatar" style="display: none;">${initials}</div>` :
                            `<div class="user-avatar">${initials}</div>`
                        }
                        <div class="user-info">
                            <strong>${user.pseudo || 'Unknown'}</strong>
                            <small>#${user.id}</small>
                        </div>
                    </div>
                </td>
                <td>${user.age || 'N/A'}</td>
                <td>${user.location || 'Unknown'}</td>
                <td>${genderIcon} ${genderText}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${user.photoCount || 0} photos</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action primary" onclick="window.viewUser(${user.id})">View</button>
                        <button class="btn-action" onclick="window.editUser(${user.id})">Edit</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayUsers();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayUsers();
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const genderFilter = document.getElementById('genderFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    console.log('[ADMIN] Searching with:', { searchTerm, genderFilter, statusFilter });
    
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            (user.pseudo && user.pseudo.toLowerCase().includes(searchTerm)) ||
            (user.prenom && user.prenom.toLowerCase().includes(searchTerm)) ||
            (user.id && user.id.toString().includes(searchTerm));
        
        const matchesGender = !genderFilter || user.sexe1 === parseInt(genderFilter);
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        return matchesSearch && matchesGender && matchesStatus;
    });
    
    console.log('[ADMIN] Filtered results:', filteredUsers.length);
    
    currentPage = 1;
    displayUsers();
}

// Load Transactions (variable already declared globally above)

async function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Loading transactions...</td></tr>';
    
    try {
        // Load generated transactions data
        const response = await fetch('generated-transactions-data.js');
        const scriptText = await response.text();
        
        // Extract JSON from the script
        const match = scriptText.match(/const generatedTransactions = (\[[\s\S]*?\]);/);
        if (match) {
            allTransactions = JSON.parse(match[1]);
            
            // Get user data to map user IDs to names
            await enrichTransactionsWithUserData();
            
            displayTransactions(allTransactions);
        } else {
            throw new Error('Failed to parse transactions data');
        }
    } catch (error) {
        console.error('[ADMIN] Error loading transactions:', error);
        loadDemoTransactions();
    }
}

async function enrichTransactionsWithUserData() {
    // Map user IDs to user names from our loaded users
    const userMap = {};
    allUsers.forEach(user => {
        userMap[user.id] = user.pseudo || `User #${user.id}`;
    });
    
    // Enrich transactions with user names
    allTransactions.forEach(txn => {
        txn.from_user_name = txn.from_user_id ? (userMap[txn.from_user_id] || `User #${txn.from_user_id}`) : '—';
        txn.to_user_name = txn.to_user_id ? (userMap[txn.to_user_id] || `User #${txn.to_user_id}`) : '—';
    });
}

function loadDemoTransactions() {
    // Fallback demo data
    allTransactions = [
        {
            id: '804fddf3-d4a8-499f-bd69-0d8a78c41eab',
            type: 'purchase',
            from_user_id: null,
            to_user_id: null,
            from_user_name: 'System',
            to_user_name: 'Alex Johnson',
            amount: 50,
            currency: 'EUR',
            credits: 500,
            payment_method: 'Card',
            description: 'Credit purchase: 500 credits',
            date: new Date().toISOString(),
            status: 'completed'
        }
    ];
    
    displayTransactions(allTransactions);
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No transactions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.slice(0, 50).map(txn => {
        // Format transaction ID (show first 8 characters)
        const shortId = txn.id.length > 16 ? txn.id.substring(0, 16) + '...' : txn.id;
        
        // Format date
        const date = new Date(txn.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format amount
        let amountDisplay = '';
        if (txn.type === 'purchase') {
            amountDisplay = `€${txn.amount}`;
        } else if (txn.type === 'payout') {
            amountDisplay = `$${txn.amount}`;
        } else if (txn.type === 'gift') {
            amountDisplay = `${txn.amount} credits`;
        }
        
        // Details
        let details = txn.description || '';
        if (txn.credits && txn.type === 'purchase') {
            details = `+${txn.credits} credits`;
        } else if (txn.payment_method && txn.type === 'payout') {
            details = txn.payment_method;
        } else if (txn.gift_name) {
            details = txn.gift_name;
        }
        
        return `
            <tr>
                <td><small style="font-family: monospace;">${shortId}</small></td>
                <td>${txn.from_user_name || '—'}</td>
                <td>${txn.to_user_name || '—'}</td>
                <td><span class="transaction-type ${txn.type}">${txn.type}</span></td>
                <td><strong>${amountDisplay}</strong></td>
                <td><small>${details}</small></td>
                <td>${date}</td>
                <td><span class="status-badge ${txn.status}">${txn.status}</span></td>
            </tr>
        `;
    }).join('');
}

function searchTransactions() {
    // Implement transaction search
    console.log('Searching transactions...');
}

// Load Moderation Queue
function loadModeration() {
    const moderationQueue = document.getElementById('moderationQueue');
    
    const pendingItems = [
        {
            type: 'profile_photo',
            user: 'New User',
            content: 'Profile photo verification',
            submitted: '2 hours ago'
        },
        {
            type: 'id_document',
            user: 'John Doe',
            content: 'ID verification document',
            submitted: '5 hours ago'
        }
    ];
    
    moderationQueue.innerHTML = `
        <div class="card">
            <h3>Pending Verification (${pendingItems.length})</h3>
            ${pendingItems.map(item => `
                <div class="activity-item" style="margin-bottom: 12px;">
                    <div class="activity-avatar" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <img src="icons/admin/document.png" alt="Document" style="width: 24px; height: 24px; filter: brightness(0) invert(1);">
                    </div>
                    <div class="activity-info">
                        <strong>${item.user}</strong>
                        <small>${item.content} • ${item.submitted}</small>
                    </div>
                    <div class="action-buttons">
                        <button class="btn-action primary">Approve</button>
                        <button class="btn-action">Reject</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// View User Details
async function viewUser(userId) {
    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('modalUserContent');
    const modalTitle = document.getElementById('modalUserName');
    
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    modalTitle.textContent = user.pseudo || 'User Details';
    modalContent.innerHTML = '<div class="loading" style="padding: 40px; text-align: center;">Loading detailed profile...</div>';
    modal.classList.add('active');
    
    try {
        // Load full user profile with credits and other data
        const profileResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/user&method=POST&id=${userId}`);
        const profileResult = await profileResponse.json();
        
        console.log('[ADMIN] User profile response:', profileResult);
        
        let fullProfile = user; // Fallback to basic user data
        let credits = 0;
        let joinDate = 'N/A';
        
        if (profileResult.success && profileResult.data && profileResult.data.result) {
            fullProfile = { ...user, ...profileResult.data.result };
            credits = fullProfile.credits || fullProfile.credit || 0;
            joinDate = fullProfile.date || fullProfile.created_at;
        }
        
        // Get user transactions from allTransactions
        const userTransactions = allTransactions.filter(txn => 
            txn.from_user_id === userId || txn.to_user_id === userId
        );
        
        console.log('[ADMIN] User transactions:', userTransactions);
        
        const walletBalance = credits;
        
        // Load gifts data
        const giftsResponse = await fetch(`/api/database?action=get_received_gifts&user_id=${userId}&limit=20`);
        const giftsResult = await giftsResponse.json();
        
        console.log('[ADMIN] Gifts data:', giftsResult);
        
        const receivedGifts = giftsResult.success && giftsResult.data ? giftsResult.data : [];
        const monetizableGifts = receivedGifts.filter(g => g.status !== 'monetized');
        const totalWithdrawable = monetizableGifts.reduce((sum, g) => {
            const giftValue = g.purchase_price_credits || 0;
            const withdrawableValue = giftValue * 0.1 * 0.1; // 10% conversion, 1 credit = $0.1
            return sum + withdrawableValue;
        }, 0);
        
        // Check ID verification status (placeholder - needs implementation)
        const idVerified = fullProfile.id_verified || 'Not Provided';
        
        // Display detailed profile
        displayDetailedProfile(fullProfile, walletBalance, userTransactions, receivedGifts, totalWithdrawable, idVerified);
        
    } catch (error) {
        console.error('[ADMIN] Error loading user details:', error);
        modalContent.innerHTML = `
            <div class="error" style="padding: 40px; text-align: center; color: #ef4444;">
                <h3>Error Loading Profile</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="viewUser(${userId})">Retry</button>
            </div>
        `;
    }
}

function displayDetailedProfile(user, credits, transactions, gifts, withdrawable, idStatus) {
    const modalContent = document.getElementById('modalUserContent');
    
    // Photo URL
    let photoUrl = null;
    if (user.photos_v2 && user.photos_v2.length > 0) {
        photoUrl = user.photos_v2[0].sq_430 || user.photos_v2[0].normal;
    } else if (user.photos && user.photos.length > 0) {
        photoUrl = user.photos[0].url_big || user.photos[0].url_middle;
    }
    
    const initials = user.pseudo ? user.pseudo.substring(0, 2).toUpperCase() : 'XX';
    
    modalContent.innerHTML = `
        <!-- Profile Header -->
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
            ${photoUrl ? 
                `<img src="${photoUrl}" alt="${user.pseudo}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #667eea;">` :
                `<div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold;">${initials}</div>`
            }
            <div style="flex: 1;">
                <h2 style="margin: 0 0 8px 0;">${user.pseudo || 'Unknown User'}</h2>
                <p style="margin: 0; color: #6b7280;">ID: #${user.id} • ${user.age || 'N/A'} years • ${user.location || user.zone_name || 'Unknown Location'}</p>
                <p style="margin: 8px 0 0 0;">
                    <span class="status-badge ${user.status}">${user.status || 'active'}</span>
                    <span class="status-badge" style="margin-left: 8px;">${user.sexe1 === 1 ? 'Male' : user.sexe1 === 2 ? 'Female' : 'Couple'}</span>
                </p>
            </div>
        </div>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;">
            <div class="stat-card" style="text-align: center;">
                <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2); margin: 0 auto 12px;">
                    <img src="icons/admin/credits.png" alt="Credits" class="stat-icon-img">
                </div>
                <h3 style="margin: 0; font-size: 32px; color: #667eea;">${credits}</h3>
                <p style="margin: 4px 0 0; color: #6b7280;">Credits Balance</p>
            </div>
            
            <div class="stat-card" style="text-align: center;">
                <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7); margin: 0 auto 12px;">
                    <img src="icons/admin/credits.png" alt="Withdrawable" class="stat-icon-img">
                </div>
                <h3 style="margin: 0; font-size: 32px; color: #10b981;">$${withdrawable.toFixed(2)}</h3>
                <p style="margin: 4px 0 0; color: #6b7280;">Available for Withdrawal</p>
            </div>
            
            <div class="stat-card" style="text-align: center;">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c); margin: 0 auto 12px;">
                    <img src="icons/admin/status.png" alt="ID" class="stat-icon-img">
                </div>
                <h3 style="margin: 0; font-size: 20px; color: #ef4444;">${idStatus}</h3>
                <p style="margin: 4px 0 0; color: #6b7280;">ID Verification</p>
            </div>
        </div>
        
        <!-- Tabs -->
        <div class="profile-tabs" style="border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;">
            <button class="profile-tab active" onclick="switchProfileTab(event, 'transactions')">Transactions</button>
            <button class="profile-tab" onclick="switchProfileTab(event, 'gifts')">Gifts Inventory</button>
            <button class="profile-tab" onclick="switchProfileTab(event, 'details')">Full Details</button>
        </div>
        
        <!-- Tab Content -->
        <div id="profile-tab-transactions" class="profile-tab-content active">
            <h3>Transactions History (${transactions.length})</h3>
            ${transactions.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Type</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">With</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Amount</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Details</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(txn => {
                                let amountDisplay = '', amountColor = '#10b981', withUser = '', details = '';
                                if (txn.type === 'purchase') {
                                    amountDisplay = `+${txn.credits || txn.amount * 10} credits`;
                                    withUser = 'System';
                                    details = txn.payment_method ? \`€\${txn.amount} via \${txn.payment_method}\` : \`€\${txn.amount}\`;
                                } else if (txn.type === 'payout') {
                                    amountDisplay = \`$\${txn.amount}\`;
                                    amountColor = '#3b82f6';
                                    withUser = 'Bank (OCT)';
                                    details = 'Gift monetization';
                                } else if (txn.type === 'gift') {
                                    withUser = txn.from_user_id === user.id ? txn.to_user_name : txn.from_user_name;
                                    details = txn.gift_name || 'Gift';
                                    if (txn.from_user_id === user.id) {
                                        details = '→ ' + details;
                                        amountColor = '#ef4444';
                                        amountDisplay = \`-\${txn.amount} credits\`;
                                    } else {
                                        details = '← ' + details;
                                        amountDisplay = \`+\${txn.amount} credits\`;
                                    }
                                }
                                return \`
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <span class="transaction-type \${txn.type}">\${txn.type}</span>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <small>\${withUser}</small>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <strong style="color: \${amountColor};">\${amountDisplay}</strong>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <small>\${details}</small>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <small>\${new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                                        </td>
                                    </tr>
                                \`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p style="color: #6b7280; text-align: center; padding: 20px;">No transactions found</p>'}
        </div>
        
        <div id="profile-tab-gifts" class="profile-tab-content" style="display: none;">
            <h3>Received Gifts (${gifts.length})</h3>
            ${gifts.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; margin-top: 12px;">
                    ${gifts.map(gift => `
                        <div style="padding: 16px; background: ${gift.status === 'monetized' ? '#f3f4f6' : '#f0fdf4'}; border-radius: 12px; text-align: center; border: 2px solid ${gift.status === 'monetized' ? '#e5e7eb' : '#10b981'};">
                            <img src="${gift.image_url || 'gifts/crown.png'}" alt="${gift.name}" style="width: 64px; height: 64px; margin-bottom: 8px;">
                            <p style="margin: 0; font-weight: 600; font-size: 14px;">${gift.name || 'Unknown Gift'}</p>
                            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">${gift.purchase_price_credits || 0} credits</p>
                            <span class="status-badge" style="font-size: 11px;">${gift.status || 'sent'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="color: #6b7280; text-align: center; padding: 20px;">No gifts received yet</p>'}
        </div>
        
        <div id="profile-tab-details" class="profile-tab-content" style="display: none;">
            <h3>Full Profile Details</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-top: 12px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Username</p>
                        <p style="margin: 0; font-weight: 600;">${user.pseudo || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">First Name</p>
                        <p style="margin: 0; font-weight: 600;">${user.prenom || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Age</p>
                        <p style="margin: 0; font-weight: 600;">${user.age || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Location</p>
                        <p style="margin: 0; font-weight: 600;">${user.location || user.zone_name || 'Unknown'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Joined</p>
                        <p style="margin: 0; font-weight: 600;">${user.date ? new Date(user.date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Last Visit</p>
                        <p style="margin: 0; font-weight: 600;">${user.visite ? new Date(user.visite).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Photos</p>
                        <p style="margin: 0; font-weight: 600;">${user.photoCount || user.photo || 0}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Rating</p>
                        <p style="margin: 0; font-weight: 600;">${user.rating || user.moyenne || 0}/10 (${user.votes || user.vote || 0} votes)</p>
                    </div>
                </div>
                ${user.description ? `
                    <div style="margin-top: 20px;">
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">About</p>
                        <p style="margin: 0; line-height: 1.6;">${user.description}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function switchProfileTab(event, tabName) {
    // Hide all tab contents
    document.querySelectorAll('.profile-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`profile-tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Open user profile page in new tab
    const profileUrl = `user-profile.html?id=${userId}`;
    window.open(profileUrl, '_blank');
}

// Make ALL functions globally accessible
window.checkAuth = checkAuth;
window.logout = logout;
window.loadDashboard = loadDashboard;
window.loadUsers = loadUsers;
window.loadTransactions = loadTransactions;
window.loadModeration = loadModeration;
window.displayUsers = displayUsers;
window.searchUsers = searchUsers;
window.viewUser = viewUser;
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.switchProfileTab = switchProfileTab;
window.refreshData = refreshData;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.searchTransactions = searchTransactions;

function refreshData() {
    const activeSection = document.querySelector('.nav-item.active');
    const section = activeSection.getAttribute('data-section');
    
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'moderation':
            loadModeration();
            break;
    }
}

// Close modal on background click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('userModal');
    if (e.target === modal) {
        closeUserModal();
    }
});



// Admin Panel JavaScript - Lavrilo CRM

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

// Navigation
let currentPage = 1;
const usersPerPage = 20;
let allUsers = [];
let filteredUsers = [];

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
        
        // Gender emoji
        const genderIcon = user.sexe1 === 1 ? '♂' : user.sexe1 === 2 ? '♀' : '⚥';
        
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
                <td>${genderIcon} ${user.sexe1 === 1 ? 'Male' : user.sexe1 === 2 ? 'Female' : 'Couple'}</td>
                <td><span class="status-badge ${user.status || 'inactive'}">${user.status || 'inactive'}</span></td>
                <td>${user.photoCount || 0} photos</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action primary" onclick="viewUser(${user.id})">View</button>
                        <button class="btn-action" onclick="editUser(${user.id})">Edit</button>
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

// Load Transactions
async function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">Loading transactions...</td></tr>';
    
    try {
        // Call API to get transactions
        const response = await fetch('/api/wallet-transactions?action=get_all_transactions&limit=50');
        const result = await response.json();
        
        if (result.success && result.data) {
            displayTransactions(result.data);
        } else {
            loadDemoTransactions();
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        loadDemoTransactions();
    }
}

function loadDemoTransactions() {
    const transactions = [
        {
            id: 'TXN-LAV-2025-0823-4A7B9C',
            user: 'Alex Johnson',
            type: 'deposit',
            amount: '$24.99',
            credits: 500,
            method: 'Credit Card',
            date: '2025-08-23 14:32',
            status: 'completed'
        },
        {
            id: 'TXN-LAV-2025-0820-3F6E8D',
            user: 'Emma Wilson',
            type: 'deposit',
            amount: '$12.99',
            credits: 250,
            method: 'PayPal',
            date: '2025-08-20 09:15',
            status: 'completed'
        },
        {
            id: 'TXN-LAV-2025-0815-2A5C7B',
            user: 'David Brown',
            type: 'purchase',
            amount: '$36.99',
            credits: 1000,
            method: 'Credit Card',
            date: '2025-08-15 16:42',
            status: 'completed'
        }
    ];
    
    displayTransactions(transactions);
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No transactions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(txn => `
        <tr>
            <td><small>${txn.id}</small></td>
            <td>${txn.user}</td>
            <td><span class="transaction-type ${txn.type}">${txn.type}</span></td>
            <td>${txn.amount}</td>
            <td>+${txn.credits}</td>
            <td>${txn.method}</td>
            <td>${txn.date}</td>
            <td><span class="status-badge ${txn.status}">${txn.status}</span></td>
        </tr>
    `).join('');
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
        
        // Load wallet and transactions data from our database
        const walletResponse = await fetch(`/api/wallet-transactions?action=get_wallet_transactions&user_id=${userId}&limit=10`);
        const walletResult = await walletResponse.json();
        
        console.log('[ADMIN] Wallet data:', walletResult);
        
        const walletData = walletResult.success ? walletResult.data || [] : [];
        const walletBalance = walletResult.wallet ? walletResult.wallet.balance : credits;
        
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
        displayDetailedProfile(fullProfile, walletBalance, walletData, receivedGifts, totalWithdrawable, idVerified);
        
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
            <h3>Recent Transactions</h3>
            ${transactions.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Type</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Amount</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Date</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.slice(0, 10).map(txn => `
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                                        <span class="transaction-type ${txn.transaction_type}">${txn.transaction_type}</span>
                                    </td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                                        $${txn.amount} (${txn.amount * 10} credits)
                                    </td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                                        ${new Date(txn.created_at).toLocaleDateString()}
                                    </td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                                        <span class="status-badge ${txn.status || 'completed'}">${txn.status || 'completed'}</span>
                                    </td>
                                </tr>
                            `).join('')}
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
    alert(`Edit user ${userId} - Feature coming soon`);
}

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



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
        
        // Need to make 3 separate requests for each gender
        // because API /index_api/search filters by gender
        const allUsers = [];
        
        // Request 1: Male users (sexe1 = 1)
        console.log('[ADMIN] Loading MALE users...');
        const maleParams = new URLSearchParams({
            page: 0,
            pas: 67, // Get 67 of each gender
            is_photo: 1,
            get_picture_430: 1,
            sex: 1 // Male profiles
        });
        
        const maleResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&${maleParams.toString()}`);
        const maleResult = await maleResponse.json();
        
        if (maleResult.success && maleResult.data && maleResult.data.result) {
            console.log('[ADMIN] Got', maleResult.data.result.length, 'male users');
            allUsers.push(...maleResult.data.result);
        }
        
        // Request 2: Female users (sexe1 = 2)
        console.log('[ADMIN] Loading FEMALE users...');
        const femaleParams = new URLSearchParams({
            page: 0,
            pas: 67,
            is_photo: 1,
            get_picture_430: 1,
            sex: 2 // Female profiles
        });
        
        const femaleResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&${femaleParams.toString()}`);
        const femaleResult = await femaleResponse.json();
        
        if (femaleResult.success && femaleResult.data && femaleResult.data.result) {
            console.log('[ADMIN] Got', femaleResult.data.result.length, 'female users');
            allUsers.push(...femaleResult.data.result);
        }
        
        // Request 3: Couple users (sexe1 = 3)
        console.log('[ADMIN] Loading COUPLE users...');
        const coupleParams = new URLSearchParams({
            page: 0,
            pas: 66,
            is_photo: 1,
            get_picture_430: 1,
            sex: 3 // Couple profiles
        });
        
        const coupleResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/search&method=POST&${coupleParams.toString()}`);
        const coupleResult = await coupleResponse.json();
        
        if (coupleResult.success && coupleResult.data && coupleResult.data.result) {
            console.log('[ADMIN] Got', coupleResult.data.result.length, 'couple users');
            allUsers.push(...coupleResult.data.result);
        }
        
        console.log('[ADMIN] Total users loaded:', allUsers.length);
        
        if (allUsers.length > 0) {
            window.allUsers = allUsers.map(user => ({
                id: user.id || user.id_membre,
                pseudo: user.pseudo,
                prenom: user.prenom,
                age: user.age,
                sexe1: user.sexe1,
                location: user.zone_name || 'Unknown',
                // 80% verified, 20% not verified
                status: Math.random() < 0.8 ? 'verified' : 'not verified',
                photoCount: user.photo || 0,
                rating: user.moyenne || 0,
                votes: user.vote || 0,
                photos_v2: user.photos_v2 || [],
                photos: user.photos || []
            }));
            
            console.log('[ADMIN] allUsers populated with', window.allUsers.length, 'users');
            console.log('[ADMIN] Gender distribution:', {
                male: window.allUsers.filter(u => parseInt(u.sexe1) === 1).length,
                female: window.allUsers.filter(u => parseInt(u.sexe1) === 2).length,
                couple: window.allUsers.filter(u => parseInt(u.sexe1) === 3).length
            });
            
            window.filteredUsers = [...window.allUsers];
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
        
        // Gender icon and text
        let genderIcon, genderText;
        const gender = parseInt(user.sexe1);
        
        if (gender === 1) {
            genderIcon = '♂';
            genderText = 'Male';
        } else if (gender === 2) {
            genderIcon = '♀';
            genderText = 'Female';
        } else if (gender === 3) {
            genderIcon = '⚥';
            genderText = 'Couple';
        } else {
            genderIcon = '?';
            genderText = 'Unknown';
        }
        
        // Status - берем из user.status
        const statusText = user.status || 'not verified';
        const statusClass = statusText === 'verified' ? 'online' : 'inactive';
        
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
                        <button class="btn-action primary btn-view-user" data-user-id="${user.id}">View</button>
                        <button class="btn-action btn-edit-user" data-user-id="${user.id}">Edit</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add event listeners to all View buttons
    setTimeout(() => {
        document.querySelectorAll('.btn-view-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                console.log('[ADMIN] View button clicked for user:', userId);
                viewUser(userId);
            });
        });
        
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                console.log('[ADMIN] Edit button clicked for user:', userId);
                editUser(userId);
            });
        });
    }, 0);
    
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
    
    window.filteredUsers = window.allUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            (user.pseudo && user.pseudo.toLowerCase().includes(searchTerm)) ||
            (user.prenom && user.prenom.toLowerCase().includes(searchTerm)) ||
            (user.id && user.id.toString().includes(searchTerm));
        
        // Convert both to integers for reliable comparison
        const matchesGender = !genderFilter || parseInt(user.sexe1) === parseInt(genderFilter);
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        return matchesSearch && matchesGender && matchesStatus;
    });
    
    console.log('[ADMIN] Filtered results:', window.filteredUsers.length);
    console.log('[ADMIN] Sample filtered user:', window.filteredUsers[0]);
    
    window.currentPage = 1;
    displayUsers();
}

// Load Transactions (variable already declared globally above)

async function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">Loading transactions...</td></tr>';

    try {
        // Ensure users are loaded first (needed for user display in transactions)
        if (!window.allUsers || window.allUsers.length === 0) {
            console.log('[ADMIN] Loading users first for transactions display...');
            await loadUsers();
        }
        
        // First, seed the database with transactions using real user IDs
        const realUserIds = window.allUsers.map(u => u.id);
        console.log('[ADMIN] Seeding transactions with', realUserIds.length, 'real user IDs');
        
        const seedResponse = await fetch('/api/admin-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'seed_transactions',
                user_ids: realUserIds 
            })
        });
        const seedResult = await seedResponse.json();
        console.log('[ADMIN] Seed result:', seedResult);

        // Load transactions from database
        const response = await fetch('/api/admin-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_all_transactions', limit: 200 })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            // Транзакции уже содержат реальные user IDs
            window.allTransactions = result.data.map(txn => ({
                id: txn.transaction_id,
                from_user_id: txn.from_user_id,
                to_user_id: txn.to_user_id,
                type: txn.type,
                amount: parseFloat(txn.amount),
                credits: txn.credits,
                details: txn.details,
                payment_method: txn.payment_method,
                date: txn.created_at,
                status: txn.status
            }));
            
            await enrichTransactionsWithUserData();
            
            // Update user status: users with payout transactions must be verified
            const usersWithPayouts = new Set();
            window.allTransactions.forEach(txn => {
                if (txn.type === 'payout' && txn.from_user_id) {
                    usersWithPayouts.add(txn.from_user_id.toString());
                }
            });
            
            // Update user status in allUsers
            if (window.allUsers && usersWithPayouts.size > 0) {
                window.allUsers.forEach(user => {
                    if (usersWithPayouts.has(user.id.toString())) {
                        user.status = 'verified';
                    }
                });
                console.log('[ADMIN] Updated', usersWithPayouts.size, 'users to verified (have payouts)');
                
                // Re-filter and display users if on Users tab
                if (window.filteredUsers) {
                    window.filteredUsers = [...window.allUsers];
                    if (typeof displayUsers === 'function' && document.getElementById('usersTableBody')) {
                        displayUsers();
                    }
                }
            }
            
            displayTransactions(window.allTransactions);
        } else {
            console.error('[ADMIN] Failed to load transactions:', result.error);
            tbody.innerHTML = '<tr><td colspan="7" class="error-cell">Failed to load transactions</td></tr>';
        }
    } catch (error) {
        console.error('[ADMIN] Error loading transactions:', error);
        loadDemoTransactions();
    }
}

function generateDemoTransactions() {
    // Generate 100 realistic transactions
    const transactions = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const gifts = [
        { name: 'Rose', price: 10 },
        { name: 'Tulips', price: 20 },
        { name: 'Chocolate', price: 30 },
        { name: 'Crown', price: 50 },
        { name: 'Diamond Ring', price: 100 }
    ];
    
    // Get available user IDs
    const userIds = allUsers.map(u => u.id);
    if (userIds.length === 0) {
        // Fallback IDs if no users loaded
        userIds.push(214669, 214670, 214668, 214459, 214674, 214667, 214666, 214671, 214678, 214673);
    }
    
    // 40 purchases, 30 payouts, 30 gifts
    const types = [
        ...Array(40).fill('purchase'),
        ...Array(30).fill('payout'),
        ...Array(30).fill('gift')
    ];
    
    for (let i = 0; i < 100; i++) {
        const type = types[i];
        const randomDays = Math.floor(Math.random() * 90);
        const date = new Date(threeMonthsAgo.getTime() + randomDays * 24 * 60 * 60 * 1000);
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        
        const uuid = `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 14)}`;
        
        let transaction = {
            id: uuid,
            type: type,
            date: date.toISOString(),
            status: 'completed'
        };
        
        if (type === 'purchase') {
            const amounts = [10, 20, 50, 100, 200];
            const eurAmount = amounts[Math.floor(Math.random() * amounts.length)];
            const credits = eurAmount * 10;
            
            transaction.from_user_id = userId;
            transaction.to_user_id = null;
            transaction.amount = eurAmount;
            transaction.currency = 'EUR';
            transaction.credits = credits;
            transaction.payment_method = ['Card', 'PayPal', 'Stripe'][Math.floor(Math.random() * 3)];
            transaction.description = `Credit purchase: ${credits} credits`;
            
        } else if (type === 'payout') {
            const amounts = [50, 75, 100, 150, 200, 300];
            const usdAmount = amounts[Math.floor(Math.random() * amounts.length)];
            
            transaction.from_user_id = null;
            transaction.to_user_id = userId;
            transaction.amount = usdAmount;
            transaction.currency = 'USD';
            transaction.credits = null;
            transaction.payment_method = 'Bank Transfer (OCT)';
            transaction.description = 'Payout from gift monetization';
            
        } else if (type === 'gift') {
            const gift = gifts[Math.floor(Math.random() * gifts.length)];
            const toUserId = userIds.filter(id => id !== userId)[Math.floor(Math.random() * (userIds.length - 1))];
            
            transaction.from_user_id = userId;
            transaction.to_user_id = toUserId;
            transaction.amount = gift.price;
            transaction.currency = 'Credits';
            transaction.credits = -gift.price;
            transaction.payment_method = null;
            transaction.description = `Gift sent: ${gift.name}`;
            transaction.gift_name = gift.name;
        }
        
        transactions.push(transaction);
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return transactions;
}

async function enrichTransactionsWithUserData() {
    // Map user IDs to user names from our loaded users
    const userMap = {};
    window.allUsers.forEach(user => {
        userMap[user.id] = user.pseudo || `User #${user.id}`;
    });
    
    // Enrich transactions with user names
    window.allTransactions.forEach(txn => {
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
    
    // Helper function to display user with photo and nickname
    const getUserDisplay = (userId, userName) => {
        if (!userId) return '—';
        
        const user = window.allUsers ? window.allUsers.find(u => u.id == userId) : null;
        if (user) {
            const photoUrl = user.photos_v2?.[0]?.sq_430 || user.photos?.[0]?.url_middle || null;
            const initials = user.pseudo ? user.pseudo.substring(0, 2).toUpperCase() : 'U';
            
            return `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                        ${photoUrl ? 
                            `<img src="${photoUrl}" alt="${user.pseudo}" style="width: 100%; height: 100%; object-fit: cover;">` :
                            `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${initials}</div>`
                        }
                    </div>
                    <div style="min-width: 0;">
                        <div style="font-weight: 500;">${user.pseudo}</div>
                        <div style="font-size: 11px; color: #9ca3af;">#${user.id}</div>
                    </div>
                </div>
            `;
        }
        
        return `User #${userId}`;
    };
    
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
            // Show gift name instead of credits
            amountDisplay = txn.details || `${txn.credits} credits`;
        }
        
        // Details
        let details = '';
        if (txn.credits && txn.type === 'purchase') {
            details = `+${txn.credits} credits`;
        } else if (txn.payment_method && txn.type === 'payout') {
            details = txn.payment_method;
        } else if (txn.type === 'gift') {
            details = `${txn.credits} credits`;
        }
        
        return `
            <tr>
                <td><small style="font-family: monospace;">${shortId}</small></td>
                <td>${getUserDisplay(txn.from_user_id, txn.from_user_name)}</td>
                <td>${getUserDisplay(txn.to_user_id, txn.to_user_name)}</td>
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
    const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    
    console.log('[ADMIN] Searching transactions:', { searchTerm, typeFilter });
    
    if (!window.allTransactions) {
        console.warn('[ADMIN] No transactions loaded');
        return;
    }
    
    let filtered = window.allTransactions.filter(txn => {
        // Search by transaction ID or user ID
        const matchesSearch = !searchTerm || 
            txn.id.toLowerCase().includes(searchTerm) ||
            (txn.from_user_id && txn.from_user_id.toString().includes(searchTerm)) ||
            (txn.to_user_id && txn.to_user_id.toString().includes(searchTerm)) ||
            (txn.from_user_name && txn.from_user_name.toLowerCase().includes(searchTerm)) ||
            (txn.to_user_name && txn.to_user_name.toLowerCase().includes(searchTerm));
        
        const matchesType = !typeFilter || txn.type === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    console.log('[ADMIN] Found', filtered.length, 'transactions');
    displayTransactions(filtered);
}

// Load Moderation Queue
async function loadModeration() {
    const moderationQueue = document.getElementById('moderationQueue');
    moderationQueue.innerHTML = '<div style="padding: 40px; text-align: center;">Loading moderation queue...</div>';
    
    try {
        // First seed the database
        const seedResponse = await fetch('/api/admin-moderation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'seed_documents' })
        });
        await seedResponse.json();

        // Load moderation documents
        const response = await fetch('/api/admin-moderation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_documents' })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const documents = result.data;
            
            // Create user map
            const userMap = {};
            window.allUsers.forEach(user => {
                userMap[user.id] = user;
            });
            
            const statusLabels = {
                'pending': { label: 'Pending', class: 'status-pending', color: '#fbbf24' },
                'approved': { label: 'Approved', class: 'status-approved', color: '#10b981' },
                'rejected': { label: 'Rejected', class: 'status-rejected', color: '#ef4444' },
                'additional_required': { label: 'Info Requested', class: 'status-additional', color: '#3b82f6' }
            };
            
            const docTypeLabels = {
                'passport': 'Passport',
                'id_card': 'ID Card',
                'driver_license': 'Driver License'
            };
            
            // Save documents globally for filtering
            window.allModerationDocs = documents;
            window.userMapForModeration = userMap;
            
            moderationQueue.innerHTML = `
                <div class="card">
                    <h3>Verification Queue (${documents.length})</h3>
                    <div id="moderationItemsContainer">
                        ${documents.map(doc => {
                            const user = userMap[doc.user_id];
                            if (!user) return '';
                            
                            const photoUrl = user.photos_v2?.[0]?.sq_430 || user.photos?.[0]?.url_middle || null;
                            const initials = user.pseudo ? user.pseudo.substring(0, 2).toUpperCase() : 'XX';
                            const statusInfo = statusLabels[doc.status] || { label: doc.status, class: '', color: '#9ca3af' };
                            const docType = docTypeLabels[doc.document_type] || doc.document_type;
                            const timeAgo = getTimeAgo(new Date(doc.submitted_at));
                            
                            return `
                                <div class="activity-item moderation-item" data-user-name="${user.pseudo.toLowerCase()}" data-user-id="${user.id}" data-status="${doc.status}" style="margin-bottom: 12px;">
                                    <div class="activity-avatar" style="width: 40px; height: 40px; padding: 0; overflow: hidden; border-radius: 50%;">
                                        ${photoUrl ?
                                            `<img src="${photoUrl}" alt="${user.pseudo}" style="width: 100%; height: 100%; object-fit: cover;">` :
                                            `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold;">${initials}</div>`
                                        }
                                    </div>
                                    <div class="activity-info" style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <strong>${user.pseudo}</strong>
                                            <span style="color: #9ca3af; font-size: 12px;">#${user.id}</span>
                                            <span style="background: ${statusInfo.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">${statusInfo.label}</span>
                                        </div>
                                        <small>${docType} verification • ${timeAgo}</small>
                                        ${doc.admin_notes ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 2px; font-style: italic;">${doc.admin_notes}</div>` : ''}
                                    </div>
                                    <div class="action-buttons">
                                        ${doc.status !== 'approved' ? `<button class="btn-action primary" onclick="updateDocStatus(${doc.id}, 'approved')">✓</button>` : ''}
                                        ${doc.status !== 'rejected' ? `<button class="btn-action" onclick="updateDocStatus(${doc.id}, 'rejected')">✗</button>` : ''}
                                        ${doc.status === 'pending' ? `<button class="btn-action" onclick="updateDocStatus(${doc.id}, 'additional_required')">?</button>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            // Apply initial filter (show only pending)
            filterModeration();
        } else {
            moderationQueue.innerHTML = '<div class="card"><p style="text-align: center; color: #ef4444;">Failed to load moderation queue</p></div>';
        }
    } catch (error) {
        console.error('[ADMIN] Error loading moderation:', error);
        moderationQueue.innerHTML = '<div class="card"><p style="text-align: center; color: #ef4444;">Error loading moderation queue</p></div>';
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

function filterModeration() {
    const searchTerm = (document.getElementById('moderationSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('moderationStatusFilter')?.value || '';
    
    const items = document.querySelectorAll('.moderation-item');
    items.forEach(item => {
        const userName = item.dataset.userName || '';
        const userId = item.dataset.userId || '';
        const status = item.dataset.status || '';
        
        const matchesSearch = !searchTerm || userName.includes(searchTerm) || userId.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        
        item.style.display = (matchesSearch && matchesStatus) ? 'flex' : 'none';
    });
}

async function updateDocStatus(documentId, status) {
    try {
        const response = await fetch('/api/admin-moderation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'update_status', 
                document_id: documentId, 
                status: status 
            })
        });
        
        const result = await response.json();
        if (result.success) {
            loadModeration();
        } else {
            alert('Failed to update document status');
        }
    } catch (error) {
        console.error('[ADMIN] Error updating document status:', error);
        alert('Error updating document status');
    }
}

// View User Details
async function viewUser(userId) {
    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('modalUserContent');
    const modalTitle = document.getElementById('modalUserName');
    
    const user = window.allUsers.find(u => u.id == userId);
    if (!user) {
        console.error('[ADMIN] User not found:', userId);
        return;
    }
    
    modalTitle.textContent = user.pseudo || 'User Details';
    modalContent.innerHTML = '<div class="loading" style="padding: 40px; text-align: center;">Loading detailed profile...</div>';
    modal.classList.add('active');
    
    try {
        // Load full user profile with credits and other data
        const profileResponse = await fetch(`/api/spice-multi-test?endpoint=/index_api/user&method=POST&id=${userId}`);
        const profileResult = await profileResponse.json();
        
        let fullProfile = user; // Fallback to basic user data
        let credits = 0;
        
        if (profileResult.success && profileResult.data && profileResult.data.result) {
            fullProfile = { ...user, ...profileResult.data.result };
            credits = fullProfile.credits || fullProfile.credit || 0;
        }
        
        // Get user transactions from global transactions (same as Transactions tab)
        let userTransactions = window.allTransactions ? 
            window.allTransactions.filter(txn => 
                txn.from_user_id == userId || txn.to_user_id == userId
            ) : [];
        
        // Calculate credits balance from transactions
        let calculatedCredits = 0;
        userTransactions.forEach(txn => {
            if (txn.type === 'purchase' && txn.to_user_id == userId) {
                // User purchased credits
                calculatedCredits += parseInt(txn.credits || 0);
            } else if (txn.type === 'gift' && txn.from_user_id == userId) {
                // User sent gift (spent credits)
                calculatedCredits -= parseInt(txn.amount || 0);
            }
        });
        
        // Use calculated credits or fallback to API
        credits = calculatedCredits > 0 ? calculatedCredits : credits;
        
        // Calculate withdrawable amount from gift transactions (received gifts)
        const receivedGiftTransactions = userTransactions.filter(txn => 
            txn.type === 'gift' && txn.to_user_id == userId
        );
        
        // 10% of received gift value can be withdrawn
        const totalWithdrawable = receivedGiftTransactions.reduce((sum, txn) => {
            const giftValue = parseFloat(txn.amount || 0);
            const withdrawableValue = giftValue * 0.1 * 0.1; // 10% conversion, 1 credit = $0.1
            return sum + withdrawableValue;
        }, 0);
        
        // Check ID verification status from user status in Users tab
        const idVerified = user.status === 'verified' ? 'Verified' : 
                          user.status === 'not verified' ? 'Not Verified' : 
                          'Not Provided';
        
        // For gifts inventory display (from transactions)
        const receivedGifts = receivedGiftTransactions.map(txn => ({
            gift_name: txn.details || 'Gift',
            purchase_price_credits: txn.amount,
            created_at: txn.date,
            status: 'active'
        }));
        
        // Display detailed profile
        displayDetailedProfile(fullProfile, credits, userTransactions, receivedGifts, totalWithdrawable, idVerified);
        
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
    
    // Gift database mapping
    const giftDatabase = {
        'Red Rose': { image: 'gifts/rose.png', credits: 5 },
        'Tulip Bouquet': { image: 'gifts/tulips.png', credits: 15 },
        'Heart Chocolate': { image: 'gifts/chocolate.png', credits: 20 },
        'Coffee & Cookies': { image: 'gifts/coffee.png', credits: 25 },
        'Teddy Bear': { image: 'gifts/teddy.png', credits: 35 },
        'Balloons': { image: 'gifts/balloons.png', credits: 45 },
        'Rose Bouquet': { image: 'gifts/rose-bouquet.png', credits: 75 },
        'Perfume': { image: 'gifts/perfume.png', credits: 100 },
        'Silver Earrings': { image: 'gifts/silver-earrings.png', credits: 125 },
        'Bracelet': { image: 'gifts/bracelet.png', credits: 150 },
        'Diamond Earrings': { image: 'gifts/diamond-earrings.png', credits: 300 },
        'Gold Ring': { image: 'gifts/gold-ring.png', credits: 400 },
        'Pearl Necklace': { image: 'gifts/pearl-necklace.png', credits: 500 },
        'Diamond Bracelet': { image: 'gifts/diamond-bracelet.png', credits: 650 },
        'Platinum Ring': { image: 'gifts/platinum-ring.png', credits: 800 },
        'Luxury Watch': { image: 'gifts/luxury-watch.png', credits: 1000 },
        'Diamond Necklace': { image: 'gifts/diamond-necklace.png', credits: 1500 },
        'Royal Crown': { image: 'gifts/crown.png', credits: 2500 }
    };
    
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
                    <span class="status-badge" style="margin-left: 8px;">${parseInt(user.sexe1) === 1 ? 'Male' : parseInt(user.sexe1) === 2 ? 'Female' : 'Couple'}</span>
                </p>
            </div>
        </div>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px;">
            <div class="stat-card" style="text-align: center; min-height: 140px; display: flex; flex-direction: column; justify-content: center;">
                <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2); margin: 0 auto 12px;">
                    <img src="icons/admin/credits.png" alt="Credits" class="stat-icon-img">
                </div>
                <h3 style="margin: 0; font-size: 32px; color: #667eea;">${credits}</h3>
                <p style="margin: 4px 0 0; color: #6b7280;">Credits Balance</p>
            </div>
            
            <div class="stat-card" style="text-align: center; min-height: 140px; display: flex; flex-direction: column; justify-content: center;">
                <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7); margin: 0 auto 12px;">
                    <img src="icons/admin/credits.png" alt="Withdrawable" class="stat-icon-img">
                </div>
                <h3 style="margin: 0; font-size: 32px; color: #10b981;">$${withdrawable.toFixed(2)}</h3>
                <p style="margin: 4px 0 0; color: #6b7280;">Available for Withdrawal</p>
            </div>
            
            <div class="stat-card" style="text-align: center; min-height: 140px; display: flex; flex-direction: column; justify-content: center;">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c); margin: 0 auto 12px;">
                    <img src="icons/admin/status.png" alt="ID" class="stat-icon-img">
                </div>
                <h3 style="margin: 0; font-size: 32px; color: #ef4444;">${idStatus}</h3>
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
                                    details = txn.payment_method ? '€' + txn.amount + ' via ' + txn.payment_method : '€' + txn.amount;
                                } else if (txn.type === 'payout') {
                                    amountDisplay = '$' + txn.amount;
                                    amountColor = '#3b82f6';
                                    withUser = 'Bank (OCT)';
                                    details = 'Gift monetization';
                                } else if (txn.type === 'gift') {
                                    withUser = txn.from_user_id === user.id ? txn.to_user_name : txn.from_user_name;
                                    details = txn.gift_name || 'Gift';
                                    if (txn.from_user_id === user.id) {
                                        details = '→ ' + details;
                                        amountColor = '#ef4444';
                                        amountDisplay = '-' + txn.amount + ' credits';
                                    } else {
                                        details = '← ' + details;
                                        amountDisplay = '+' + txn.amount + ' credits';
                                    }
                                }
                                return `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <span class="transaction-type ${txn.type}">${txn.type}</span>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <small>${withUser}</small>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <strong style="color: ${amountColor};">${amountDisplay}</strong>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <small>${details}</small>
                                        </td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                                            <small>${new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                                        </td>
                                    </tr>
                                `;
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
                    ${gifts.map(gift => {
                        const giftName = gift.name || gift.details;
                        const giftInfo = giftDatabase[giftName] || { image: 'gifts/crown.png', credits: gift.credits || 0 };
                        const withdrawValue = (giftInfo.credits * 0.1).toFixed(2);
                        
                        return `
                            <div style="padding: 16px; background: ${gift.status === 'monetized' ? '#f3f4f6' : '#f0fdf4'}; border-radius: 12px; text-align: center; border: 2px solid ${gift.status === 'monetized' ? '#e5e7eb' : '#10b981'};">
                                <img src="${giftInfo.image}" alt="${giftName}" style="width: 64px; height: 64px; margin-bottom: 8px; object-fit: contain;">
                                <p style="margin: 0; font-weight: 600; font-size: 14px;">${giftName}</p>
                                <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">${giftInfo.credits} credits</p>
                                <p style="margin: 4px 0; font-size: 11px; color: #10b981;">$${withdrawValue} withdrawable</p>
                                <span class="status-badge" style="font-size: 11px;">${gift.status || 'available'}</span>
                            </div>
                        `;
                    }).join('')}
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
window.filterModeration = filterModeration;
window.updateDocStatus = updateDocStatus;
window.getTimeAgo = getTimeAgo;
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



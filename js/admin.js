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
        // Call Spice API to search for users
        const response = await fetch('/api/admin-users?action=search_users&limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
            allUsers = result.data;
            filteredUsers = [...allUsers];
            displayUsers();
        } else {
            // Fallback to demo data if API fails
            loadDemoUsers();
        }
    } catch (error) {
        console.error('Error loading users:', error);
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
        tbody.innerHTML = '<tr><td colspan="8" class="loading-cell">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = usersToDisplay.map(user => {
        const avatar = user.pseudo ? user.pseudo.substring(0, 2).toUpperCase() : 'XX';
        const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${avatar}</div>
                        <div class="user-info">
                            <strong>${user.pseudo || 'Unknown'}</strong>
                            <small>#${user.id}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.age || 'N/A'}</td>
                <td>${user.city || 'Unknown'}</td>
                <td><span class="status-badge ${user.status || 'inactive'}">${user.status || 'inactive'}</span></td>
                <td>${user.credits || 0}</td>
                <td>${joinDate}</td>
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
    
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            (user.pseudo && user.pseudo.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.id && user.id.toString().includes(searchTerm));
        
        const matchesGender = !genderFilter || user.sexe1 === parseInt(genderFilter);
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        return matchesSearch && matchesGender && matchesStatus;
    });
    
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
function viewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('modalUserContent');
    const modalTitle = document.getElementById('modalUserName');
    
    modalTitle.textContent = user.pseudo || 'User Details';
    
    modalContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                    <img src="icons/admin/user-icon.png" alt="User" class="stat-icon-img">
                </div>
                <div class="stat-info">
                    <h3>${user.pseudo || 'N/A'}</h3>
                    <p>Username</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                    <img src="icons/admin/email.png" alt="Email" class="stat-icon-img">
                </div>
                <div class="stat-info">
                    <h3>${user.email || 'N/A'}</h3>
                    <p>Email</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
                    <img src="icons/admin/credits.png" alt="Credits" class="stat-icon-img">
                </div>
                <div class="stat-info">
                    <h3>${user.credits || 0}</h3>
                    <p>Current Credits</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
                    <img src="icons/admin/status.png" alt="Status" class="stat-icon-img">
                </div>
                <div class="stat-info">
                    <h3>${user.status || 'inactive'}</h3>
                    <p>Account Status</p>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            <h3>Profile Details</h3>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 12px;">
                <p><strong>User ID:</strong> #${user.id}</p>
                <p><strong>Age:</strong> ${user.age || 'N/A'}</p>
                <p><strong>Location:</strong> ${user.city || 'Unknown'}</p>
                <p><strong>Joined:</strong> ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
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



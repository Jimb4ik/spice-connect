// Script to generate realistic transactions for admin panel
// Run with: node generate-transactions.js

const crypto = require('crypto');

function generateUUID() {
    return crypto.randomUUID();
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Gift catalog with prices
const gifts = [
    { name: 'Rose', price: 10, image: 'gifts/rose.png' },
    { name: 'Tulips', price: 20, image: 'gifts/tulips.png' },
    { name: 'Chocolate', price: 30, image: 'gifts/chocolate.png' },
    { name: 'Crown', price: 50, image: 'gifts/crown.png' },
    { name: 'Diamond Ring', price: 100, image: 'gifts/diamond-ring.png' }
];

// Sample user IDs from the API (will be replaced with real ones)
let userIds = [
    214669, 214670, 214668, 214459, 214674,
    214667, 214666, 214671, 214678, 214673
];

// Generate 100 transactions
function generateTransactions() {
    const transactions = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // 40% purchases, 30% payouts, 30% gifts
    const types = [
        ...Array(40).fill('purchase'),
        ...Array(30).fill('payout'),
        ...Array(30).fill('gift')
    ];
    
    for (let i = 0; i < 100; i++) {
        const type = getRandomElement(types);
        const date = getRandomDate(threeMonthsAgo, now);
        const userId = getRandomElement(userIds);
        
        let transaction = {
            id: generateUUID(),
            type: type,
            date: date.toISOString(),
            status: 'completed'
        };
        
        if (type === 'purchase') {
            // Credit purchase - user buys credits for EUR
            const amounts = [10, 20, 50, 100, 200];
            const eurAmount = getRandomElement(amounts);
            const credits = eurAmount * 10; // 1 EUR = 10 credits
            
            transaction.from_user_id = userId;
            transaction.to_user_id = null;
            transaction.amount = eurAmount;
            transaction.currency = 'EUR';
            transaction.credits = credits;
            transaction.payment_method = getRandomElement(['Card', 'PayPal', 'Stripe']);
            transaction.description = `Credit purchase: ${credits} credits`;
            
        } else if (type === 'payout') {
            // Payout - user converts gifts to money (OCT)
            const amounts = [50, 75, 100, 150, 200, 300];
            const usdAmount = getRandomElement(amounts);
            
            transaction.from_user_id = null;
            transaction.to_user_id = userId;
            transaction.amount = usdAmount;
            transaction.currency = 'USD';
            transaction.credits = null;
            transaction.payment_method = 'Bank Transfer (OCT)';
            transaction.description = `Payout from gift monetization`;
            
        } else if (type === 'gift') {
            // Gift - one user sends gift to another
            const gift = getRandomElement(gifts);
            const toUserId = getRandomElement(userIds.filter(id => id !== userId));
            
            transaction.from_user_id = userId;
            transaction.to_user_id = toUserId;
            transaction.amount = gift.price;
            transaction.currency = 'Credits';
            transaction.credits = -gift.price; // deducted from sender
            transaction.payment_method = null;
            transaction.description = `Gift sent: ${gift.name}`;
            transaction.gift_name = gift.name;
            transaction.gift_image = gift.image;
        }
        
        transactions.push(transaction);
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return transactions;
}

// Generate and output transactions
const transactions = generateTransactions();

console.log('// Generated transactions for admin panel');
console.log('const generatedTransactions = ' + JSON.stringify(transactions, null, 2) + ';');
console.log(`\n// Total: ${transactions.length} transactions`);
console.log(`// Purchases: ${transactions.filter(t => t.type === 'purchase').length}`);
console.log(`// Payouts: ${transactions.filter(t => t.type === 'payout').length}`);
console.log(`// Gifts: ${transactions.filter(t => t.type === 'gift').length}`);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateTransactions, gifts };
}

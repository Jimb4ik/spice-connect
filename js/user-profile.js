// User Profile System
// Handles loading and displaying detailed user profile information

// Configuration arrays cache
const configArrays = {};

// Function to get configuration arrays from API
async function getConfigArray(arrayName) {
    if (configArrays[arrayName]) {
        return configArrays[arrayName];
    }
    
    try {
        // Get API key first
        const apiKeyResponse = await fetch('/api/get-api-key');
        const apiKeyData = await apiKeyResponse.json();
        
        if (!apiKeyData.success) {
            throw new Error('Failed to get API key');
        }
        
        // Use direct API URL as specified in documentation
        const apiUrl = `https://dev2018.de5a7.com/index_api/array/get/${arrayName}?api_key=${apiKeyData.apiKey}`;
        console.log(`[USER-PROFILE] Loading ${arrayName} from:`, apiUrl);
        
        const response = await fetch(`/api/spice-proxy-simple?url=${encodeURIComponent(apiUrl)}`);
        const result = await response.json();
        
        console.log(`[USER-PROFILE] ${arrayName} response:`, result);
        
        if (result.success && result.data) {
            configArrays[arrayName] = result.data;
            return result.data;
        }
    } catch (error) {
        console.error(`[USER-PROFILE] Error loading ${arrayName} array:`, error);
    }
    
    return {};
}

// Helper functions for mapping values
function getGenderText(sexe) {
    const genderMap = {
        1: 'Male',
        2: 'Female', 
        3: 'Couple'
    };
    return genderMap[sexe] || 'Unknown';
}

function getOrientationText(sexe) {
    const orientationMap = {
        1: 'Heterosexual',
        2: 'Gay/Lesbian',
        3: 'Bisexual'
    };
    return orientationMap[sexe] || 'Unknown';
}

// Global variables
let currentProfile = null;

// Zodiac signs mapping
const zodiacSigns = {
    'aries': { name: 'Aries', symbol: '♈', dates: '21 Mar - 19 Apr' },
    'taurus': { name: 'Taurus', symbol: '♉', dates: '20 Apr - 20 May' },
    'gemini': { name: 'Gemini', symbol: '♊', dates: '21 May - 20 Jun' },
    'cancer': { name: 'Cancer', symbol: '♋', dates: '21 Jun - 22 Jul' },
    'leo': { name: 'Leo', symbol: '♌', dates: '23 Jul - 22 Aug' },
    'virgo': { name: 'Virgo', symbol: '♍', dates: '23 Aug - 22 Sep' },
    'libra': { name: 'Libra', symbol: '♎', dates: '23 Sep - 22 Oct' },
    'scorpio': { name: 'Scorpio', symbol: '♏', dates: '23 Oct - 21 Nov' },
    'sagittarius': { name: 'Sagittarius', symbol: '♐', dates: '22 Nov - 21 Dec' },
    'capricorn': { name: 'Capricorn', symbol: '♑', dates: '22 Dec - 19 Jan' },
    'aquarius': { name: 'Aquarius', symbol: '♒', dates: '20 Jan - 18 Feb' },
    'pisces': { name: 'Pisces', symbol: '♓', dates: '19 Feb - 20 Mar' }
};

/**
 * Initialize user profile page
 */
async function initializeUserProfile() {
    console.log('[USER-PROFILE] Initializing user profile page...');
    
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        const userName = urlParams.get('name');
        
        if (!userId) {
            console.error('[USER-PROFILE] No user ID provided');
            showError();
            return;
        }
        
        console.log('[USER-PROFILE] Loading profile for user:', userId, userName);
        
        // Update page title with URL parameter if available
        if (userName) {
            document.getElementById('profileName').textContent = decodeURIComponent(userName);
        }
        
        // Load user profile data
        await loadUserProfile(userId);
        
    } catch (error) {
        console.error('[USER-PROFILE] Error initializing profile:', error);
        showError();
    }
}

/**
 * Load user profile from API
 */
async function loadUserProfile(userId) {
    try {
        console.log('[USER-PROFILE] Loading profile data for user:', userId);
        
        const sessionId = window.authManager?.sessionId;
        if (!sessionId) {
            console.error('[USER-PROFILE] No session ID available');
            showError();
            return;
        }
        
        // Call user API using the correct endpoint with get_picture_430=1 to get photos_v2
        const apiUrl = `/api/spice-multi-test?endpoint=/index_api/user&method=POST&session_id=${sessionId}&id=${userId}&get_picture_430=1`;
        console.log('[USER-PROFILE] API request:', apiUrl);
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        console.log('[USER-PROFILE] API response:', result);
        
        // API возвращает данные в поле data.result согласно документации
        if (result.success && result.data && result.data.connected === 1 && result.data.result) {
            await displayUserProfile(result.data.result);
        } else {
            console.error('[USER-PROFILE] API returned error or user not found:', result);
            showError();
        }
        
    } catch (error) {
        console.error('[USER-PROFILE] Error loading profile:', error);
        showError();
    }
}

/**
 * Display user profile data
 */
async function displayUserProfile(profile) {
    try {
        console.log('[USER-PROFILE] Displaying profile data:', profile);
        
        if (!profile) {
            console.error('[USER-PROFILE] No profile data provided');
            showError();
            return;
        }
        
        // Store profile globally for photo voting
        currentProfile = profile;
        
        // Hide main loading, show content
        document.getElementById('profileLoading').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
        
        // Show section loading indicators
        showSectionLoadingIndicators();
        
        // Basic information
        try {
            await displayBasicInfo(profile);
        } catch (error) {
            console.warn('[USER-PROFILE] Error displaying basic info:', error);
        }
        
        // Profile photo
        try {
            await displayProfilePhoto(profile);
        } catch (error) {
            console.warn('[USER-PROFILE] Error displaying photo:', error);
        }
        
        // Description
        try {
            await displayDescription(profile);
        } catch (error) {
            console.warn('[USER-PROFILE] Error displaying description:', error);
        }
        
        // Personal details
        try {
            await displayPersonalDetails(profile);
        } catch (error) {
            console.warn('[USER-PROFILE] Error displaying personal details:', error);
        }
        
        // Photo gallery
        try {
            await displayPhotoGallery(profile);
        } catch (error) {
            console.warn('[USER-PROFILE] Error displaying photo gallery:', error);
        }
        
        // Setup action buttons
        try {
            setupActionButtons(profile);
        } catch (error) {
            console.warn('[USER-PROFILE] Error setting up action buttons:', error);
        }
        
        console.log('[USER-PROFILE] ✅ Profile displayed successfully');
        
    } catch (error) {
        console.error('[USER-PROFILE] Error displaying profile:', error);
        showError();
    }
}

/**
 * Display basic profile information
 */
async function displayBasicInfo(profile) {
    // Full name and nickname
    const fullName = profile.nom_complet || 'Unknown User';
    const nickname = profile.pseudo || '';
    
    document.getElementById('profileFullName').textContent = fullName;
    
    // Update page title
    const displayName = nickname || fullName;
    document.getElementById('profileName').textContent = `Profile: ${displayName}`;
    document.title = `Profile: ${displayName} - Lavrilo`;
    
    // Show nickname if different from full name
    const nicknameElement = document.getElementById('profileNickname');
    if (nickname && nickname !== fullName) {
        nicknameElement.textContent = `"${nickname}"`;
        nicknameElement.style.display = 'block';
    } else {
        nicknameElement.style.display = 'none';
    }
    
    // Online status
    const onlineElement = document.getElementById('profileOnlineStatus');
    if (profile.online) {
        onlineElement.innerHTML = '<span class="online-indicator">🟢</span> Online';
        onlineElement.className = 'online-status online';
    } else {
        onlineElement.innerHTML = '<span class="offline-indicator">⚫</span> Offline';
        onlineElement.className = 'online-status offline';
    }
    
    // Age
    const ageElement = document.getElementById('profileAge');
    if (profile.age && profile.age > 0) {
        ageElement.textContent = profile.age;
        ageElement.className = '';
    } else {
        ageElement.textContent = 'Not specified';
        ageElement.className = 'not-provided';
    }
    
    // Location
    const locationElement = document.getElementById('profileLocation');
    if (profile.zone_name) {
        locationElement.textContent = profile.zone_name;
        locationElement.className = '';
    } else {
        locationElement.textContent = 'Location not shared';
        locationElement.className = 'not-provided';
    }
    
    // Gender and orientation
    const genderElement = document.getElementById('profileGender');
    const orientationElement = document.getElementById('profileOrientation');
    
    if (profile.sexe1) {
        genderElement.textContent = getGenderText(profile.sexe1);
        genderElement.className = '';
    } else {
        genderElement.textContent = 'Not specified';
        genderElement.className = 'not-provided';
    }
    
    if (profile.sexe2) {
        orientationElement.textContent = getOrientationText(profile.sexe2);
        orientationElement.className = '';
    } else {
        orientationElement.textContent = 'Not specified';
        orientationElement.className = 'not-provided';
    }
    
    // Looking for
    const lookingForElement = document.getElementById('profileLookingFor');
    const lookingForOrientationElement = document.getElementById('profileLookingForOrientation');
    
    if (profile.cherche1) {
        lookingForElement.textContent = getGenderText(profile.cherche1);
        lookingForElement.className = '';
    } else {
        lookingForElement.textContent = 'Open to anyone';
        lookingForElement.className = 'not-provided';
    }
    
    if (profile.cherche2) {
        lookingForOrientationElement.textContent = getOrientationText(profile.cherche2);
        lookingForOrientationElement.className = '';
    } else {
        lookingForOrientationElement.textContent = 'No preference';
        lookingForOrientationElement.className = 'not-provided';
    }
    
    // Hair and eye color (load from API arrays)
    await displayPhysicalAttributes(profile);
    
    // Birth date and zodiac
    if (profile.naissance && profile.naissance !== '1988-03-20') {
        const birthDate = new Date(profile.naissance);
        const zodiac = getZodiacSign(birthDate);
        
        if (zodiac) {
            const zodiacSection = document.getElementById('zodiacSection');
            const zodiacElement = document.getElementById('profileZodiac');
            
            zodiacElement.textContent = `${zodiac.symbol} ${zodiac.name}`;
            zodiacElement.title = zodiac.dates;
            zodiacSection.style.display = 'flex';
        }
    }
}

/**
 * Display physical attributes (hair, eyes)
 */
async function displayPhysicalAttributes(profile) {
    try {
        // Load hair and eye color arrays
        const [cheveuxArray, yeuxArray] = await Promise.all([
            getConfigArray('CHEVEUX'),
            getConfigArray('YEUX')
        ]);
        
        // Hair color
        const hairElement = document.getElementById('profileHairColor');
        if (profile.cheveux && cheveuxArray[profile.cheveux]) {
            hairElement.textContent = cheveuxArray[profile.cheveux];
            hairElement.className = '';
        } else {
            hairElement.textContent = 'Not shared';
            hairElement.className = 'not-provided';
        }
        
        // Eye color
        const eyeElement = document.getElementById('profileEyeColor');
        if (profile.yeux && yeuxArray[profile.yeux]) {
            eyeElement.textContent = yeuxArray[profile.yeux];
            eyeElement.className = '';
        } else {
            eyeElement.textContent = 'Not shared';
            eyeElement.className = 'not-provided';
        }
        
    } catch (error) {
        console.error('[USER-PROFILE] Error loading physical attributes:', error);
        
        // Set fallback messages if API fails
        const hairElement = document.getElementById('profileHairColor');
        const eyeElement = document.getElementById('profileEyeColor');
        
        if (hairElement && !hairElement.textContent) {
            hairElement.textContent = 'Not available';
            hairElement.className = 'not-provided';
        }
        
        if (eyeElement && !eyeElement.textContent) {
            eyeElement.textContent = 'Not available';
            eyeElement.className = 'not-provided';
        }
    }
}

/**
 * Display profile photo
 */
async function displayProfilePhoto(profile) {
    const photoElement = document.getElementById('profileMainPhoto');
    const placeholderElement = document.getElementById('photoPlaceholder');
    const placeholderLetter = document.getElementById('placeholderLetter');
    
    // Set placeholder letter
    const name = profile.nom_complet || profile.pseudo || 'User';
    placeholderLetter.textContent = name.charAt(0).toUpperCase();
    
    // Try to get high-quality photo according to API documentation
    let photoUrl = null;
    
    // Приоритет 1: photos_v2 (PhotoBlockV2) - новый формат
    if (profile.photos_v2 && Array.isArray(profile.photos_v2) && profile.photos_v2.length > 0) {
        const mainPhoto = profile.photos_v2.find(photo => photo.num === 0) || profile.photos_v2[0];
        photoUrl = mainPhoto.sq_430 || mainPhoto.normal || mainPhoto.sq_middle || mainPhoto.sq_small;
    }
    // Приоритет 2: старые поля для совместимости
    else if (profile.main_photo && profile.main_photo.real_size) {
        photoUrl = profile.main_photo.real_size;
    } else if (profile.main_photo) {
        photoUrl = profile.main_photo.sqmiddle || profile.main_photo.sqsmall;
    }
    
    if (photoUrl) {
        // Fix URL if needed - ensure it's a full URL
        if (!photoUrl.startsWith('http')) {
            if (photoUrl.startsWith('/')) {
                photoUrl = 'https://dev2018.de5a7.com' + photoUrl;
            } else {
                photoUrl = 'https://dev2018.de5a7.com/' + photoUrl;
            }
        }
        
        console.log('[USER-PROFILE] Loading photo:', photoUrl);
        
        // Set up error handling before setting src
        photoElement.onerror = function() {
            console.warn('[USER-PROFILE] Photo failed to load, showing placeholder');
            this.style.display = 'none';
            placeholderElement.style.display = 'flex';
        };
        
        photoElement.onload = function() {
            console.log('[USER-PROFILE] Photo loaded successfully');
            this.style.display = 'block';
            placeholderElement.style.display = 'none';
        };
        
        photoElement.src = photoUrl;
    } else {
        console.log('[USER-PROFILE] No photo URL found, showing placeholder');
        photoElement.style.display = 'none';
        placeholderElement.style.display = 'flex';
    }
}

/**
 * Display description with translation
 */
async function displayDescription(profile) {
    const descriptionElement = document.getElementById('profileDescription');
    
    if (profile.description && profile.description.trim()) {
        // Show original description
        let description = profile.description.trim();
        
        // Try to translate to English if it's in French
        try {
            const translatedDescription = await translateToEnglish(description);
            if (translatedDescription && translatedDescription !== description) {
                description = translatedDescription;
            }
        } catch (error) {
            console.warn('[USER-PROFILE] Translation failed, using original:', error);
        }
        
        descriptionElement.textContent = description;
        descriptionElement.className = '';
        hideSectionLoading('about', true);
    } else {
        descriptionElement.textContent = "This user hasn't shared their story yet. Maybe they're the mysterious type! 😊";
        descriptionElement.className = 'not-provided-description';
        hideSectionLoading('about', true);
    }
}

/**
 * Display personal details with configuration mappings
 */
async function displayPersonalDetails(profile) {
    // Load necessary configuration arrays
    await loadConfigArrays(['SITUATION', 'CHEVEUX', 'YEUX', 'FUMEUR', 'ETUDES', 'TRAVAIL', 'POUR', 'SILHOUETTE', 'PERSONNALITE']);
    
    // Marital status
    if (profile.situation && configArrays.SITUATION) {
        const maritalStatus = configArrays.SITUATION[profile.situation];
        if (maritalStatus) {
            document.getElementById('maritalStatus').textContent = maritalStatus;
            document.getElementById('maritalStatusItem').style.display = 'flex';
        }
    }
    
    // Children (basic logic based on common patterns)
    if (profile.child !== undefined) {
        let childrenText = 'No information';
        if (profile.child === '0' || profile.child === 0) {
            childrenText = 'No children';
        } else if (profile.child === '1' || profile.child === 1) {
            childrenText = '1 child';
        } else if (profile.child > 1) {
            childrenText = `${profile.child} children`;
        }
        
        if (childrenText !== 'No information') {
            document.getElementById('children').textContent = childrenText;
            document.getElementById('childrenItem').style.display = 'flex';
        }
    }
    
    // Education
    if (profile.etudes && configArrays.ETUDES) {
        const education = configArrays.ETUDES[profile.etudes];
        if (education) {
            document.getElementById('education').textContent = education;
            document.getElementById('educationItem').style.display = 'flex';
        }
    }
    
    // Profession
    if (profile.travail && configArrays.TRAVAIL) {
        const profession = configArrays.TRAVAIL[profile.travail];
        if (profession) {
            document.getElementById('profession').textContent = profession;
            document.getElementById('professionItem').style.display = 'flex';
        }
    }
    
    // Smoking
    if (profile.fumeur && configArrays.FUMEUR) {
        const smoking = configArrays.FUMEUR[profile.fumeur];
        if (smoking) {
            document.getElementById('smoking').textContent = smoking;
            document.getElementById('smokingItem').style.display = 'flex';
        }
    }
    
    // Looking for
    if (profile.pour && configArrays.POUR) {
        const lookingFor = configArrays.POUR[profile.pour];
        if (lookingFor) {
            document.getElementById('lookingFor').textContent = lookingFor;
            document.getElementById('lookingForItem').style.display = 'flex';
        }
    }
    
    // Physical appearance section
    let hasAppearanceData = false;
    
    // Height
    if (profile.taille && profile.taille > 0) {
        document.getElementById('height').textContent = `${profile.taille} cm`;
        document.getElementById('heightItem').style.display = 'flex';
        hasAppearanceData = true;
    }
    
    // Weight
    if (profile.poids && profile.poids > 0) {
        document.getElementById('weight').textContent = `${profile.poids} kg`;
        document.getElementById('weightItem').style.display = 'flex';
        hasAppearanceData = true;
    }
    
    // Body type
    if (profile.silhouette && configArrays.SILHOUETTE) {
        const bodyType = configArrays.SILHOUETTE[profile.silhouette];
        if (bodyType) {
            document.getElementById('bodyType').textContent = bodyType;
            document.getElementById('bodyTypeItem').style.display = 'flex';
            hasAppearanceData = true;
        }
    }
    
    // Hair color
    if (profile.cheveux && configArrays.CHEVEUX) {
        const hairColor = configArrays.CHEVEUX[profile.cheveux];
        if (hairColor) {
            document.getElementById('hairColor').textContent = hairColor;
            document.getElementById('hairColorItem').style.display = 'flex';
            hasAppearanceData = true;
        }
    }
    
    // Eye color
    if (profile.yeux && configArrays.YEUX) {
        const eyeColor = configArrays.YEUX[profile.yeux];
        if (eyeColor) {
            document.getElementById('eyeColor').textContent = eyeColor;
            document.getElementById('eyeColorItem').style.display = 'flex';
            hasAppearanceData = true;
        }
    }
    
    // Show appearance section if has data
    if (hasAppearanceData) {
        hideSectionLoading('appearance', true);
    } else {
        hideSectionLoading('appearance', false);
    }
    
    // Hide personal details loading and show content
    const hasPersonalDetailsData = profile.situation || profile.child !== undefined || 
                                  profile.etudes || profile.travail || profile.fumeur || profile.pour;
    
    if (hasPersonalDetailsData) {
        hideSectionLoading('personalDetails', true);
    } else {
        hideSectionLoading('personalDetails', false);
    }
    
    // Personality section
    let hasPersonalityData = false;
    
    if (profile.personnalite && configArrays.PERSONNALITE) {
        const personality = configArrays.PERSONNALITE[profile.personnalite];
        if (personality) {
            document.getElementById('personality').textContent = personality;
            document.getElementById('personalityItem').style.display = 'flex';
            hasPersonalityData = true;
        }
    }
    
    // Interests
    if (profile.tab_interests2 && profile.tab_interests2.length > 0) {
        // TODO: Load interests configuration and display
        hasPersonalityData = true;
    }
    
    // Show personality section if has data
    if (hasPersonalityData) {
        document.getElementById('personalitySection').style.display = 'block';
    }
    
    // Rating section
    if (profile.vote && profile.vote > 0) {
        const rating = parseFloat(profile.moyenne) || 0;
        displayRating(rating, profile.vote);
        document.getElementById('ratingSection').style.display = 'block';
    }
}

/**
 * Display rating stars
 */
function displayRating(rating, votes) {
    const ratingStars = document.getElementById('ratingStars');
    const ratingValue = document.getElementById('ratingValue');
    const ratingVotes = document.getElementById('ratingVotes');
    
    if (!ratingStars || !ratingValue || !ratingVotes) {
        console.warn('[USER-PROFILE] Rating elements not found');
        return;
    }
    
    // Ensure rating is a valid number
    const validRating = parseFloat(rating) || 0;
    const validVotes = parseInt(votes) || 0;
    
    // Clear existing stars
    ratingStars.innerHTML = '';
    
    // Convert 0-10 rating to 0-5 stars
    const starRating = validRating / 2;
    const fullStars = Math.floor(starRating);
    const hasHalfStar = starRating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        const star = document.createElement('span');
        star.className = 'star filled';
        star.textContent = '★';
        ratingStars.appendChild(star);
    }
    
    // Add half star if needed
    if (hasHalfStar && fullStars < 5) {
        const star = document.createElement('span');
        star.className = 'star half';
        star.textContent = '★';
        ratingStars.appendChild(star);
    }
    
    // Add empty stars
    const totalStars = fullStars + (hasHalfStar ? 1 : 0);
    for (let i = totalStars; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'star empty';
        star.textContent = '☆';
        ratingStars.appendChild(star);
    }
    
    // Update text values
    ratingValue.textContent = `${validRating.toFixed(1)}/10`;
    ratingVotes.textContent = `(${validVotes} vote${validVotes !== 1 ? 's' : ''})`;
}

/**
 * Setup action buttons
 */
function setupActionButtons(profile) {
    const messageBtn = document.getElementById('messageBtn');
    
    if (!messageBtn) {
        console.warn('[USER-PROFILE] Message button not found');
        return;
    }
    
    if (!profile) {
        console.warn('[USER-PROFILE] No profile data for action buttons');
        return;
    }
    
    // Message button
    messageBtn.onclick = () => {
        const userId = profile.id || profile.id_membre;
        const userName = profile.nom_complet || profile.pseudo;
        
        if (!userId) {
            console.error('[USER-PROFILE] No user ID found for messaging');
            return;
        }
        
        // Redirect to messages page with contact parameter
        window.location.href = `messages.html?contact=${userId}`;
    };
}

/**
 * Load configuration arrays from API
 */
async function loadConfigArrays(arrayNames) {
    try {
        for (const arrayName of arrayNames) {
            if (configArrays[arrayName]) continue; // Already loaded
            
            try {
                const response = await fetch(`/api/spice-multi-test?endpoint=/index_api/array/get/${arrayName}&method=GET`);
                const result = await response.json();
                
                // Для массивов конфигурации API возвращает данные напрямую в result.data
                if (result.success && result.data && typeof result.data === 'object') {
                    configArrays[arrayName] = result.data;
                    console.log(`[USER-PROFILE] Loaded config array ${arrayName}:`, result.data);
                }
            } catch (error) {
                console.warn(`[USER-PROFILE] Failed to load config array ${arrayName}:`, error);
            }
        }
    } catch (error) {
        console.error('[USER-PROFILE] Error loading config arrays:', error);
    }
}

/**
 * Get zodiac sign from birth date
 */
function getZodiacSign(birthDate) {
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return zodiacSigns.aries;
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return zodiacSigns.taurus;
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return zodiacSigns.gemini;
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return zodiacSigns.cancer;
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return zodiacSigns.leo;
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return zodiacSigns.virgo;
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return zodiacSigns.libra;
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return zodiacSigns.scorpio;
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return zodiacSigns.sagittarius;
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return zodiacSigns.capricorn;
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return zodiacSigns.aquarius;
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return zodiacSigns.pisces;
    
    return null;
}

/**
 * Smart translation to English using OpenAI GPT
 */
async function translateToEnglish(text) {
    try {
        // Проверяем, нужен ли перевод (если текст очень короткий)
        if (!text || text.length < 10) {
            return text;
        }
        
        console.log('[USER-PROFILE] Attempting to translate text:', text);
        
        // Используем OpenAI API для перевода
        const response = await fetch('/api/translate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                targetLanguage: 'English'
            })
        });
        
        if (!response.ok) {
            console.warn('[USER-PROFILE] Translation API error:', response.status);
            return text;
        }
        
        const data = await response.json();
        
        if (data.success && data.translatedText) {
            console.log('[USER-PROFILE] Translation successful:', text, '->', data.translatedText);
            return data.translatedText;
        }
        
        console.warn('[USER-PROFILE] Translation API returned no result');
        return text;
    } catch (error) {
        console.warn('[USER-PROFILE] Translation failed:', error);
        return text;
    }
}


/**
 * Show section loading indicators
 */
function showSectionLoadingIndicators() {
    // Show loading for sections that will be populated
    const sections = [
        { section: 'aboutSection', loading: 'aboutLoading' },
        { section: 'personalDetailsSection', loading: 'personalDetailsLoading' },
        { section: 'appearanceSection', loading: 'appearanceLoading' }
    ];
    
    sections.forEach(({ section, loading }) => {
        const sectionEl = document.getElementById(section);
        const loadingEl = document.getElementById(loading);
        
        if (sectionEl && loadingEl) {
            sectionEl.style.display = 'block';
            loadingEl.style.display = 'flex';
        }
    });
}

/**
 * Hide section loading indicator and show content
 */
function hideSectionLoading(sectionName, hasContent = true) {
    const loadingEl = document.getElementById(`${sectionName}Loading`);
    const contentEl = document.getElementById(`${sectionName}Content`);
    const sectionEl = document.getElementById(`${sectionName}Section`);
    
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    if (hasContent && contentEl) {
        contentEl.style.display = 'block';
    } else if (!hasContent && sectionEl) {
        // Hide entire section if no content
        sectionEl.style.display = 'none';
    }
}

/**
 * Display photo gallery
 */
async function displayPhotoGallery(profile) {
    console.log('[USER-PROFILE] Displaying photo gallery...');
    
    const photosSection = document.getElementById('profilePhotosSection');
    const photosGrid = document.getElementById('profilePhotosGrid');
    
    if (!photosSection || !photosGrid) {
        console.warn('[USER-PROFILE] Photo gallery elements not found');
        return;
    }
    
    // Extract photos from profile data - prioritize public_album
    let photos = [];
    
    // First check public_album (from API logs)
    if (profile.public_album && typeof profile.public_album === 'object') {
        console.log('[USER-PROFILE] Found public_album:', profile.public_album);
        photos = Object.values(profile.public_album);
    }
    // Then check photos_v2 field (returned when get_picture_430=1)
    else if (profile.photos_v2) {
        console.log('[USER-PROFILE] Found photos_v2:', profile.photos_v2);
        
        if (profile.photos_v2.public && typeof profile.photos_v2.public === 'object') {
            photos = Object.values(profile.photos_v2.public);
        } else if (Array.isArray(profile.photos_v2)) {
            photos = profile.photos_v2;
        }
    }
    // Fallback to other photo fields
    else if (profile.photos && Array.isArray(profile.photos)) {
        photos = profile.photos;
    } else if (profile.all_photos && typeof profile.all_photos === 'object') {
        photos = Object.values(profile.all_photos);
    }
    
    console.log('[USER-PROFILE] Extracted photos:', photos);
    
    if (photos.length === 0) {
        console.log('[USER-PROFILE] No photos found');
        photosSection.style.display = 'none';
        return;
    }
    
    // Sort photos by number/order if available
    photos.sort((a, b) => {
        const numA = parseInt(a.num || a.order || 0);
        const numB = parseInt(b.num || b.order || 0);
        return numA - numB;
    });
    
    // Create photo gallery HTML with voting system
    const photosHTML = photos.map((photo, index) => {
        const photoUrl = getPhotoUrl(photo);
        const photoNum = photo.num || (index + 1);
        const photoId = `photo-${index}`;
        
        if (!photoUrl) {
            return ''; // Skip photos without URL
        }
        
        return `
            <div class="photo-item" data-photo-url="${photoUrl}" data-photo-num="${photoNum}">
                <img src="${photoUrl}" alt="Profile Photo ${index + 1}" loading="lazy" 
                     onclick="openPhotoModal('${photoUrl}')"
                     onerror="this.parentElement.style.display='none'">
                
                <!-- Photo Voting Widget -->
                <div class="photo-voting-widget">
                    <div class="voting-stars" data-photo-num="${photoNum}">
                        ${generateStarRating(10, photoNum)}
                    </div>
                    <div class="voting-info">
                        <span class="current-rating">Rate this photo (1-10)</span>
                    </div>
                </div>
            </div>
        `;
    }).filter(html => html !== '').join('');
    
    if (photosHTML === '') {
        console.log('[USER-PROFILE] No valid photo URLs found');
        photosSection.style.display = 'none';
        return;
    }
    
    // Display photos
    photosGrid.innerHTML = photosHTML;
    photosSection.style.display = 'block';
    
    console.log('[USER-PROFILE] ✅ Photo gallery displayed with', photos.length, 'photos');
}

/**
 * Get photo URL from photo object
 */
function getPhotoUrl(photo) {
    if (!photo) return null;
    
    // Priority order for photo URLs (normal quality first for better display)
    const urlFields = [
        'normal',      // Normal size - best for gallery display
        'real_size',   // Original size
        'sq_430',      // 430x430 square
        'sq_middle',   // Medium square
        'url_big',     // Big URL
        'url_middle',  // Middle URL
        'sq_small',    // Small square
        'url_small'    // Small URL
    ];
    
    for (const field of urlFields) {
        if (photo[field]) {
            let url = photo[field];
            
            // Fix relative URLs
            if (url && !url.startsWith('http') && !url.startsWith('//')) {
                if (url.startsWith('/')) {
                    url = 'https://dev2018.de5a7.com' + url;
                } else {
                    url = 'https://dev2018.de5a7.com/' + url;
                }
            }
            
            return url;
        }
    }
    
    return null;
}

/**
 * Open photo in modal
 */
function openPhotoModal(photoUrl) {
    const modal = document.getElementById('photoModal');
    const modalPhoto = document.getElementById('modalPhoto');
    
    if (modal && modalPhoto && photoUrl) {
        modalPhoto.src = photoUrl;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close photo modal
 */
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Show error state
 */
function showError() {
    document.getElementById('profileLoading').style.display = 'none';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('profileError').style.display = 'block';
}

// Initialize photo modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking close button
    const closeBtn = document.getElementById('closePhotoModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePhotoModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePhotoModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePhotoModal();
        }
    });
});

/**
 * Generate star rating HTML
 */
function generateStarRating(maxStars = 10, photoNum) {
    let starsHTML = '';
    for (let i = 1; i <= maxStars; i++) {
        starsHTML += `<span class="star" data-rating="${i}" data-photo-num="${photoNum}" onclick="voteForPhoto(${i}, ${photoNum})">${i}</span>`;
    }
    return starsHTML;
}

/**
 * Vote for a photo
 */
async function voteForPhoto(rating, photoNum) {
    console.log('[PHOTO-VOTE] Voting for photo:', photoNum, 'with rating:', rating);
    
    try {
        if (!currentProfile) {
            console.error('[PHOTO-VOTE] No current profile available');
            showVotingNotification('Error: Profile not loaded', 'error');
            return;
        }
        
        const sessionId = window.authManager?.sessionId;
        if (!sessionId) {
            console.error('[PHOTO-VOTE] No session ID available');
            showVotingNotification('Please log in to vote', 'error');
            return;
        }

        const ownerId = currentProfile.id || currentProfile.id_membre;
        if (!ownerId) {
            console.error('[PHOTO-VOTE] No owner ID found');
            showVotingNotification('Error: Cannot identify photo owner', 'error');
            return;
        }

        // Get API key
        const apiConfigResponse = await fetch('/api/get-api-key');
        const apiConfig = await apiConfigResponse.json();
        
        if (!apiConfig.apiKey) {
            console.error('[PHOTO-VOTE] No API key available');
            showVotingNotification('Configuration error', 'error');
            return;
        }
        
        const params = new URLSearchParams({
            api_key: apiConfig.apiKey,
            session_id: sessionId,
            id: ownerId,
            num: photoNum,
            score: rating
        });
        
        console.log('[PHOTO-VOTE] Sending vote with params:', params.toString());
        
        // Show loading state
        updateVotingUI(photoNum, rating, 'loading');
        
        const response = await fetch(`/api/spice-multi-test?endpoint=/ajax_api/gal_vote&method=GET&${params}`);
        const result = await response.json();
        
        console.log('[PHOTO-VOTE] API Response:', result);
        
        if (result.success && result.data) {
            // Success - update UI
            updateVotingUI(photoNum, rating, 'success');
            showVotingNotification(`You rated this photo ${rating}/10!`, 'success');
            console.log('[PHOTO-VOTE] ✅ Vote submitted successfully');
        } else {
            // Error from API
            console.error('[PHOTO-VOTE] API returned error:', result);
            updateVotingUI(photoNum, rating, 'error');
            showVotingNotification('Failed to submit vote. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('[PHOTO-VOTE] Error voting for photo:', error);
        updateVotingUI(photoNum, rating, 'error');
        showVotingNotification('Network error. Please try again.', 'error');
    }
}

/**
 * Update voting UI based on state
 */
function updateVotingUI(photoNum, rating, state) {
    const votingWidget = document.querySelector(`[data-photo-num="${photoNum}"] .photo-voting-widget`);
    const stars = document.querySelectorAll(`[data-photo-num="${photoNum}"] .star`);
    const ratingInfo = document.querySelector(`[data-photo-num="${photoNum}"] .current-rating`);
    
    if (!votingWidget || !ratingInfo) return;
    
    switch (state) {
        case 'loading':
            ratingInfo.textContent = 'Submitting vote...';
            stars.forEach(star => star.style.pointerEvents = 'none');
            break;
            
        case 'success':
            ratingInfo.textContent = `You rated: ${rating}/10`;
            votingWidget.classList.add('voted');
            // Highlight voted stars
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.add('voted');
                }
                star.style.pointerEvents = 'none'; // Disable further voting
            });
            break;
            
        case 'error':
            ratingInfo.textContent = 'Rate this photo (1-10)';
            stars.forEach(star => star.style.pointerEvents = 'auto');
            break;
    }
}

/**
 * Show voting notification
 */
function showVotingNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `voting-notification voting-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('voting-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'voting-notification-styles';
        styles.textContent = `
            .voting-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 350px;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease;
                font-size: 14px;
            }
            
            .voting-notification-success {
                background: #10b981;
                color: white;
            }
            
            .voting-notification-error {
                background: #ef4444;
                color: white;
            }
            
            .voting-notification-info {
                background: #3b82f6;
                color: white;
            }
            
            .voting-notification .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .voting-notification .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add notification to page
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

// Make functions globally available
window.initializeUserProfile = initializeUserProfile;
window.openPhotoModal = openPhotoModal;
window.closePhotoModal = closePhotoModal;
window.voteForPhoto = voteForPhoto;


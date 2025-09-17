// User Profile System
// Handles loading and displaying detailed user profile information

// Configuration arrays cache
const configArrays = {};

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
        
        // Update page title
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
        
        // Hide loading, show content
        document.getElementById('profileLoading').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
        
        // Basic information
        await displayBasicInfo(profile);
        
        // Profile photo
        await displayProfilePhoto(profile);
        
        // Description
        await displayDescription(profile);
        
        // Personal details
        await displayPersonalDetails(profile);
        
        // Setup action buttons
        setupActionButtons(profile);
        
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
    // Full name
    const fullName = profile.nom_complet || profile.pseudo || 'Unknown User';
    document.getElementById('profileFullName').textContent = fullName;
    
    // Age
    if (profile.age) {
        document.getElementById('profileAge').textContent = profile.age;
    }
    
    // Location - используем zone_name из API документации
    if (profile.zone_name) {
        document.getElementById('profileLocation').textContent = profile.zone_name;
    }
    
    // Birth date and zodiac - используем поле naissance из API документации
    if (profile.naissance && profile.naissance !== '1988-03-20') { // Skip default dates
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
    if (profile.description && profile.description.trim()) {
        const aboutSection = document.getElementById('aboutSection');
        const descriptionElement = document.getElementById('profileDescription');
        
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
        aboutSection.style.display = 'block';
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
        document.getElementById('appearanceSection').style.display = 'block';
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
        displayRating(profile.moyenne || 0, profile.vote);
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
    
    // Clear existing stars
    ratingStars.innerHTML = '';
    
    // Convert 0-10 rating to 0-5 stars
    const starRating = rating / 2;
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
    ratingValue.textContent = `${rating.toFixed(1)}/10`;
    ratingVotes.textContent = `(${votes} vote${votes !== 1 ? 's' : ''})`;
}

/**
 * Setup action buttons
 */
function setupActionButtons(profile) {
    const messageBtn = document.getElementById('messageBtn');
    
    // Message button
    messageBtn.onclick = () => {
        const userId = profile.id || profile.id_membre;
        const userName = profile.nom_complet || profile.pseudo;
        
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
 * Simple translation to English (basic implementation)
 */
async function translateToEnglish(text) {
    // For now, return original text
    // In the future, we could integrate with a translation API
    return text;
}


/**
 * Show error state
 */
function showError() {
    document.getElementById('profileLoading').style.display = 'none';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('profileError').style.display = 'block';
}

// Make functions globally available
window.initializeUserProfile = initializeUserProfile;


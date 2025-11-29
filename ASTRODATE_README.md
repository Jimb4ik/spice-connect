# ✨ AstroDate - Astrological Dating Platform

**Discover Your Cosmic Match Through the Wisdom of the Stars**

AstroDate is an advanced dating platform that uses sophisticated astrological compatibility analysis to help users find their perfect match. Unlike traditional dating apps that rely solely on basic preferences, AstroDate leverages the ancient wisdom of astrology combined with modern algorithms to calculate deep compatibility across multiple dimensions.

---

## 🌟 Key Features

### 1. **Advanced Astrological Compatibility Engine**

Our proprietary astrology engine (`astro-engine.js`) calculates compatibility based on:

- **Zodiac Signs** - Sun sign compatibility analysis
- **Ascendants** - Rising sign harmony evaluation  
- **Planetary Positions** - Analysis of Venus, Mars, Moon, Mercury, Jupiter, Saturn positions
- **Elemental Balance** - Fire, Earth, Air, Water element distribution
- **Houses & Aspects** - Comprehensive synastry analysis

### 2. **Multi-Dimensional Compatibility Scores**

Users receive detailed compatibility percentages across 6 life spheres:

- ❤️ **Love** (35% Venus, 25% Sun, 20% Moon influence)
- 🤝 **Friendship** (30% Mercury, 25% Moon, 20% Jupiter influence)
- 🔥 **Passion** (40% Mars, 30% Venus, 15% Sun influence)
- 💼 **Partnership** (35% Mercury, 30% Saturn, 25% Mars influence)
- 💕 **Emotional** (25% Moon, 20% Venus, 20% Sun influence)
- 🧠 **Mental** (30% Mercury, 20% Jupiter influence)

### 3. **Intelligent Profile Sorting**

The system automatically:
- Fetches user profiles via API
- Extracts birth dates
- Calculates compatibility for each profile
- Sorts profiles from highest to lowest compatibility
- Presents users with their best cosmic matches first

### 4. **Beautiful Visualizations**

- Interactive compatibility cards with animated progress bars
- Circular compatibility score indicators
- Color-coded spheres (green for excellent, blue for great, purple for good)
- Zodiac sign emojis and cosmic design elements
- Responsive and mobile-optimized UI

---

## 🎨 Architecture

### Core Components

```
js/
├── astro-engine.js              # Core astrological calculations
├── astro-compatibility-ui.js    # UI components and visualizations
├── astro-matching-system.js     # Integration with matching system
└── matching-system-v2.js        # Original matching system (preserved)

css/
└── astro-compatibility.css      # Styling for astro components

discover.html                     # Main discovery page with astro features
```

### How It Works

1. **User Authentication** - System loads current user's birth date
2. **Profile Loading** - Profiles fetched from Spice API
3. **Compatibility Calculation** - Each profile analyzed against user
4. **Smart Sorting** - Profiles ranked by compatibility score
5. **Visual Presentation** - Beautiful cards show match details
6. **User Interaction** - Like/dislike maintains existing workflow

---

## 🔮 Astrological Calculations

### Compatibility Formula

```
Overall Score = (Sign Compatibility × 30%) +
                (Ascendant Compatibility × 20%) +
                (Elemental Harmony × 25%) +
                (Planetary Aspects × 25%)
```

### Sign Compatibility Matrix

Based on traditional astrological wisdom:
- **Excellent** (90-95%): Same element or complementary signs
- **Great** (80-89%): Trine aspects (120° apart)
- **Good** (70-79%): Sextile aspects (60° apart)
- **Moderate** (50-69%): Square or opposition aspects

### Elemental Compatibility

- Fire + Air = Excellent (90%)
- Earth + Water = Excellent (85-90%)
- Fire + Fire = Great (85%)
- Same element = Great (80-90%)
- Challenging pairs = Moderate (40-50%)

---

## 🚀 Quick Start

### Prerequisites

- Spice API credentials configured
- User authentication system active
- Birth dates available in user profiles

### Integration

1. **Include Scripts in HTML:**

```html
<!-- AstroDate Engine -->
<script src="js/astro-engine.js?v=1.0"></script>
<script src="js/astro-compatibility-ui.js?v=1.0"></script>
<script src="js/astro-matching-system.js?v=1.0"></script>

<!-- Styles -->
<link rel="stylesheet" href="css/astro-compatibility.css">
```

2. **Initialize System:**

```javascript
// Automatic initialization when DOM loads
// System will initialize after authManager is ready

// Access global instances:
window.astroEngine          // Core calculations
window.astroUI              // UI components
window.astroMatchingSystem  // Integration layer
```

3. **Use in Your Code:**

```javascript
// Calculate compatibility between two people
const compatibility = window.astroEngine.calculateCompatibility(
  '1990-06-15',  // User's birth date
  '1992-08-22'   // Partner's birth date
);

// Display compatibility card
const cardHTML = window.astroUI.createCompatibilityCard(
  compatibility, 
  profileData
);

// Show modal with details
window.astroUI.showCompatibilityModal(compatibility, profileData);
```

---

## 📊 API Integration

### Profile Data Requirements

The system expects profiles with birth date information:

```javascript
{
  id: "12345",
  pseudo: "User Name",
  age: 30,
  date_naissance: "1994-05-15",  // Primary field
  // Alternative fields also supported:
  // birth_date, birthday, date_of_birth
  ville: "Paris",
  photos_v2: { ... }
}
```

### Fallback Logic

If birth date is missing:
1. Calculate from `age` field (uses middle of year)
2. Use default date for testing (1995-01-01)

---

## 🎯 Features Preserved

The AstroDate upgrade **maintains all existing functionality**:

✅ Match system (likes/dislikes)  
✅ Chat system  
✅ Gift sending  
✅ Credit system  
✅ Payments & payouts  
✅ User profiles  
✅ Photo management  

**The astrology features are additive enhancements!**

---

## 💡 Usage Examples

### Example 1: Display Compatibility Badge

```javascript
// Add compatibility badge to profile card
const cardElement = document.getElementById('profileCard');
const compatibility = astroMatchingSystem.calculateCompatibilityForProfile(profile);
astroUI.addCompatibilityToProfileCard(cardElement, compatibility);
```

### Example 2: Get Top Matches

```javascript
// Get top 10 most compatible profiles
const topMatches = astroMatchingSystem.getTopMatches(10);
topMatches.forEach(profile => {
  console.log(`${profile.pseudo}: ${profile.astroScore}% ${profile.astroHighlight.emoji}`);
});
```

### Example 3: Filter by Minimum Compatibility

```javascript
// Only show profiles with 70%+ compatibility
astroMatchingSystem.filterByMinCompatibility(70);
```

---

## 🌈 Customization

### Adjust Compatibility Weights

Edit `astro-engine.js` to modify calculation weights:

```javascript
const overallScore = Math.round(
  signScore * 0.30 +      // Adjust these weights
  ascendantScore * 0.20 +
  elementScore * 0.25 +
  planetScore * 0.25
);
```

### Customize Sphere Calculations

Modify `calculateSphereCompatibility()` to adjust sphere-specific planet influences:

```javascript
const loveScore = this.calculateSphereScore(
  ['Venus', 'Moon', 'Sun'],  // Planets that influence love
  planets1, planets2, baseCompatibility
);
```

### Style Customization

Edit `css/astro-compatibility.css`:

```css
:root {
  --astro-primary: #8b5cf6;     /* Main purple */
  --astro-secondary: #ec4899;   /* Pink accent */
  --astro-accent: #f59e0b;      /* Gold highlights */
}
```

---

## 📱 Mobile Responsiveness

The system is fully responsive:
- Cards adapt to screen size
- Touch-friendly interactions
- Optimized for mobile discovery experience
- Swipe gestures supported (via existing system)

---

## 🔒 Privacy & Security

- Birth dates are only used for compatibility calculations
- No personal astrological data is shared with other users
- Calculations happen client-side for privacy
- Compatible with existing security measures

---

## 🐛 Troubleshooting

### Issue: Compatibility not showing

**Solution:** Check that:
1. `astro-engine.js` is loaded before other astro scripts
2. User has a valid birth date in their profile
3. Browser console for any errors

### Issue: Scores seem inaccurate

**Solution:** 
1. Verify birth dates are in correct format (YYYY-MM-DD)
2. Check that profile data contains required fields
3. Review compatibility matrix in `astro-engine.js`

### Issue: UI not appearing

**Solution:**
1. Ensure `astro-compatibility.css` is loaded
2. Check for CSS conflicts with existing styles
3. Verify DOM elements have correct IDs/classes

---

## 🚧 Future Enhancements

Planned features:
- [ ] Birth time support for more accurate ascendants
- [ ] Birth location for house calculations
- [ ] Detailed synastry charts
- [ ] Transit predictions
- [ ] Compatibility insights with AI explanations
- [ ] Multiple language support
- [ ] Vedic astrology option

---

## 📚 Astrological References

The system is based on:
- Western tropical astrology
- Synastry (relationship astrology)
- Elemental theory
- Planetary rulership system
- Aspect theory (conjunctions, trines, squares, etc.)

---

## 💬 Support

For questions or issues:
- Check documentation above
- Review code comments in `astro-engine.js`
- Test in browser console: `window.astroEngine`, `window.astroUI`

---

## 📄 License

Part of the AstroDate platform. All rights reserved.

---

## 🌟 Credits

**Developed with cosmic inspiration** ✨

Built on top of the existing Lavrilo platform, enhanced with astrological wisdom to create meaningful connections guided by the stars.

---

**May the stars guide your path to love!** 💫


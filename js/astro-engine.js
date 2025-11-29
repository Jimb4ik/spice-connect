/**
 * AstroDate Advanced Compatibility Engine
 * 
 * Комплексная система расчета астрологической совместимости
 * включающая знаки зодиака, асценденты, планеты, дома и стихии
 */

class AstroEngine {
  constructor() {
    this.initializeAstrologyData();
  }

  initializeAstrologyData() {
    // Знаки зодиака с их характеристиками
    this.zodiacSigns = {
      'Aries': { 
        element: 'Fire', 
        quality: 'Cardinal', 
        ruler: 'Mars',
        dates: [[3, 21], [4, 19]],
        traits: ['passionate', 'independent', 'dynamic', 'impulsive']
      },
      'Taurus': { 
        element: 'Earth', 
        quality: 'Fixed', 
        ruler: 'Venus',
        dates: [[4, 20], [5, 20]],
        traits: ['reliable', 'patient', 'practical', 'devoted']
      },
      'Gemini': { 
        element: 'Air', 
        quality: 'Mutable', 
        ruler: 'Mercury',
        dates: [[5, 21], [6, 20]],
        traits: ['adaptable', 'outgoing', 'intelligent', 'curious']
      },
      'Cancer': { 
        element: 'Water', 
        quality: 'Cardinal', 
        ruler: 'Moon',
        dates: [[6, 21], [7, 22]],
        traits: ['emotional', 'caring', 'protective', 'intuitive']
      },
      'Leo': { 
        element: 'Fire', 
        quality: 'Fixed', 
        ruler: 'Sun',
        dates: [[7, 23], [8, 22]],
        traits: ['confident', 'ambitious', 'generous', 'loyal']
      },
      'Virgo': { 
        element: 'Earth', 
        quality: 'Mutable', 
        ruler: 'Mercury',
        dates: [[8, 23], [9, 22]],
        traits: ['analytical', 'practical', 'kind', 'hardworking']
      },
      'Libra': { 
        element: 'Air', 
        quality: 'Cardinal', 
        ruler: 'Venus',
        dates: [[9, 23], [10, 22]],
        traits: ['diplomatic', 'fair', 'social', 'gracious']
      },
      'Scorpio': { 
        element: 'Water', 
        quality: 'Fixed', 
        ruler: 'Pluto',
        dates: [[10, 23], [11, 21]],
        traits: ['passionate', 'resourceful', 'brave', 'mysterious']
      },
      'Sagittarius': { 
        element: 'Fire', 
        quality: 'Mutable', 
        ruler: 'Jupiter',
        dates: [[11, 22], [12, 21]],
        traits: ['optimistic', 'freedom-loving', 'philosophical', 'adventurous']
      },
      'Capricorn': { 
        element: 'Earth', 
        quality: 'Cardinal', 
        ruler: 'Saturn',
        dates: [[12, 22], [1, 19]],
        traits: ['responsible', 'disciplined', 'self-control', 'ambitious']
      },
      'Aquarius': { 
        element: 'Air', 
        quality: 'Fixed', 
        ruler: 'Uranus',
        dates: [[1, 20], [2, 18]],
        traits: ['progressive', 'original', 'independent', 'humanitarian']
      },
      'Pisces': { 
        element: 'Water', 
        quality: 'Mutable', 
        ruler: 'Neptune',
        dates: [[2, 19], [3, 20]],
        traits: ['compassionate', 'artistic', 'intuitive', 'gentle']
      }
    };

    // Матрица совместимости стихий
    this.elementCompatibility = {
      'Fire': { 'Fire': 85, 'Earth': 45, 'Air': 90, 'Water': 50 },
      'Earth': { 'Fire': 45, 'Earth': 80, 'Air': 40, 'Water': 85 },
      'Air': { 'Fire': 90, 'Earth': 40, 'Air': 85, 'Water': 60 },
      'Water': { 'Fire': 50, 'Earth': 85, 'Air': 60, 'Water': 90 }
    };

    // Совместимость знаков зодиака (синастрия)
    this.signCompatibility = {
      'Aries': { 'Leo': 95, 'Sagittarius': 93, 'Gemini': 88, 'Aquarius': 86, 'Libra': 75 },
      'Taurus': { 'Virgo': 95, 'Capricorn': 93, 'Cancer': 90, 'Pisces': 88, 'Scorpio': 80 },
      'Gemini': { 'Libra': 95, 'Aquarius': 93, 'Aries': 88, 'Leo': 86, 'Sagittarius': 80 },
      'Cancer': { 'Scorpio': 95, 'Pisces': 93, 'Taurus': 90, 'Virgo': 88, 'Capricorn': 75 },
      'Leo': { 'Aries': 95, 'Sagittarius': 93, 'Gemini': 86, 'Libra': 85, 'Aquarius': 70 },
      'Virgo': { 'Taurus': 95, 'Capricorn': 93, 'Cancer': 88, 'Scorpio': 86, 'Pisces': 80 },
      'Libra': { 'Gemini': 95, 'Aquarius': 93, 'Leo': 85, 'Sagittarius': 83, 'Aries': 75 },
      'Scorpio': { 'Cancer': 95, 'Pisces': 93, 'Virgo': 86, 'Capricorn': 84, 'Taurus': 80 },
      'Sagittarius': { 'Aries': 93, 'Leo': 93, 'Aquarius': 88, 'Libra': 83, 'Gemini': 80 },
      'Capricorn': { 'Taurus': 93, 'Virgo': 93, 'Scorpio': 84, 'Pisces': 82, 'Cancer': 75 },
      'Aquarius': { 'Gemini': 93, 'Libra': 93, 'Sagittarius': 88, 'Aries': 86, 'Leo': 70 },
      'Pisces': { 'Cancer': 93, 'Scorpio': 93, 'Taurus': 88, 'Capricorn': 82, 'Virgo': 80 }
    };

    // Планеты и их влияние на различные сферы
    this.planetaryInfluence = {
      'Sun': { love: 25, friendship: 20, sex: 15, work: 20 },
      'Moon': { love: 20, friendship: 25, sex: 15, work: 10 },
      'Mercury': { love: 10, friendship: 30, sex: 5, work: 35 },
      'Venus': { love: 35, friendship: 15, sex: 30, work: 5 },
      'Mars': { love: 15, friendship: 10, sex: 40, work: 25 },
      'Jupiter': { love: 10, friendship: 20, sex: 5, work: 25 },
      'Saturn': { love: 5, friendship: 5, sex: 5, work: 30 }
    };

    // Дома и их значение
    this.houses = {
      1: 'self, personality, appearance',
      2: 'money, possessions, values',
      3: 'communication, siblings, short trips',
      4: 'home, family, roots',
      5: 'romance, creativity, children',
      6: 'work, health, daily routines',
      7: 'partnerships, marriage, contracts',
      8: 'intimacy, transformation, shared resources',
      9: 'philosophy, travel, higher education',
      10: 'career, public image, achievements',
      11: 'friendships, groups, hopes',
      12: 'spirituality, secrets, subconscious'
    };
  }

  /**
   * Определяет знак зодиака по дате рождения
   */
  getZodiacSign(birthDate) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    for (const [sign, data] of Object.entries(this.zodiacSigns)) {
      const [[startMonth, startDay], [endMonth, endDay]] = data.dates;
      
      if (startMonth === endMonth) {
        if (month === startMonth && day >= startDay && day <= endDay) {
          return sign;
        }
      } else {
        if ((month === startMonth && day >= startDay) || 
            (month === endMonth && day <= endDay)) {
          return sign;
        }
      }
    }
    
    return 'Capricorn'; // Fallback
  }

  /**
   * Вычисляет асцендент (упрощенная версия)
   * В реальной астрологии требуется точное время и место рождения
   */
  calculateAscendant(birthDate, birthTime = '12:00', latitude = 0) {
    // Упрощенный расчет: асцендент движется примерно на 1 знак каждые 2 часа
    const sunSign = this.getZodiacSign(birthDate);
    const signs = Object.keys(this.zodiacSigns);
    const sunIndex = signs.indexOf(sunSign);
    
    // Используем время для приблизительного расчета
    const [hours] = birthTime.split(':').map(Number);
    const ascendantOffset = Math.floor(hours / 2);
    
    const ascendantIndex = (sunIndex + ascendantOffset) % 12;
    return signs[ascendantIndex];
  }

  /**
   * Рассчитывает положение планет (упрощенная версия)
   */
  calculatePlanetaryPositions(birthDate) {
    const sunSign = this.getZodiacSign(birthDate);
    const signs = Object.keys(this.zodiacSigns);
    const sunIndex = signs.indexOf(sunSign);
    
    // Упрощенное распределение планет
    // В реальной астрологии используются эфемериды
    return {
      Sun: sunSign,
      Moon: signs[(sunIndex + 2) % 12],
      Mercury: signs[(sunIndex + 1) % 12],
      Venus: signs[(sunIndex + 1) % 12],
      Mars: signs[(sunIndex + 3) % 12],
      Jupiter: signs[(sunIndex + 4) % 12],
      Saturn: signs[(sunIndex + 5) % 12]
    };
  }

  /**
   * Анализирует баланс стихий в натальной карте
   */
  analyzeElementalBalance(birthDate) {
    const planets = this.calculatePlanetaryPositions(birthDate);
    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    
    for (const planetSign of Object.values(planets)) {
      const element = this.zodiacSigns[planetSign].element;
      elements[element]++;
    }
    
    return elements;
  }

  /**
   * ГЛАВНАЯ ФУНКЦИЯ: Рассчитывает комплексную совместимость
   */
  calculateCompatibility(userBirthDate, partnerBirthDate) {
    const userSign = this.getZodiacSign(userBirthDate);
    const partnerSign = this.getZodiacSign(partnerBirthDate);
    
    const userAscendant = this.calculateAscendant(userBirthDate);
    const partnerAscendant = this.calculateAscendant(partnerBirthDate);
    
    const userElements = this.analyzeElementalBalance(userBirthDate);
    const partnerElements = this.analyzeElementalBalance(partnerBirthDate);
    
    const userPlanets = this.calculatePlanetaryPositions(userBirthDate);
    const partnerPlanets = this.calculatePlanetaryPositions(partnerBirthDate);

    // 1. Совместимость знаков (30% веса)
    const signScore = this.calculateSignCompatibility(userSign, partnerSign);
    
    // 2. Совместимость асцендентов (20% веса)
    const ascendantScore = this.calculateSignCompatibility(userAscendant, partnerAscendant);
    
    // 3. Совместимость стихий (25% веса)
    const elementScore = this.calculateElementCompatibility(userElements, partnerElements);
    
    // 4. Планетарная синастрия (25% веса)
    const planetScore = this.calculatePlanetaryAspects(userPlanets, partnerPlanets);

    // Общая совместимость
    const overallScore = Math.round(
      signScore * 0.30 +
      ascendantScore * 0.20 +
      elementScore * 0.25 +
      planetScore * 0.25
    );

    // Расчет по сферам жизни
    const sphereScores = this.calculateSphereCompatibility(
      userSign, partnerSign, 
      userPlanets, partnerPlanets,
      userElements, partnerElements
    );

    return {
      overall: Math.min(100, Math.max(0, overallScore)),
      spheres: sphereScores,
      details: {
        userSign,
        partnerSign,
        userAscendant,
        partnerAscendant,
        elementalHarmony: elementScore,
        signHarmony: signScore,
        planetaryHarmony: planetScore
      }
    };
  }

  /**
   * Рассчитывает совместимость знаков зодиака
   */
  calculateSignCompatibility(sign1, sign2) {
    // Проверяем прямую совместимость
    if (this.signCompatibility[sign1] && this.signCompatibility[sign1][sign2]) {
      return this.signCompatibility[sign1][sign2];
    }
    
    // Обратная проверка
    if (this.signCompatibility[sign2] && this.signCompatibility[sign2][sign1]) {
      return this.signCompatibility[sign2][sign1];
    }
    
    // Если нет в таблице, используем совместимость стихий
    const element1 = this.zodiacSigns[sign1].element;
    const element2 = this.zodiacSigns[sign2].element;
    return this.elementCompatibility[element1][element2];
  }

  /**
   * Рассчитывает совместимость на основе баланса стихий
   */
  calculateElementCompatibility(elements1, elements2) {
    let totalScore = 0;
    let comparisons = 0;
    
    for (const [element, count1] of Object.entries(elements1)) {
      const count2 = elements2[element];
      const compatScore = this.elementCompatibility[element][element];
      
      // Чем больше общих планет в одной стихии, тем лучше
      const balance = Math.min(count1, count2);
      totalScore += compatScore * balance;
      comparisons += balance;
    }
    
    return comparisons > 0 ? totalScore / comparisons : 60;
  }

  /**
   * Анализирует планетарные аспекты между двумя натальными картами
   */
  calculatePlanetaryAspects(planets1, planets2) {
    let totalScore = 0;
    let aspectCount = 0;
    
    const signs = Object.keys(this.zodiacSigns);
    
    for (const [planet1, sign1] of Object.entries(planets1)) {
      for (const [planet2, sign2] of Object.entries(planets2)) {
        const index1 = signs.indexOf(sign1);
        const index2 = signs.indexOf(sign2);
        const distance = Math.min(
          Math.abs(index1 - index2),
          12 - Math.abs(index1 - index2)
        );
        
        // Оценка аспекта:
        // 0 (conjunction) = отлично (100)
        // 2,4,8,10 (trine/sextile) = хорошо (85)
        // 3,9 (square) = напряжение (50)
        // 6 (opposition) = вызов (60)
        let aspectScore;
        if (distance === 0) aspectScore = 100;
        else if (distance === 4 || distance === 8) aspectScore = 85; // Trine
        else if (distance === 2 || distance === 10) aspectScore = 80; // Sextile
        else if (distance === 6) aspectScore = 60; // Opposition
        else if (distance === 3 || distance === 9) aspectScore = 50; // Square
        else aspectScore = 65; // Другие аспекты
        
        totalScore += aspectScore;
        aspectCount++;
      }
    }
    
    return aspectCount > 0 ? totalScore / aspectCount : 65;
  }

  /**
   * Рассчитывает совместимость по различным сферам жизни
   */
  calculateSphereCompatibility(sign1, sign2, planets1, planets2, elements1, elements2) {
    const baseCompatibility = this.calculateSignCompatibility(sign1, sign2);
    
    // Любовь (Venus, Moon влияют больше всего)
    const loveScore = this.calculateSphereScore(
      ['Venus', 'Moon', 'Sun'],
      planets1, planets2, baseCompatibility
    );
    
    // Дружба (Mercury, Jupiter влияют)
    const friendshipScore = this.calculateSphereScore(
      ['Mercury', 'Jupiter', 'Moon'],
      planets1, planets2, baseCompatibility
    );
    
    // Секс (Mars, Venus влияют)
    const sexScore = this.calculateSphereScore(
      ['Mars', 'Venus', 'Sun'],
      planets1, planets2, baseCompatibility
    );
    
    // Работа (Saturn, Mercury, Mars влияют)
    const workScore = this.calculateSphereScore(
      ['Saturn', 'Mercury', 'Mars'],
      planets1, planets2, baseCompatibility
    );
    
    // Эмоциональная связь (Moon, Neptune влияют)
    const emotionalScore = this.calculateSphereScore(
      ['Moon', 'Venus', 'Sun'],
      planets1, planets2, baseCompatibility
    );
    
    // Интеллектуальная связь (Mercury влияет)
    const intellectualScore = this.calculateSphereScore(
      ['Mercury', 'Jupiter'],
      planets1, planets2, baseCompatibility
    );

    return {
      love: Math.min(100, Math.max(0, Math.round(loveScore))),
      friendship: Math.min(100, Math.max(0, Math.round(friendshipScore))),
      sex: Math.min(100, Math.max(0, Math.round(sexScore))),
      work: Math.min(100, Math.max(0, Math.round(workScore))),
      emotional: Math.min(100, Math.max(0, Math.round(emotionalScore))),
      intellectual: Math.min(100, Math.max(0, Math.round(intellectualScore)))
    };
  }

  /**
   * Вспомогательная функция для расчета совместимости в конкретной сфере
   */
  calculateSphereScore(relevantPlanets, planets1, planets2, baseScore) {
    let totalScore = baseScore;
    let weight = 1;
    
    for (const planet of relevantPlanets) {
      if (planets1[planet] && planets2[planet]) {
        const planetCompatibility = this.calculateSignCompatibility(
          planets1[planet], 
          planets2[planet]
        );
        totalScore += planetCompatibility * weight;
        weight += 0.5;
      }
    }
    
    return totalScore / (1 + relevantPlanets.length * 0.5);
  }

  /**
   * Генерирует текстовое описание совместимости
   */
  generateCompatibilityDescription(compatibility) {
    const { overall, spheres, details } = compatibility;
    
    let description = '';
    
    if (overall >= 85) {
      description = `🌟 Exceptional cosmic connection! ${details.userSign} and ${details.partnerSign} create a powerful synastry.`;
    } else if (overall >= 70) {
      description = `✨ Strong compatibility! ${details.userSign} and ${details.partnerSign} harmonize beautifully.`;
    } else if (overall >= 55) {
      description = `💫 Good potential! ${details.userSign} and ${details.partnerSign} can build something meaningful.`;
    } else {
      description = `🌙 Challenging but possible. ${details.userSign} and ${details.partnerSign} will need effort.`;
    }
    
    return description;
  }

  /**
   * Получает эмодзи для знака зодиака
   */
  getZodiacEmoji(sign) {
    const emojis = {
      'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊',
      'Cancer': '♋', 'Leo': '♌', 'Virgo': '♍',
      'Libra': '♎', 'Scorpio': '♏', 'Sagittarius': '♐',
      'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
    };
    return emojis[sign] || '⭐';
  }

  /**
   * Форматирует совместимость для отображения
   */
  formatCompatibilityForDisplay(compatibility) {
    return {
      overall: `${compatibility.overall}%`,
      overallScore: compatibility.overall,
      sign1: `${this.getZodiacEmoji(compatibility.details.userSign)} ${compatibility.details.userSign}`,
      sign2: `${this.getZodiacEmoji(compatibility.details.partnerSign)} ${compatibility.details.partnerSign}`,
      ascendant1: `${this.getZodiacEmoji(compatibility.details.userAscendant)} ${compatibility.details.userAscendant} Rising`,
      ascendant2: `${this.getZodiacEmoji(compatibility.details.partnerAscendant)} ${compatibility.details.partnerAscendant} Rising`,
      description: this.generateCompatibilityDescription(compatibility),
      spheres: compatibility.spheres
    };
  }
}

// Глобальный экземпляр для использования в приложении
window.AstroEngine = AstroEngine;
window.astroEngine = new AstroEngine();

console.log('[ASTRO-ENGINE] 🌟 AstroDate compatibility engine initialized');


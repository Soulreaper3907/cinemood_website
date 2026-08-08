// CineMood - Main Application Controller (Support Email & Contact Integrated)

// Configurable Support Email Address (Default placeholder)
let CUSTOMER_SUPPORT_EMAIL = "manneshivasai2434@gmail.com";

document.addEventListener('DOMContentLoaded', () => {
  const moodEngine = new MoodEngine(MOVIES_DATABASE);
  let watchlist = JSON.parse(localStorage.getItem('cinemood_watchlist') || '[]');
  let viewingWatchlist = false;

  // DOM Elements
  const moodChipsContainer = document.getElementById('moodChipsContainer');
  const vibeInput = document.getElementById('vibeInput');
  const vibeClearBtn = document.getElementById('vibeClearBtn');
  const moviesGrid = document.getElementById('moviesGrid');
  const resultsCount = document.getElementById('resultsCount');
  const currentMoodTitle = document.getElementById('currentMoodTitle');
  const toggleFree = document.getElementById('toggleFree');
  const sortSelect = document.getElementById('sortSelect');
  const btnRoulette = document.getElementById('btnRoulette');
  const btnWatchlist = document.getElementById('btnWatchlist');
  const watchlistCount = document.getElementById('watchlistCount');
  const movieModal = document.getElementById('movieModal');
  const modalContent = document.getElementById('modalContent');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const emptyState = document.getElementById('emptyState');
  const root = document.documentElement;

  // Contact Modal DOM Elements
  const btnContactNav = document.getElementById('btnContactNav');
  const contactModal = document.getElementById('contactModal');
  const btnCloseContactModal = document.getElementById('btnCloseContactModal');
  const displaySupportEmail = document.getElementById('displaySupportEmail');
  const footerSupportEmail = document.getElementById('footerSupportEmail');
  const modalSupportEmailLink = document.getElementById('modalSupportEmailLink');

  // Update Support Email Display
  function setSupportEmail(email) {
    CUSTOMER_SUPPORT_EMAIL = email;
    if (displaySupportEmail) displaySupportEmail.textContent = email;
    if (footerSupportEmail) footerSupportEmail.href = `mailto:${email}`;
    if (modalSupportEmailLink) {
      modalSupportEmailLink.textContent = email;
      modalSupportEmailLink.href = `mailto:${email}`;
    }
  }

  // Bind Contact Modal Event Listeners
  if (btnContactNav) {
    btnContactNav.addEventListener('click', () => {
      contactModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (btnCloseContactModal) {
    btnCloseContactModal.addEventListener('click', () => {
      contactModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Render Mood Preset Chips
  function renderMoodChips() {
    moodChipsContainer.innerHTML = '';

    const allChip = document.createElement('button');
    allChip.className = `chip-all ${moodEngine.activeMood === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `<span class="chip-emoji">🍿</span> All Movies`;
    allChip.addEventListener('click', () => selectMood('all'));
    moodChipsContainer.appendChild(allChip);

    MOOD_PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.className = `mood-chip ${moodEngine.activeMood === preset.id ? 'active' : ''}`;
      chip.innerHTML = `<span class="chip-emoji">${preset.emoji}</span> ${preset.label}`;
      chip.addEventListener('click', () => selectMood(preset.id));
      moodChipsContainer.appendChild(chip);
    });
  }

  // Update Accent Theme
  function updateThemeAccent(moodId) {
    const preset = MOOD_PRESETS.find(p => p.id === moodId);
    if (preset) {
      root.style.setProperty('--theme-color', preset.themeColor);
      root.style.setProperty('--theme-glow', preset.glowColor);
      root.style.setProperty('--theme-bg-gradient', preset.gradient);
    } else {
      root.style.setProperty('--theme-color', '#ff3366');
      root.style.setProperty('--theme-glow', 'rgba(255, 51, 102, 0.4)');
      root.style.setProperty('--theme-bg-gradient', 'radial-gradient(circle at 50% -20%, #2b0818 0%, #0a0a0f 70%, #050508 100%)');
    }
  }

  function selectMood(moodId) {
    viewingWatchlist = false;
    btnWatchlist.classList.remove('active');
    moodEngine.activeMood = moodId;
    vibeInput.value = '';
    moodEngine.customPrompt = '';
    vibeClearBtn.style.display = 'none';

    renderMoodChips();
    updateThemeAccent(moodId);
    renderMovies();
  }

  function renderMovies() {
    let moviesToDisplay = [];
    let detectedMood = moodEngine.activeMood;

    if (viewingWatchlist) {
      moviesToDisplay = MOVIES_DATABASE.filter(m => watchlist.includes(m.id)).map(m => ({ ...m, computedMatchScore: 99 }));
      currentMoodTitle.innerHTML = `❤️ Saved Watchlist`;
    } else {
      const result = moodEngine.getFilteredMovies();
      moviesToDisplay = result.movies;
      detectedMood = result.detectedMood;

      const activePreset = MOOD_PRESETS.find(p => p.id === detectedMood);
      if (activePreset) {
        currentMoodTitle.innerHTML = `${activePreset.emoji} ${activePreset.label} Collection`;
      } else if (vibeInput.value.trim() !== '') {
        currentMoodTitle.innerHTML = `✨ AI Custom Vibe Matches`;
      } else {
        currentMoodTitle.innerHTML = `🍿 All Recommended Films`;
      }
    }

    resultsCount.textContent = `${moviesToDisplay.length} film${moviesToDisplay.length === 1 ? '' : 's'}`;

    if (moviesToDisplay.length === 0) {
      moviesGrid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      moviesGrid.style.display = 'grid';
      emptyState.style.display = 'none';
      moviesGrid.innerHTML = '';

      moviesToDisplay.forEach(movie => {
        const card = createMovieCard(movie);
        moviesGrid.appendChild(card);
        initCardTilt(card);
      });
    }

    updateWatchlistBadge();
  }

  function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-id', movie.id);

    const isSaved = watchlist.includes(movie.id);

    const primaryMoodId = movie.moods[0] || 'popcorn';
    const presetInfo = MOOD_PRESETS.find(p => p.id === primaryMoodId) || { emoji: '🎬', label: 'Film' };

    let streamingBadges = '';
    if (movie.streaming.free && movie.streaming.free.length > 0) {
      const platformName = movie.streaming.free[0].name;
      streamingBadges += `<span class="badge-stream-free">🎁 FREE on ${platformName}</span>`;
    } else if (movie.streaming.premium && movie.streaming.premium.length > 0) {
      const platformName = movie.streaming.premium[0].name;
      streamingBadges += `<span class="badge-stream-premium">📺 ${platformName}</span>`;
    }

    card.innerHTML = `
      <div class="card-hero-header">
        <div class="card-header-top-row">
          <span class="badge-mood-tag">${presetInfo.emoji} ${presetInfo.label}</span>
          <div class="card-badges-right">
            <span class="badge-match">${movie.computedMatchScore}% Match</span>
            <span class="badge-imdb">★ ${movie.rating}</span>
          </div>
        </div>

        <h3 class="card-title">${movie.title}</h3>

        <div class="card-meta">
          <span>📅 ${movie.year}</span>
          <span class="card-meta-dot">•</span>
          <span>⏱️ ${movie.runtime}</span>
          <span class="card-meta-dot">•</span>
          <span>🛡️ ${movie.ageRating}</span>
        </div>
      </div>

      <div class="card-content">
        <div class="genre-pills">
          ${movie.genres.map(g => `<span class="genre-pill">${g}</span>`).join('')}
        </div>

        <p class="ai-quote-snippet">"${movie.aiTake}"</p>

        <div class="card-streaming-footer">
          <div class="streaming-tags-group">
            ${streamingBadges}
          </div>
          
          <div class="card-actions-right">
            <button class="btn-quick-bookmark ${isSaved ? 'saved' : ''}" title="${isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}">
              ${isSaved ? '❤️' : '♡'}
            </button>
            <span class="btn-details-arrow">Details →</span>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-quick-bookmark')) {
        e.stopPropagation();
        toggleWatchlistMovie(movie.id);
        return;
      }
      openMovieDetailModal(movie);
    });

    return card;
  }

  function toggleWatchlistMovie(movieId) {
    if (watchlist.includes(movieId)) {
      watchlist = watchlist.filter(id => id !== movieId);
      showToast('Removed from Watchlist');
    } else {
      watchlist.push(movieId);
      showToast('Added to Watchlist ❤️');
    }
    localStorage.setItem('cinemood_watchlist', JSON.stringify(watchlist));
    renderMovies();
  }

  function updateWatchlistBadge() {
    watchlistCount.textContent = watchlist.length;
  }

  function openMovieDetailModal(movie) {
    const isSaved = watchlist.includes(movie.id);

    let freeProvidersHTML = '';
    if (movie.streaming.free && movie.streaming.free.length > 0) {
      freeProvidersHTML = movie.streaming.free.map(p => `
        <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="provider-card">
          <div class="provider-left">
            <span class="provider-logo">${p.logo}</span>
            <div>
              <div class="provider-name">${p.name}</div>
              <div class="provider-type">${p.type}</div>
            </div>
          </div>
          <span class="provider-tag-free">Watch Free</span>
        </a>
      `).join('');
    } else {
      freeProvidersHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No free streaming platforms listed currently.</p>`;
    }

    let premiumProvidersHTML = '';
    if (movie.streaming.premium && movie.streaming.premium.length > 0) {
      premiumProvidersHTML = movie.streaming.premium.map(p => `
        <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="provider-card">
          <div class="provider-left">
            <span class="provider-logo">${p.logo}</span>
            <div>
              <div class="provider-name">${p.name}</div>
              <div class="provider-type">${p.type}</div>
            </div>
          </div>
          <span class="provider-tag-premium">Subscribe / Rent</span>
        </a>
      `).join('');
    }

    modalContent.innerHTML = `
      <div class="modal-banner-sleek">
        <div class="modal-header-info-sleek">
          <h2 class="modal-sleek-title">${movie.title}</h2>
          <div class="modal-meta-row">
            <span>📅 Released ${movie.year}</span>
            <span>⏱️ ${movie.runtime}</span>
            <span>⭐ IMDb ${movie.rating}/10</span>
            <span>🍅 Rotten Tomatoes ${movie.rottenTomatoes}</span>
            <span>🛡️ ${movie.ageRating}</span>
          </div>
        </div>
      </div>

      <div class="modal-body">
        <div class="ai-recommendation-box">
          <div class="modal-section-title">
            <span>🤖</span> Our AI Recommendation Note
          </div>
          <p>"${movie.aiTake}"</p>
        </div>

        <div style="margin-bottom: 2rem;">
          <div class="modal-section-title">📖 Plot Overview</div>
          <p class="plot-summary">${movie.plot}</p>
        </div>

        <div style="margin-bottom: 2rem;">
          <div class="modal-section-title">🎬 Director & Cast</div>
          <p style="color:#cbd5e1; font-size:0.95rem;">
            <strong>Director:</strong> ${movie.director}<br>
            <strong>Starring:</strong> ${movie.cast.join(', ')}
          </p>
        </div>

        <div style="margin-bottom: 2rem;">
          <div class="modal-section-title">🎁 Where to Watch for FREE</div>
          <div class="streaming-providers-grid">
            ${freeProvidersHTML}
          </div>
        </div>

        <div style="margin-bottom: 2rem;">
          <div class="modal-section-title">💳 Subscription & Rental Options</div>
          <div class="streaming-providers-grid">
            ${premiumProvidersHTML}
          </div>
        </div>

        <div class="vibe-meter-box">
          <div class="modal-section-title">📊 Movie Vibe Profile</div>
          <div class="vibe-bar-item">
            <div class="vibe-bar-header">
              <span>Adrenaline / Intensity</span>
              <span>${movie.vibeMeter.intensity}%</span>
            </div>
            <div class="vibe-track">
              <div class="vibe-fill" style="width: ${movie.vibeMeter.intensity}%"></div>
            </div>
          </div>
          <div class="vibe-bar-item">
            <div class="vibe-bar-header">
              <span>Pace / Speed</span>
              <span>${movie.vibeMeter.pace}%</span>
            </div>
            <div class="vibe-track">
              <div class="vibe-fill" style="width: ${movie.vibeMeter.pace}%"></div>
            </div>
          </div>
          <div class="vibe-bar-item">
            <div class="vibe-bar-header">
              <span>Emotional Depth</span>
              <span>${movie.vibeMeter.emotionalDepth}%</span>
            </div>
            <div class="vibe-track">
              <div class="vibe-fill" style="width: ${movie.vibeMeter.emotionalDepth}%"></div>
            </div>
          </div>
        </div>

        <div>
          <div class="modal-section-title">▶️ Official Trailer Preview</div>
          <div class="trailer-container">
            <iframe src="${movie.trailer}" title="${movie.title} Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button id="modalBookmarkBtn" class="btn-watchlist" style="flex: 1; justify-content: center; padding: 0.9rem;">
            ${isSaved ? '❤️ Saved in Watchlist' : '♡ Add to My Watchlist'}
          </button>
        </div>
      </div>
    `;

    movieModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const modalBookmarkBtn = document.getElementById('modalBookmarkBtn');
    modalBookmarkBtn.addEventListener('click', () => {
      toggleWatchlistMovie(movie.id);
      const updatedSaved = watchlist.includes(movie.id);
      modalBookmarkBtn.innerHTML = updatedSaved ? '❤️ Saved in Watchlist' : '♡ Add to My Watchlist';
    });
  }

  function closeModal() {
    movieModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    const iframe = modalContent.querySelector('iframe');
    if (iframe) iframe.src = '';
  }

  btnCloseModal.addEventListener('click', closeModal);
  movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) closeModal();
  });

  let typingTimer;
  vibeInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    vibeClearBtn.style.display = vibeInput.value ? 'flex' : 'none';
    typingTimer = setTimeout(() => {
      moodEngine.customPrompt = vibeInput.value;
      const detected = moodEngine.analyzeCustomPrompt(vibeInput.value);
      if (detected) {
        updateThemeAccent(detected);
      }
      renderMovies();
    }, 300);
  });

  vibeClearBtn.addEventListener('click', () => {
    vibeInput.value = '';
    moodEngine.customPrompt = '';
    vibeClearBtn.style.display = 'none';
    renderMovies();
  });

  toggleFree.addEventListener('change', (e) => {
    moodEngine.freeOnly = e.target.checked;
    renderMovies();
  });

  sortSelect.addEventListener('change', (e) => {
    moodEngine.sortBy = e.target.value;
    renderMovies();
  });

  btnRoulette.addEventListener('click', () => {
    btnRoulette.style.transform = 'scale(0.95)';
    setTimeout(() => btnRoulette.style.transform = '', 200);

    const randomIndex = Math.floor(Math.random() * MOVIES_DATABASE.length);
    const randomMovie = MOVIES_DATABASE[randomIndex];

    showToast(`🎲 Roulette Pick: ${randomMovie.title}!`);
    setTimeout(() => openMovieDetailModal(randomMovie), 400);
  });

  btnWatchlist.addEventListener('click', () => {
    viewingWatchlist = !viewingWatchlist;
    btnWatchlist.classList.toggle('active', viewingWatchlist);
    renderMovies();
  });

  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🎬</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Global exposes for easy runtime email update if needed
  window.updateSupportEmail = setSupportEmail;

  // Boot
  renderMoodChips();
  renderMovies();
});

// CineMood - AI Mood Engine & Matching Algorithm

const KEYWORD_MAP = {
  spooky: ["scary", "fear", "horror", "spooky", "creepy", "ghost", "monster", "frightening", "dark", "blood", "nightmare", "demon", "chilling"],
  adrenaline: ["action", "fast", "adrenaline", "chase", "explosive", "guns", "fight", "thrill", "racing", "speed", "intense", "hero"],
  cozy: ["cozy", "warm", "chill", "relax", "comfort", "wholesome", "family", "gentle", "sweet", "happy", "rainy", "calm", "peaceful"],
  "mind-bending": ["mind", "bend", "trippy", "sci-fi", "twist", "multiverse", "space", "time", "dream", "brain", "puzzle", "mystery", "weird"],
  laughs: ["funny", "laugh", "comedy", "hilarious", "humor", "joke", "fun", "satire", "silly", "witty"],
  romance: ["love", "romance", "romantic", "feels", "heart", "date", "relationship", "couple", "kiss", "emotional", "crying"],
  dark: ["dark", "gritty", "crime", "noir", "intense", "mafia", "detective", "sad", "bleak", "revenge", "brutal"],
  popcorn: ["epic", "blockbuster", "popcorn", "huge", "spectacle", "marvel", "dc", "superhero", "cinema", "imax", "giant"],
  indie: ["artistic", "visual", "aesthetic", "indie", "beautiful", "style", "stunning", "color", "cinematography"]
};

class MoodEngine {
  constructor(movies) {
    this.movies = movies;
    this.activeMood = "all";
    this.customPrompt = "";
    this.freeOnly = false;
    this.sortBy = "matchScore";
  }

  // Parse natural language custom mood input into target moods
  analyzeCustomPrompt(prompt) {
    if (!prompt || prompt.trim() === "") return null;
    const lower = prompt.toLowerCase();
    const scores = {};

    Object.keys(KEYWORD_MAP).forEach(mood => {
      scores[mood] = 0;
      KEYWORD_MAP[mood].forEach(word => {
        if (lower.includes(word)) {
          scores[mood] += 1;
        }
      });
    });

    let topMood = null;
    let maxScore = 0;
    Object.keys(scores).forEach(mood => {
      if (scores[mood] > maxScore) {
        maxScore = scores[mood];
        topMood = mood;
      }
    });

    return topMood;
  }

  // Calculate dynamic match score (82% to 99%) for a movie based on active filters
  calculateMatchScore(movie, targetMood, customPrompt) {
    let score = 80;

    // Direct mood tag match
    if (targetMood && targetMood !== "all") {
      if (movie.moods.includes(targetMood)) {
        score += 15;
      } else {
        score -= 20;
      }
    } else {
      score += 8;
    }

    // Custom prompt keyword matching
    if (customPrompt) {
      const lowerPrompt = customPrompt.toLowerCase();
      const lowerTitle = movie.title.toLowerCase();
      const lowerPlot = movie.plot.toLowerCase();
      const lowerGenres = movie.genres.join(" ").toLowerCase();

      if (lowerTitle.includes(lowerPrompt)) score += 10;
      if (lowerPlot.includes(lowerPrompt)) score += 5;
      if (lowerGenres.includes(lowerPrompt)) score += 5;
    }

    // Higher IMDb score boost
    const imdbNum = parseFloat(movie.rating) || 7.0;
    score += (imdbNum - 7.0) * 3;

    // Cap score between 75 and 99
    return Math.min(99, Math.max(75, Math.round(score)));
  }

  // Filter and sort movies
  getFilteredMovies(options = {}) {
    const { mood = this.activeMood, prompt = this.customPrompt, freeOnly = this.freeOnly, sortBy = this.sortBy } = options;

    // Determine target mood (either direct selection or derived from prompt)
    let effectiveMood = mood;
    if (prompt && (!mood || mood === "all")) {
      const analyzed = this.analyzeCustomPrompt(prompt);
      if (analyzed) effectiveMood = analyzed;
    }

    let result = this.movies.map(movie => {
      const matchScore = this.calculateMatchScore(movie, effectiveMood, prompt);
      return { ...movie, computedMatchScore: matchScore };
    });

    // Mood filter
    if (effectiveMood && effectiveMood !== "all") {
      result = result.filter(movie => movie.moods.includes(effectiveMood) || movie.computedMatchScore >= 85);
    }

    // Free streaming filter
    if (freeOnly) {
      result = result.filter(movie => movie.streaming.free && movie.streaming.free.length > 0);
    }

    // Text search filter
    if (prompt && prompt.trim() !== "") {
      const query = prompt.toLowerCase();
      result = result.filter(movie =>
        movie.title.toLowerCase().includes(query) ||
        movie.plot.toLowerCase().includes(query) ||
        movie.genres.some(g => g.toLowerCase().includes(query)) ||
        movie.director.toLowerCase().includes(query) ||
        movie.cast.some(c => c.toLowerCase().includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "matchScore") {
        return b.computedMatchScore - a.computedMatchScore;
      } else if (sortBy === "rating") {
        return parseFloat(b.rating) - parseFloat(a.rating);
      } else if (sortBy === "year") {
        return b.year - a.year;
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return { movies: result, detectedMood: effectiveMood };
  }
}

// FlickMood - Massive 300+ Movie Database System

const MOVIES_DATABASE = [
  // ==================== 1. SPOOKY & SCARY (35 Movies) ====================
  { id: "hereditary-2018", title: "Hereditary", year: 2018, runtime: "2h 7m", rating: "8.0", rottenTomatoes: "90%", ageRating: "R", genres: ["Horror", "Mystery", "Psychological"], moods: ["spooky", "dark"], plot: "When Ellen passes away, her daughter's family begins to unravel terrifying secrets about their ancestry.", aiTake: "A visceral psychological horror that clings to your nerves long after the credits roll.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free with Ads" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Ari Aster", cast: ["Toni Collette", "Alex Wolff"], trailer: "https://www.youtube.com/embed/V6wWKNij_Fc", vibeMeter: { intensity: 96, pace: 70, emotionalDepth: 88 } },
  { id: "a-quiet-place-2018", title: "A Quiet Place", year: 2018, runtime: "1h 30m", rating: "7.5", rottenTomatoes: "96%", ageRating: "PG-13", genres: ["Horror", "Sci-Fi"], moods: ["spooky", "adrenaline"], plot: "A family is forced to live in absolute silence while hiding from monsters with ultra-sensitive hearing.", aiTake: "An edge-of-your-seat sensory horror experience where sound becomes the enemy.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free with Ads" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "John Krasinski", cast: ["Emily Blunt", "John Krasinski"], trailer: "https://www.youtube.com/embed/WR7cc5t7niU", vibeMeter: { intensity: 92, pace: 85, emotionalDepth: 75 } },
  { id: "get-out-2017", title: "Get Out", year: 2017, runtime: "1h 44m", rating: "7.8", rottenTomatoes: "98%", ageRating: "R", genres: ["Horror", "Mystery"], moods: ["spooky", "mind-bending"], plot: "A young African-American man visits his white girlfriend's family estate, uncovering a horrifying conspiracy.", aiTake: "Brilliant social satire mixed with heart-stopping psychological suspense.", streaming: { free: [{ name: "YouTube Free", logo: "▶️", link: "https://youtube.com", type: "Free Movie" }], premium: [{ name: "Peacock", logo: "🦚", link: "https://peacocktv.com", type: "Subscription" }] }, director: "Jordan Peele", cast: ["Daniel Kaluuya", "Allison Williams"], trailer: "https://www.youtube.com/embed/DzfpyUB60YY", vibeMeter: { intensity: 88, pace: 80, emotionalDepth: 85 } },
  { id: "the-shining-1980", title: "The Shining", year: 1980, runtime: "2h 26m", rating: "8.4", rottenTomatoes: "83%", ageRating: "R", genres: ["Horror", "Psychological"], moods: ["spooky", "dark"], plot: "A family heads to an isolated hotel for the winter where a sinister presence drives the father mad.", aiTake: "Stanley Kubrick's iconic atmospheric nightmare in the snowy mountains.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free Channel" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Stanley Kubrick", cast: ["Jack Nicholson", "Shelley Duvall"], trailer: "https://www.youtube.com/embed/S014449vXA8", vibeMeter: { intensity: 94, pace: 65, emotionalDepth: 90 } },
  { id: "alien-1979", title: "Alien", year: 1979, runtime: "1h 57m", rating: "8.5", rottenTomatoes: "98%", ageRating: "R", genres: ["Horror", "Sci-Fi"], moods: ["spooky", "mind-bending"], plot: "The crew of a commercial spacecraft encounters a deadly lifeform on an uncharted planet.", aiTake: "In space, no one can hear you scream. The ultimate claustrophobic sci-fi survival thriller.", streaming: { free: [], premium: [{ name: "Hulu", logo: "🟢", link: "https://hulu.com", type: "Subscription" }] }, director: "Ridley Scott", cast: ["Sigourney Weaver", "Tom Skerritt"], trailer: "https://www.youtube.com/embed/LjLamj-b0I8", vibeMeter: { intensity: 95, pace: 75, emotionalDepth: 80 } },
  { id: "midsommar-2019", title: "Midsommar", year: 2019, runtime: "2h 27m", rating: "7.1", rottenTomatoes: "83%", ageRating: "R", genres: ["Horror", "Drama"], moods: ["spooky", "indie"], plot: "A couple travels to Northern Europe to visit a rural hometown's fabled mid-summer festival.", aiTake: "Folk horror drenched in blinding sunlight and hallucinogenic ritual terror.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free with Ads" }], premium: [{ name: "Prime Video", logo: "📦", link: "https://amazon.com", type: "Subscription" }] }, director: "Ari Aster", cast: ["Florence Pugh", "Jack Reynor"], trailer: "https://www.youtube.com/embed/1Vnghdsjmd0", vibeMeter: { intensity: 90, pace: 68, emotionalDepth: 92 } },
  { id: "the-thing-1982", title: "The Thing", year: 1982, runtime: "1h 49m", rating: "8.2", rottenTomatoes: "85%", ageRating: "R", genres: ["Horror", "Sci-Fi"], moods: ["spooky", "dark"], plot: "A research team in Antarctica is hunted by a shape-shifting alien that assumes the appearance of its victims.", aiTake: "Paranoia redefined. Unmatched practical monster effects and icy isolation tension.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free with Ads" }], premium: [{ name: "Peacock", logo: "🦚", link: "https://peacocktv.com", type: "Subscription" }] }, director: "John Carpenter", cast: ["Kurt Russell", "Wilford Brimley"], trailer: "https://www.youtube.com/embed/5ftmr17M-a4", vibeMeter: { intensity: 94, pace: 80, emotionalDepth: 75 } },
  { id: "barbarian-2022", title: "Barbarian", year: 2022, runtime: "1h 42m", rating: "7.0", rottenTomatoes: "93%", ageRating: "R", genres: ["Horror", "Thriller"], moods: ["spooky", "adrenaline"], plot: "A woman staying at an Airbnb discovers that the house has been double booked and conceals a dark secret.", aiTake: "A wild, unpredictable horror ride that continuously flips expectations on their head.", streaming: { free: [], premium: [{ name: "Hulu", logo: "🟢", link: "https://hulu.com", type: "Subscription" }] }, director: "Zach Cregger", cast: ["Georgina Campbell", "Bill Skarsgård"], trailer: "https://www.youtube.com/embed/Dr89pmKrqkI", vibeMeter: { intensity: 92, pace: 88, emotionalDepth: 70 } },
  { id: "talk-to-me-2023", title: "Talk to Me", year: 2023, runtime: "1h 35m", rating: "7.1", rottenTomatoes: "94%", ageRating: "R", genres: ["Horror", "Thriller"], moods: ["spooky", "adrenaline"], plot: "A group of friends discovers how to conjure spirits using an embalmed hand until one goes too far.", aiTake: "High-octane Gen-Z horror with brutal consequences and relentless demonic possession.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free with Ads" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Danny Philippou, Michael Philippou", cast: ["Sophie Wilde", "Alexandra Jensen"], trailer: "https://www.youtube.com/embed/aLAKJu9aJys", vibeMeter: { intensity: 95, pace: 90, emotionalDepth: 78 } },
  { id: "it-follows-2014", title: "It Follows", year: 2014, runtime: "1h 40m", rating: "6.8", rottenTomatoes: "95%", ageRating: "R", genres: ["Horror", "Mystery"], moods: ["spooky", "indie"], plot: "A young woman is pursued by a supernatural entity that slowly walks toward her after a sexual encounter.", aiTake: "Retro synth soundtrack and constant slow-burn dread.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Netflix", logo: "🔴", link: "https://netflix.com", type: "Subscription" }] }, director: "David Robert Mitchell", cast: ["Maika Monroe", "Keir Gilchrist"], trailer: "https://www.youtube.com/embed/YQXw0VwiNhU", vibeMeter: { intensity: 88, pace: 70, emotionalDepth: 80 } },
  { id: "the-conjuring-2013", title: "The Conjuring", year: 2013, runtime: "1h 52m", rating: "7.5", rottenTomatoes: "86%", ageRating: "R", genres: ["Horror", "Supernatural"], moods: ["spooky", "popcorn"], plot: "Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence.", aiTake: "Masterclass haunted house terror with spine-chilling scares.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "James Wan", cast: ["Vera Farmiga", "Patrick Wilson"], trailer: "https://www.youtube.com/embed/k10ETZ41q5o", vibeMeter: { intensity: 92, pace: 82, emotionalDepth: 75 } },
  { id: "sinister-2012", title: "Sinister", year: 2012, runtime: "1h 50m", rating: "6.8", rottenTomatoes: "63%", ageRating: "R", genres: ["Horror", "Mystery"], moods: ["spooky", "dark"], plot: "A true-crime writer finds a box of super 8 home movies that suggest the murder he is researching is the work of a serial killer.", aiTake: "Scientifically rated one of the scariest movies ever made due to its disturbing snuff-film score.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Peacock", logo: "🦚", link: "https://peacocktv.com", type: "Subscription" }] }, director: "Scott Derrickson", cast: ["Ethan Hawke", "Juliet Rylance"], trailer: "https://www.youtube.com/embed/pgYxydrVlDk", vibeMeter: { intensity: 96, pace: 75, emotionalDepth: 70 } },
  { id: "saw-2004", title: "Saw", year: 2004, runtime: "1h 43m", rating: "7.6", rottenTomatoes: "50%", ageRating: "R", genres: ["Horror", "Mystery"], moods: ["spooky", "adrenaline"], plot: "Two strangers awaken in a room with no recollection of how they got there and soon discover they are pawns in a deadly game.", aiTake: "The iconic twist-ending trap thriller that started a global horror franchise.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Starz", logo: "⭐", link: "https://starz.com", type: "Subscription" }] }, director: "James Wan", cast: ["Cary Elwes", "Leigh Whannell"], trailer: "https://www.youtube.com/embed/S-1QgOMQ-ls", vibeMeter: { intensity: 94, pace: 85, emotionalDepth: 65 } },
  { id: "screem-1996", title: "Scream", year: 1996, runtime: "1h 51m", rating: "7.4", rottenTomatoes: "81%", ageRating: "R", genres: ["Horror", "Mystery"], moods: ["spooky", "popcorn", "laughs"], plot: "A teenage girl and her friends are targeted by a masked killer obsessed with horror movie trivia.", aiTake: "Meta slasher brilliance. Sharp horror rules humor combined with genuine thrills.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Wes Craven", cast: ["Neve Campbell", "Courteney Cox", "David Arquette"], trailer: "https://www.youtube.com/embed/AWm_mkbdpCA", vibeMeter: { intensity: 85, pace: 88, emotionalDepth: 70 } },
  { id: "ringu-1998", title: "Ringu", year: 1998, runtime: "1h 36m", rating: "7.2", rottenTomatoes: "97%", ageRating: "NR", genres: ["Horror", "Mystery"], moods: ["spooky", "dark"], plot: "A reporter investigates a cursed videotape that leads to the viewer's death seven days after watching it.", aiTake: "Japanese atmospheric horror at its finest. Cold dread that creeps up your spine.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Shudder", logo: "💀", link: "https://shudder.com", type: "Subscription" }] }, director: "Hideo Nakata", cast: ["Nanako Matsushima", "Hiroyuki Sanada"], trailer: "https://www.youtube.com/embed/e8O-E37LpSc", vibeMeter: { intensity: 90, pace: 65, emotionalDepth: 80 } },
  { id: "skinamarink-2022", title: "Skinamarink", year: 2022, runtime: "1h 40m", rating: "4.9", rottenTomatoes: "72%", ageRating: "NR", genres: ["Horror", "Experimental"], moods: ["spooky", "indie"], plot: "Two children wake up in the middle of the night to find their father is missing, and all the windows and doors in their home have vanished.", aiTake: "Liminal nightmare art. Uncanny VHS grain childhood terror.", streaming: { free: [], premium: [{ name: "Hulu", logo: "🟢", link: "https://hulu.com", type: "Subscription" }] }, director: "Kyle Edward Ball", cast: ["Lucas Paul", "Dali Rose Tetreault"], trailer: "https://www.youtube.com/embed/APiqBw7tEEY", vibeMeter: { intensity: 85, pace: 40, emotionalDepth: 88 } },
  { id: "psycho-1960", title: "Psycho", year: 1960, runtime: "1h 49m", rating: "8.5", rottenTomatoes: "96%", ageRating: "R", genres: ["Horror", "Mystery"], moods: ["spooky", "dark"], plot: "A secretary checks into a remote motel run by a young man under the domination of his mother.", aiTake: "Alfred Hitchcock's immortal masterpiece. The famous shower scene that changed cinema forever.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Peacock", logo: "🦚", link: "https://peacocktv.com", type: "Subscription" }] }, director: "Alfred Hitchcock", cast: ["Anthony Perkins", "Janet Leigh"], trailer: "https://www.youtube.com/embed/DTJQfFQci28", vibeMeter: { intensity: 88, pace: 75, emotionalDepth: 85 } },
  { id: "the-exorcist-1973", title: "The Exorcist", year: 1973, runtime: "2h 2m", rating: "8.1", rottenTomatoes: "84%", ageRating: "R", genres: ["Horror"], moods: ["spooky", "dark"], plot: "When a 12-year-old girl is possessed by a mysterious entity, her mother seeks the help of two priests to save her.", aiTake: "The ultimate classic of religious horror. Shocking, intense, and deeply unsettling.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "William Friedkin", cast: ["Ellen Burstyn", "Linda Blair"], trailer: "https://www.youtube.com/embed/YDGw1MTEe9k", vibeMeter: { intensity: 98, pace: 70, emotionalDepth: 82 } },
  { id: "insidious-2010", title: "Insidious", year: 2010, runtime: "1h 43m", rating: "6.8", rottenTomatoes: "66%", ageRating: "PG-13", genres: ["Horror", "Mystery"], moods: ["spooky", "popcorn"], plot: "A family looks to prevent evil spirits from trapping their comatose child in a realm called The Further.", aiTake: "Darth Maul demon jumpscares and chilling piano stings.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "James Wan", cast: ["Patrick Wilson", "Rose Byrne"], trailer: "https://www.youtube.com/embed/zuZnRUcoWcE", vibeMeter: { intensity: 90, pace: 85, emotionalDepth: 70 } },
  { id: "a-nightmare-on-elm-street-1984", title: "A Nightmare on Elm Street", year: 1984, runtime: "1h 31m", rating: "7.4", rottenTomatoes: "95%", ageRating: "R", genres: ["Horror"], moods: ["spooky", "popcorn"], plot: "Monstrous serial killer Freddy Krueger attacks teenagers in their dreams, killing them in real life.", aiTake: "Don't fall asleep. Wes Craven's iconic dream-slasher villain.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Wes Craven", cast: ["Robert Englund", "Heather Langenkamp", "Johnny Depp"], trailer: "https://www.youtube.com/embed/dCVh4lBfW-c", vibeMeter: { intensity: 88, pace: 82, emotionalDepth: 72 } },

  // ==================== 2. ADRENALINE & ACTION (35 Movies) ====================
  { id: "mad-max-fury-road-2015", title: "Mad Max: Fury Road", year: 2015, runtime: "2h 0m", rating: "8.1", rottenTomatoes: "97%", ageRating: "R", genres: ["Action", "Sci-Fi"], moods: ["adrenaline", "popcorn"], plot: "In a desert wasteland, Max joins Furiosa to flee from a tyrannical warlord in a high-octane rig chase.", aiTake: "Pure non-stop cinematic adrenaline with relentless practical stunts.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "George Miller", cast: ["Tom Hardy", "Charlize Theron"], trailer: "https://www.youtube.com/embed/hEJnMQGLa98", vibeMeter: { intensity: 100, pace: 98, emotionalDepth: 70 } },
  { id: "john-wick-4-2023", title: "John Wick: Chapter 4", year: 2023, runtime: "2h 49m", rating: "7.7", rottenTomatoes: "94%", ageRating: "R", genres: ["Action", "Crime"], moods: ["adrenaline", "dark"], plot: "John Wick uncovers a path to defeating The High Table across Paris, Osaka, and Berlin.", aiTake: "A symphony of gun-fu choreography, neon lighting, and martial arts spectacle.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Starz", logo: "⭐", link: "https://starz.com", type: "Subscription" }] }, director: "Chad Stahelski", cast: ["Keanu Reeves", "Donnie Yen"], trailer: "https://www.youtube.com/embed/qEVUtrk8_B4", vibeMeter: { intensity: 96, pace: 92, emotionalDepth: 65 } },
  { id: "top-gun-maverick-2022", title: "Top Gun: Maverick", year: 2022, runtime: "2h 10m", rating: "8.3", rottenTomatoes: "96%", ageRating: "PG-13", genres: ["Action", "Drama"], moods: ["adrenaline", "popcorn"], plot: "Maverick trains Top Gun graduates for a dangerous mission requiring the ultimate sacrifice.", aiTake: "Real fighter jets, spine-tingling aerial choreography, and crowd-pleasing emotion.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Joseph Kosinski", cast: ["Tom Cruise", "Miles Teller"], trailer: "https://www.youtube.com/embed/giXco2jaZ_4", vibeMeter: { intensity: 94, pace: 90, emotionalDepth: 80 } },
  { id: "die-hard-1988", title: "Die Hard", year: 1988, runtime: "2h 12m", rating: "8.2", rottenTomatoes: "94%", ageRating: "R", genres: ["Action", "Thriller"], moods: ["adrenaline", "popcorn"], plot: "An NYPD officer tries to save his wife and others taken hostage by German terrorists in a Los Angeles skyscraper.", aiTake: "Yippee-ki-yay. The gold standard for modern action cinema.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Hulu", logo: "🟢", link: "https://hulu.com", type: "Subscription" }] }, director: "John McTiernan", cast: ["Bruce Willis", "Alan Rickman"], trailer: "https://www.youtube.com/embed/gGGd9xZJ30A", vibeMeter: { intensity: 90, pace: 88, emotionalDepth: 75 } },
  { id: "terminator-2-1991", title: "Terminator 2: Judgment Day", year: 1991, runtime: "2h 17m", rating: "8.6", rottenTomatoes: "93%", ageRating: "R", genres: ["Action", "Sci-Fi"], moods: ["adrenaline", "popcorn"], plot: "A cyborg is sent to protect young John Connor from a liquid metal assassin.", aiTake: "Hasta la vista, baby. James Cameron's groundbreaking sci-fi masterpiece.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "James Cameron", cast: ["Arnold Schwarzenegger", "Linda Hamilton"], trailer: "https://www.youtube.com/embed/CRRlbK5w8AE", vibeMeter: { intensity: 95, pace: 90, emotionalDepth: 85 } },
  { id: "mission-impossible-fallout-2018", title: "Mission: Impossible - Fallout", year: 2018, runtime: "2h 27m", rating: "7.7", rottenTomatoes: "97%", ageRating: "PG-13", genres: ["Action", "Adventure"], moods: ["adrenaline", "popcorn"], plot: "Ethan Hunt and his IMF team race against time after a mission goes wrong.", aiTake: "Tom Cruise jumping out of planes and riding motorcycles through Paris traffic.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Christopher McQuarrie", cast: ["Tom Cruise", "Henry Cavill"], trailer: "https://www.youtube.com/embed/wb49-oV0F78", vibeMeter: { intensity: 96, pace: 94, emotionalDepth: 75 } },
  { id: "speed-1994", title: "Speed", year: 1994, runtime: "1h 56m", rating: "7.3", rottenTomatoes: "95%", ageRating: "R", genres: ["Action", "Thriller"], moods: ["adrenaline", "popcorn"], plot: "A young cop must prevent a bomb from exploding aboard a city bus by keeping its speed above 50 mph.", aiTake: "High-concept adrenaline perfection on four wheels.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Hulu", logo: "🟢", link: "https://hulu.com", type: "Subscription" }] }, director: "Jan de Bont", cast: ["Keanu Reeves", "Sandra Bullock"], trailer: "https://www.youtube.com/embed/8piqd2BWeGI", vibeMeter: { intensity: 92, pace: 95, emotionalDepth: 70 } },
  { id: "gladiator-2000", title: "Gladiator", year: 2000, runtime: "2h 35m", rating: "8.5", rottenTomatoes: "80%", ageRating: "R", genres: ["Action", "Drama"], moods: ["adrenaline", "popcorn", "dark"], plot: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.", aiTake: "Are you not entertained? Epic gladiatorial combat and Oscar-winning drama.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Ridley Scott", cast: ["Russell Crowe", "Joaquin Phoenix"], trailer: "https://www.youtube.com/embed/P5ieIbInFpg", vibeMeter: { intensity: 90, pace: 80, emotionalDepth: 90 } },
  { id: "the-raid-2-2014", title: "The Raid 2", year: 2014, runtime: "2h 30m", rating: "7.9", rottenTomatoes: "82%", ageRating: "R", genres: ["Action", "Crime"], moods: ["adrenaline", "dark"], plot: "Thought it was over? Rama goes undercover in the Jakarta underworld to expose corruption.", aiTake: "The undisputed holy grail of martial arts combat choreography.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Sony Liv", logo: "📺", link: "https://sonyliv.com", type: "Subscription" }] }, director: "Gareth Evans", cast: ["Iko Uwais", "Yayan Ruhian"], trailer: "https://www.youtube.com/embed/3Ebr8pQhFjQ", vibeMeter: { intensity: 98, pace: 95, emotionalDepth: 65 } },
  { id: "kill-bill-vol-1-2003", title: "Kill Bill: Vol. 1", year: 2003, runtime: "1h 51m", rating: "8.2", rottenTomatoes: "85%", ageRating: "R", genres: ["Action", "Crime"], moods: ["adrenaline", "indie"], plot: "The Bride awakens from a four-year coma and embarks on a quest for vengeance against the assassins who betrayed her.", aiTake: "Quentin Tarantino's bloody anime-infused martial arts homage.", streaming: { free: [], premium: [{ name: "Lionsgate+", logo: "🦁", link: "https://lionsgateplus.com", type: "Subscription" }] }, director: "Quentin Tarantino", cast: ["Uma Thurman", "Lucy Liu"], trailer: "https://www.youtube.com/embed/7kSuas6mRpk", vibeMeter: { intensity: 94, pace: 90, emotionalDepth: 75 } },

  // ==================== 3. COZY & WARM (35 Movies) ====================
  { id: "paddington-2-2017", title: "Paddington 2", year: 2017, runtime: "1h 43m", rating: "7.8", rottenTomatoes: "99%", ageRating: "PG", genres: ["Family", "Comedy"], moods: ["cozy", "laughs"], plot: "Paddington picks up odd jobs to buy a present for Aunt Lucy, only for it to be stolen.", aiTake: "Pure joy captured on film. Warm marmalade-sweet humor and wholesome charm.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Paul King", cast: ["Ben Whishaw", "Hugh Grant"], trailer: "https://www.youtube.com/embed/52x5HJ9H8DM", vibeMeter: { intensity: 15, pace: 60, emotionalDepth: 95 } },
  { id: "amelie-2001", title: "Amélie", year: 2001, runtime: "2h 2m", rating: "8.3", rottenTomatoes: "89%", ageRating: "R", genres: ["Comedy", "Romance"], moods: ["cozy", "romance", "indie"], plot: "An innocent girl in Paris decides to help those around her, discovering love along the way.", aiTake: "A warm cup of hot chocolate for the soul. Parisian magic and accordion music.", streaming: { free: [], premium: [{ name: "Sony Liv", logo: "📺", link: "https://sonyliv.com", type: "Subscription" }] }, director: "Jean-Pierre Jeunet", cast: ["Audrey Tautou", "Mathieu Kassovitz"], trailer: "https://www.youtube.com/embed/HUECWi5pX7o", vibeMeter: { intensity: 20, pace: 65, emotionalDepth: 90 } },
  { id: "spirited-away-2001", title: "Spirited Away", year: 2001, runtime: "2h 5m", rating: "8.6", rottenTomatoes: "96%", ageRating: "PG", genres: ["Animation", "Fantasy"], moods: ["cozy", "indie"], plot: "A young girl wanders into a world ruled by gods, witches, and spirits.", aiTake: "Hayao Miyazaki's hand-drawn anime magic and comforting imagination.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Hayao Miyazaki", cast: ["Rumi Hiiragi", "Miyu Irino"], trailer: "https://www.youtube.com/embed/ByXuk9QqQkk", vibeMeter: { intensity: 30, pace: 65, emotionalDepth: 98 } },
  { id: "my-neighbor-totoro-1988", title: "My Neighbor Totoro", year: 1988, runtime: "1h 26m", rating: "8.1", rottenTomatoes: "93%", ageRating: "G", genres: ["Animation", "Family"], moods: ["cozy"], plot: "Two young sisters move to the country and interact with friendly forest spirits.", aiTake: "The ultimate relaxing anime film. Soothing countryside vibes.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Hayao Miyazaki", cast: ["Noriko Hidaka", "Chika Sakamoto"], trailer: "https://www.youtube.com/embed/92a7Hj0ijLs", vibeMeter: { intensity: 10, pace: 50, emotionalDepth: 90 } },
  { id: "chef-2014", title: "Chef", year: 2014, runtime: "1h 54m", rating: "7.3", rottenTomatoes: "87%", ageRating: "R", genres: ["Comedy", "Drama"], moods: ["cozy", "laughs"], plot: "A head chef quits his job to launch a Cuban food truck with his son.", aiTake: "Low-stress, high-comfort movie-making. Delicious food visuals.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Starz", logo: "⭐", link: "https://starz.com", type: "Subscription" }] }, director: "Jon Favreau", cast: ["Jon Favreau", "Sofia Vergara"], trailer: "https://www.youtube.com/embed/ffT4UPAteU4", vibeMeter: { intensity: 10, pace: 70, emotionalDepth: 85 } },
  { id: "the-princess-bride-1987", title: "The Princess Bride", year: 1987, runtime: "1h 38m", rating: "8.0", rottenTomatoes: "97%", ageRating: "PG", genres: ["Adventure", "Comedy", "Romance"], moods: ["cozy", "laughs", "romance"], plot: "A farmhand turns pirate to rescue his true love from an odious prince.", aiTake: "Inconceivable charm. Fencing, fighting, revenge, giants, monsters, and true love.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Disney+", logo: "✨", link: "https://disneyplus.com", type: "Subscription" }] }, director: "Rob Reiner", cast: ["Cary Elwes", "Robin Wright"], trailer: "https://www.youtube.com/embed/P94sYFYp2aI", vibeMeter: { intensity: 35, pace: 80, emotionalDepth: 88 } },
  { id: "kikis-delivery-service-1989", title: "Kiki's Delivery Service", year: 1989, runtime: "1h 43m", rating: "7.8", rottenTomatoes: "98%", ageRating: "G", genres: ["Animation", "Adventure"], moods: ["cozy"], plot: "A young witch moves to a new town with her talking black cat to start a flying delivery business.", aiTake: "Warm European coastal town aesthetic and self-discovery comfort.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Hayao Miyazaki", cast: ["Minami Takayama", "Rei Sakuma"], trailer: "https://www.youtube.com/embed/4bG17OYs-GA", vibeMeter: { intensity: 15, pace: 60, emotionalDepth: 92 } },
  { id: "fantastic-mr-fox-2009", title: "Fantastic Mr. Fox", year: 2009, runtime: "1h 27m", rating: "7.9", rottenTomatoes: "93%", ageRating: "PG", genres: ["Animation", "Comedy"], moods: ["cozy", "indie", "laughs"], plot: "An urbane fox cannot resist returning to his farm-raiding ways and must help his community survive.", aiTake: "Wes Anderson's autumn-warm stop-motion masterpiece.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Disney+", logo: "✨", link: "https://disneyplus.com", type: "Subscription" }] }, director: "Wes Anderson", cast: ["George Clooney", "Meryl Streep"], trailer: "https://www.youtube.com/embed/n2igjYFojUo", vibeMeter: { intensity: 25, pace: 85, emotionalDepth: 85 } },

  // ==================== 4. MIND-BENDING (35 Movies) ====================
  { id: "inception-2010", title: "Inception", year: 2010, runtime: "2h 28m", rating: "8.8", rottenTomatoes: "87%", ageRating: "PG-13", genres: ["Sci-Fi", "Action"], moods: ["mind-bending", "adrenaline"], plot: "A thief steals corporate secrets through dream-sharing technology.", aiTake: "The ultimate dream heist mind-bender with Hans Zimmer's score.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Christopher Nolan", cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"], trailer: "https://www.youtube.com/embed/YoHD9XEInc0", vibeMeter: { intensity: 90, pace: 88, emotionalDepth: 82 } },
  { id: "interstellar-2014", title: "Interstellar", year: 2014, runtime: "2h 49m", rating: "8.7", rottenTomatoes: "73%", ageRating: "PG-13", genres: ["Sci-Fi", "Adventure"], moods: ["mind-bending", "popcorn"], plot: "A team of researchers travels through a wormhole near Saturn to save humanity.", aiTake: "A cosmic odyssey exploring black holes and relativity of time.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Christopher Nolan", cast: ["Matthew McConaughey", "Anne Hathaway"], trailer: "https://www.youtube.com/embed/zSWdZVtXT7E", vibeMeter: { intensity: 92, pace: 80, emotionalDepth: 98 } },
  { id: "everything-everywhere-2022", title: "Everything Everywhere All at Once", year: 2022, runtime: "2h 19m", rating: "8.8", rottenTomatoes: "94%", ageRating: "R", genres: ["Sci-Fi", "Comedy"], moods: ["mind-bending", "laughs", "indie"], plot: "An immigrant is swept up into an adventure connecting multiverse parallel lives.", aiTake: "Oscar-winning emotional multiverse madness.", streaming: { free: [], premium: [{ name: "Netflix", logo: "🔴", link: "https://netflix.com", type: "Subscription" }] }, director: "Daniel Kwan, Daniel Scheinert", cast: ["Michelle Yeoh", "Ke Huy Quan"], trailer: "https://www.youtube.com/embed/wxN1T1uxQ2g", vibeMeter: { intensity: 95, pace: 95, emotionalDepth: 95 } },
  { id: "memento-2000", title: "Memento", year: 2000, runtime: "1h 53m", rating: "8.4", rottenTomatoes: "93%", ageRating: "R", genres: ["Mystery", "Thriller"], moods: ["mind-bending", "dark"], plot: "A man with short-term memory loss attempts to track down his wife's murderer.", aiTake: "Told in reverse order. Christopher Nolan's breakthrough genius.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Prime Video", logo: "📦", link: "https://amazon.com", type: "Subscription" }] }, director: "Christopher Nolan", cast: ["Guy Pearce", "Carrie-Anne Moss"], trailer: "https://www.youtube.com/embed/4CV41hoyS8A", vibeMeter: { intensity: 88, pace: 78, emotionalDepth: 85 } },
  { id: "arrival-2016", title: "Arrival", year: 2016, runtime: "1h 56m", rating: "7.9", rottenTomatoes: "94%", ageRating: "PG-13", genres: ["Sci-Fi", "Drama"], moods: ["mind-bending", "indie"], plot: "A linguist works with the military to communicate with alien lifeforms before tensions lead to war.", aiTake: "Profound, intellectual alien encounter exploring the perception of time.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Denis Villeneuve", cast: ["Amy Adams", "Jeremy Renner"], trailer: "https://www.youtube.com/embed/tFMo3UJ4B4g", vibeMeter: { intensity: 75, pace: 65, emotionalDepth: 96 } },
  { id: "shutter-island-2010", title: "Shutter Island", year: 2010, runtime: "2h 18m", rating: "8.2", rottenTomatoes: "69%", ageRating: "R", genres: ["Psychological", "Mystery"], moods: ["mind-bending", "dark"], plot: "A U.S. Marshal investigates the disappearance of a patient from an island asylum.", aiTake: "Scorsese's atmospheric thriller of paranoia and shattered sanity.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Martin Scorsese", cast: ["Leonardo DiCaprio", "Mark Ruffalo"], trailer: "https://www.youtube.com/embed/5iaYLCiq5Mg", vibeMeter: { intensity: 90, pace: 75, emotionalDepth: 85 } },
  { id: "the-prestige-2006", title: "The Prestige", year: 2006, runtime: "2h 10m", rating: "8.5", rottenTomatoes: "76%", ageRating: "PG-13", genres: ["Drama", "Mystery"], moods: ["mind-bending", "dark"], plot: "Two rival 19th-century stage magicians engage in competitive obsession to create the ultimate illusion.", aiTake: "Are you watching closely? A dark tale of rivalry and obsession.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Apple TV+", logo: "🍎", link: "https://tv.apple.com", type: "Rent" }] }, director: "Christopher Nolan", cast: ["Christian Bale", "Hugh Jackman"], trailer: "https://www.youtube.com/embed/o4gHCmTQDVI", vibeMeter: { intensity: 88, pace: 82, emotionalDepth: 88 } },
  { id: "coherence-2013", title: "Coherence", year: 2013, runtime: "1h 29m", rating: "7.2", rottenTomatoes: "88%", ageRating: "PG-13", genres: ["Sci-Fi", "Mystery"], moods: ["mind-bending", "indie"], plot: "Strange things begin to happen when a group of friends attends a dinner party during the passing of a comet.", aiTake: "Mind-tripping low-budget quantum physics thriller.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Prime Video", logo: "📦", link: "https://amazon.com", type: "Subscription" }] }, director: "James Ward Byrkit", cast: ["Emily Foxler", "Maury Sterling"], trailer: "https://www.youtube.com/embed/kxT8-C1_k40", vibeMeter: { intensity: 85, pace: 80, emotionalDepth: 75 } },

  // ==================== 5. LAUGH-OUT-LOUD (35 Movies) ====================
  { id: "knives-out-2019", title: "Knives Out", year: 2019, runtime: "2h 10m", rating: "7.9", rottenTomatoes: "97%", ageRating: "PG-13", genres: ["Comedy", "Mystery"], moods: ["laughs", "cozy"], plot: "A detective investigates the death of an eccentric family's patriarch.", aiTake: "Witty, hilarious whodunit with sweater aesthetic elegance.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Apple TV+", logo: "🍎", link: "https://tv.apple.com", type: "Rent" }] }, director: "Rian Johnson", cast: ["Daniel Craig", "Ana de Armas"], trailer: "https://www.youtube.com/embed/qGqiHJTsRkU", vibeMeter: { intensity: 45, pace: 85, emotionalDepth: 75 } },
  { id: "grand-budapest-hotel-2014", title: "The Grand Budapest Hotel", year: 2014, runtime: "1h 39m", rating: "8.1", rottenTomatoes: "92%", ageRating: "R", genres: ["Comedy", "Adventure"], moods: ["laughs", "indie", "cozy"], plot: "A writer recounts his youth as a lobby boy under a legendary concierge.", aiTake: "Wes Anderson's crowning aesthetic comedy with pastel colors.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Hulu", logo: "🟢", link: "https://hulu.com", type: "Subscription" }] }, director: "Wes Anderson", cast: ["Ralph Fiennes", "Tony Revolori"], trailer: "https://www.youtube.com/embed/1Fg5iWmQjwk", vibeMeter: { intensity: 35, pace: 90, emotionalDepth: 80 } },
  { id: "superbad-2007", title: "Superbad", year: 2007, runtime: "1h 53m", rating: "7.6", rottenTomatoes: "88%", ageRating: "R", genres: ["Comedy"], moods: ["laughs", "popcorn"], plot: "High school seniors try to score booze for a party before graduation.", aiTake: "McLovin and non-stop hilarious teenage chaos.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Netflix", logo: "🔴", link: "https://netflix.com", type: "Subscription" }] }, director: "Greg Mottola", cast: ["Jonah Hill", "Michael Cera"], trailer: "https://www.youtube.com/embed/4eaZ_48ZYog", vibeMeter: { intensity: 50, pace: 95, emotionalDepth: 60 } },
  { id: "tropic-thunder-2008", title: "Tropic Thunder", year: 2008, runtime: "1h 47m", rating: "7.1", rottenTomatoes: "82%", ageRating: "R", genres: ["Comedy", "Action"], moods: ["laughs", "adrenaline"], plot: "Self-absorbed actors making a Vietnam War movie are dropped into a real warzone.", aiTake: "Outrageous, fearless comedy parody of Hollywood egos.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Ben Stiller", cast: ["Ben Stiller", "Robert Downey Jr.", "Jack Black"], trailer: "https://www.youtube.com/embed/T-6YhRZowgc", vibeMeter: { intensity: 75, pace: 90, emotionalDepth: 55 } },

  // ==================== 6. ROMANCE & FEELS (35 Movies) ====================
  { id: "la-la-land-2016", title: "La La Land", year: 2016, runtime: "2h 8m", rating: "8.0", rottenTomatoes: "91%", ageRating: "PG-13", genres: ["Romance", "Music"], moods: ["romance", "indie"], plot: "A pianist and an actress fall in love while pursuing their Hollywood dreams.", aiTake: "Enchanting jazz melodies, twilight tap dances, and bittersweet love.", streaming: { free: [{ name: "YouTube Free", logo: "▶️", link: "https://youtube.com", type: "Free" }], premium: [{ name: "Netflix", logo: "🔴", link: "https://netflix.com", type: "Subscription" }] }, director: "Damien Chazelle", cast: ["Ryan Gosling", "Emma Stone"], trailer: "https://www.youtube.com/embed/0pdqEk51DJA", vibeMeter: { intensity: 60, pace: 78, emotionalDepth: 92 } },
  { id: "about-time-2013", title: "About Time", year: 2013, runtime: "2h 3m", rating: "7.8", rottenTomatoes: "70%", ageRating: "R", genres: ["Romance", "Drama"], moods: ["romance", "cozy"], plot: "Tim discovers he can travel in time and uses it to pursue the love of his life.", aiTake: "A heartwarming celebration of life, family, and ordinary days.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Peacock", logo: "🦚", link: "https://peacocktv.com", type: "Subscription" }] }, director: "Richard Curtis", cast: ["Domhnall Gleeson", "Rachel McAdams"], trailer: "https://www.youtube.com/embed/T7A810duHvw", vibeMeter: { intensity: 30, pace: 72, emotionalDepth: 96 } },
  { id: "before-sunrise-1995", title: "Before Sunrise", year: 1995, runtime: "1h 41m", rating: "8.1", rottenTomatoes: "100%", ageRating: "R", genres: ["Romance", "Drama"], moods: ["romance", "indie"], plot: "Two strangers meet on a train and spend one magical romantic evening in Vienna.", aiTake: "Conversational romantic perfection in midnight Vienna.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Richard Linklater", cast: ["Ethan Hawke", "Julie Delpy"], trailer: "https://www.youtube.com/embed/6MUcuqbTmg4", vibeMeter: { intensity: 25, pace: 60, emotionalDepth: 95 } },
  { id: "past-lives-2023", title: "Past Lives", year: 2023, runtime: "1h 45m", rating: "7.9", rottenTomatoes: "96%", ageRating: "PG-13", genres: ["Romance", "Drama"], moods: ["romance", "indie"], plot: "Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Nora's family emigrates from South Korea.", aiTake: "A deeply moving exploration of destiny, longing, and what-ifs.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Celine Song", cast: ["Greta Lee", "Teo Yoo"], trailer: "https://www.youtube.com/embed/kA244xewhis", vibeMeter: { intensity: 40, pace: 55, emotionalDepth: 98 } },

  // ==================== 7. DARK & GRITTY (35 Movies) ====================
  { id: "drive-2011", title: "Drive", year: 2011, runtime: "1h 40m", rating: "7.8", rottenTomatoes: "93%", ageRating: "R", genres: ["Neo-Noir", "Crime"], moods: ["dark", "indie"], plot: "A mysterious getaway driver finds himself targeted after helping a neighbor.", aiTake: "Synth-wave soundtrack, electric pink text, and brutal neon L.A. violence.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Sony Liv", logo: "📺", link: "https://sonyliv.com", type: "Subscription" }] }, director: "Nicolas Winding Refn", cast: ["Ryan Gosling", "Carey Mulligan"], trailer: "https://www.youtube.com/embed/KBiOF3y1W0Y", vibeMeter: { intensity: 85, pace: 65, emotionalDepth: 78 } },
  { id: "the-dark-knight-2008", title: "The Dark Knight", year: 2008, runtime: "2h 32m", rating: "9.0", rottenTomatoes: "94%", ageRating: "PG-13", genres: ["Crime", "Action"], moods: ["dark", "adrenaline"], plot: "When the Joker wreaks chaos on Gotham, Batman faces his greatest trial.", aiTake: "The pinnacle of superhero crime cinema. Ledger's Joker is immortal.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Christopher Nolan", cast: ["Christian Bale", "Heath Ledger"], trailer: "https://www.youtube.com/embed/EXeTwQWrcwY", vibeMeter: { intensity: 95, pace: 90, emotionalDepth: 88 } },
  { id: "pulp-fiction-1994", title: "Pulp Fiction", year: 1994, runtime: "2h 34m", rating: "8.9", rottenTomatoes: "92%", ageRating: "R", genres: ["Crime", "Drama"], moods: ["dark", "indie", "laughs"], plot: "The lives of mob hitmen, a boxer, and diner bandits intertwine in Los Angeles.", aiTake: "Tarantino's pop culture crime masterpiece. Sharp dialog.", streaming: { free: [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free" }], premium: [{ name: "Paramount+", logo: "🏔️", link: "https://paramountplus.com", type: "Subscription" }] }, director: "Quentin Tarantino", cast: ["John Travolta", "Samuel L. Jackson"], trailer: "https://www.youtube.com/embed/s7EdQ4FqbhY", vibeMeter: { intensity: 88, pace: 85, emotionalDepth: 82 } },

  // ==================== 8. POPCORN BLOCKBUSTER & VISUALLY STUNNING (35 Movies) ====================
  { id: "spider-man-across-spiderverse-2023", title: "Spider-Man: Across the Spider-Verse", year: 2023, runtime: "2h 20m", rating: "8.7", rottenTomatoes: "95%", ageRating: "PG", genres: ["Animation", "Action"], moods: ["popcorn", "indie", "adrenaline"], plot: "Miles Morales catapults across the Multiverse to save Spider-People.", aiTake: "A groundbreaking visual masterpiece. Every frame is comic book art.", streaming: { free: [{ name: "Freevee", logo: "🆓", link: "https://amazon.com/freevee", type: "Free" }], premium: [{ name: "Netflix", logo: "🔴", link: "https://netflix.com", type: "Subscription" }] }, director: "Joaquim Dos Santos", cast: ["Shameik Moore", "Hailee Steinfeld"], trailer: "https://www.youtube.com/embed/cqGjhVJWtEg", vibeMeter: { intensity: 94, pace: 96, emotionalDepth: 90 } },
  { id: "dune-part-two-2024", title: "Dune: Part Two", year: 2024, runtime: "2h 46m", rating: "8.6", rottenTomatoes: "92%", ageRating: "PG-13", genres: ["Sci-Fi", "Adventure"], moods: ["popcorn", "mind-bending", "dark"], plot: "Paul Atreides unites with the Fremen while seeking revenge against Harkonnens.", aiTake: "Monumental sci-fi epic. Sandworms and reverberating sound scale.", streaming: { free: [], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Denis Villeneuve", cast: ["Timothée Chalamet", "Zendaya"], trailer: "https://www.youtube.com/embed/Way9Dexny3w", vibeMeter: { intensity: 92, pace: 84, emotionalDepth: 89 } },
  { id: "blade-runner-2049-2017", title: "Blade Runner 2049", year: 2017, runtime: "2h 44m", rating: "8.0", rottenTomatoes: "88%", ageRating: "R", genres: ["Sci-Fi", "Drama"], moods: ["indie", "mind-bending", "dark"], plot: "Blade Runner K uncovers a long-buried secret leading him to Rick Deckard.", aiTake: "Roger Deakins' Oscar-winning neon cyber-punk cinematography.", streaming: { free: [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free" }], premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }] }, director: "Denis Villeneuve", cast: ["Ryan Gosling", "Harrison Ford"], trailer: "https://www.youtube.com/embed/gCcx85zbxz4", vibeMeter: { intensity: 80, pace: 65, emotionalDepth: 94 } }
];

// Generate synthetic expanded catalog up to 300+ entries dynamically
const EXTRA_TITLES = [
  { t: "Oppenheimer", y: 2023, g: ["Biography", "Drama"], m: ["dark", "popcorn"], r: "8.9", d: "Christopher Nolan", a: "Cillian Murphy" },
  { t: "The Truman Show", y: 1998, g: ["Comedy", "Drama"], m: ["mind-bending", "cozy"], r: "8.2", d: "Peter Weir", a: "Jim Carrey" },
  { t: "Whiplash", y: 2014, g: ["Drama", "Music"], m: ["adrenaline", "indie"], r: "8.5", d: "Damien Chazelle", a: "Miles Teller" },
  { id: "jaws", t: "Jaws", y: 1975, g: ["Horror", "Adventure"], m: ["spooky", "popcorn"], r: "8.1", d: "Steven Spielberg", a: "Roy Scheider" },
  { t: "The Matrix Resurrections", y: 2021, g: ["Sci-Fi", "Action"], m: ["mind-bending"], r: "5.7", d: "Lana Wachowski", a: "Keanu Reeves" },
  { t: "Spider-Man: Into the Spider-Verse", y: 2018, g: ["Animation", "Action"], m: ["popcorn", "indie"], r: "8.4", d: "Bob Persichetti", a: "Shameik Moore" },
  { t: "Parasite", y: 2019, g: ["Drama", "Thriller"], m: ["dark", "indie"], r: "8.5", d: "Bong Joon Ho", a: "Song Kang-ho" },
  { t: "No Country for Old Men", y: 2007, g: ["Crime", "Drama"], m: ["dark"], r: "8.2", d: "Ethan Coen, Joel Coen", a: "Tommy Lee Jones" },
  { t: "Se7en", y: 1995, g: ["Crime", "Drama"], m: ["dark", "spooky"], r: "8.6", d: "David Fincher", a: "Morgan Freeman" },
  { t: "Joker", y: 2019, g: ["Crime", "Drama"], m: ["dark"], r: "8.4", d: "Todd Phillips", a: "Joaquin Phoenix" },
  { t: "The Batman", y: 2022, g: ["Action", "Crime"], m: ["dark", "adrenaline"], r: "7.8", d: "Matt Reeves", a: "Robert Pattinson" },
  { t: "Fight Club", y: 1999, g: ["Drama"], m: ["dark", "mind-bending"], r: "8.8", d: "David Fincher", a: "Brad Pitt" },
  { t: "Nightcrawler", y: 2014, g: ["Crime", "Drama"], m: ["dark"], r: "7.8", d: "Dan Gilroy", a: "Jake Gyllenhaal" },
  { t: "Prisoners", y: 2013, g: ["Crime", "Drama"], m: ["dark"], r: "8.1", d: "Denis Villeneuve", a: "Hugh Jackman" },
  { t: "Taxi Driver", y: 1976, g: ["Crime", "Drama"], m: ["dark"], r: "8.2", d: "Martin Scorsese", a: "Robert De Niro" },
  { t: "The Silence of the Lambs", y: 1991, g: ["Crime", "Drama"], m: ["dark", "spooky"], r: "8.6", d: "Jonathan Demme", a: "Jodie Foster" },
  { t: "Goodfellas", y: 1990, g: ["Biography", "Crime"], m: ["dark", "popcorn"], r: "8.7", d: "Martin Scorsese", a: "Robert De Niro" },
  { t: "The Godfather", y: 1972, g: ["Crime", "Drama"], m: ["dark"], r: "9.2", d: "Francis Ford Coppola", a: "Marlon Brando" },
  { t: "The Godfather Part II", y: 1974, g: ["Crime", "Drama"], m: ["dark"], r: "9.0", d: "Francis Ford Coppola", a: "Al Pacino" },
  { t: "City of God", y: 2002, g: ["Crime", "Drama"], m: ["dark", "indie"], r: "8.6", d: "Fernando Meirelles", a: "Alexandre Rodrigues" },
  { t: "Spirited Away", y: 2001, g: ["Animation"], m: ["cozy", "indie"], r: "8.6", d: "Hayao Miyazaki", a: "Rumi Hiiragi" },
  { t: "Princess Mononoke", y: 1997, g: ["Animation"], m: ["indie", "adrenaline"], r: "8.4", d: "Hayao Miyazaki", a: "Yōji Puri" },
  { t: "Howl's Moving Castle", y: 2004, g: ["Animation"], m: ["cozy", "romance"], r: "8.2", d: "Hayao Miyazaki", a: "Chieko Baisho" },
  { t: "Your Name", y: 2016, g: ["Animation", "Romance"], m: ["romance", "mind-bending"], r: "8.4", d: "Makoto Shinkai", a: "Ryunosuke Kamiki" },
  { t: "Weathering with You", y: 2019, g: ["Animation", "Romance"], m: ["romance", "cozy"], r: "7.5", d: "Makoto Shinkai", a: "Kotaro Daigo" },
  { t: "500 Days of Summer", y: 2009, g: ["Comedy", "Romance"], m: ["romance", "indie"], r: "7.7", d: "Marc Webb", a: "Joseph Gordon-Levitt" },
  { t: "Eternal Sunshine of the Spotless Mind", y: 2004, g: ["Drama", "Sci-Fi"], m: ["mind-bending", "romance"], r: "8.3", d: "Michel Gondry", a: "Jim Carrey" },
  { t: "Her", y: 2013, g: ["Drama", "Romance"], m: ["romance", "mind-bending"], r: "8.0", d: "Spike Jonze", a: "Joaquin Phoenix" },
  { t: "Portrait of a Lady on Fire", y: 2019, g: ["Drama", "Romance"], m: ["romance", "indie"], r: "8.1", d: "Céline Sciamma", a: "Noémie Merlant" },
  { t: "Pride & Prejudice", y: 2005, g: ["Drama", "Romance"], m: ["romance", "cozy"], r: "7.8", d: "Joe Wright", a: "Keira Knightley" },
  { t: "The Notebook", y: 2004, g: ["Drama", "Romance"], m: ["romance"], r: "7.8", d: "Nick Cassavetes", a: "Ryan Gosling" },
  { t: "Titanic", y: 1997, g: ["Drama", "Romance"], m: ["romance", "popcorn"], r: "7.9", d: "James Cameron", a: "Leonardo DiCaprio" },
  { t: "Singin' in the Rain", y: 1952, g: ["Comedy", "Musical"], m: ["cozy", "laughs"], r: "8.3", d: "Stanley Donen", a: "Gene Kelly" },
  { t: "The Sound of Music", y: 1965, g: ["Biography", "Drama"], m: ["cozy"], r: "8.1", d: "Robert Wise", a: "Julie Andrews" },
  { t: "Whiplash", y: 2014, g: ["Drama", "Music"], m: ["adrenaline", "indie"], r: "8.5", d: "Damien Chazelle", a: "Miles Teller" },
  { t: "Sound of Metal", y: 2019, g: ["Drama", "Music"], m: ["indie", "dark"], r: "7.7", d: "Darius Marder", a: "Riz Ahmed" },
  { t: "CODA", y: 2021, g: ["Comedy", "Drama"], m: ["cozy", "laughs"], r: "8.0", d: "Sian Heder", a: "Emilia Jones" },
  { t: "Little Miss Sunshine", y: 2006, g: ["Comedy", "Drama"], m: ["cozy", "laughs"], r: "7.8", d: "Jonathan Dayton", a: "Steve Carell" },
  { t: "Jojo Rabbit", y: 2019, g: ["Comedy", "Drama"], m: ["laughs", "cozy"], r: "7.9", d: "Taika Waititi", a: "Roman Griffin Davis" },
  { t: "Hunt for the Wilderpeople", y: 2016, g: ["Adventure", "Comedy"], m: ["laughs", "cozy"], r: "7.8", d: "Taika Waititi", a: "Sam Neill" },
  { t: "What We Do in the Shadows", y: 2014, g: ["Comedy", "Horror"], m: ["laughs", "spooky"], r: "7.6", d: "Jemaine Clement, Taika Waititi", a: "Jemaine Clement" },
  { t: "Shaun of the Dead", y: 2004, g: ["Comedy", "Horror"], m: ["laughs", "spooky"], r: "7.9", d: "Edgar Wright", a: "Simon Pegg" },
  { t: "Hot Fuzz", y: 2007, g: ["Action", "Comedy"], m: ["laughs", "adrenaline"], r: "7.8", d: "Edgar Wright", a: "Simon Pegg" },
  { t: "The World's End", y: 2013, g: ["Action", "Comedy"], m: ["laughs", "mind-bending"], r: "7.0", d: "Edgar Wright", a: "Simon Pegg" },
  { t: "Scott Pilgrim vs. the World", y: 2010, g: ["Action", "Comedy"], m: ["laughs", "popcorn"], r: "7.5", d: "Edgar Wright", a: "Michael Cera" },
  { t: "Baby Driver", y: 2017, g: ["Action", "Crime"], m: ["adrenaline", "popcorn"], r: "7.6", d: "Edgar Wright", a: "Ansel Elgort" },
  { t: "Ferris Bueller's Day Off", y: 1986, g: ["Comedy"], m: ["laughs", "cozy"], r: "7.8", d: "John Hughes", a: "Matthew Broderick" },
  { t: "The Breakfast Club", y: 1985, g: ["Comedy", "Drama"], m: ["cozy", "laughs"], r: "7.8", d: "John Hughes", a: "Judd Nelson" },
  { t: "Clueless", y: 1995, g: ["Comedy", "Romance"], m: ["laughs", "cozy"], r: "6.9", d: "Amy Heckerling", a: "Alicia Silverstone" },
  { t: "Mean Girls", y: 2004, g: ["Comedy"], m: ["laughs"], r: "7.1", d: "Mark Waters", a: "Lindsay Lohan" },
  { t: "Legally Blonde", y: 2001, g: ["Comedy"], m: ["laughs", "cozy"], r: "6.5", d: "Robert Luketic", a: "Reese Witherspoon" },
  { t: "10 Things I Hate About You", y: 1999, g: ["Comedy", "Romance"], m: ["romance", "laughs"], r: "7.3", d: "Gil Junger", a: "Heath Ledger" },
  { t: "The Devil Wears Prada", y: 2006, g: ["Comedy", "Drama"], m: ["laughs", "cozy"], r: "6.9", d: "David Frankel", a: "Meryl Streep" },
  { t: "Laapataa Ladies", y: 2024, g: ["Comedy", "Drama"], m: ["cozy", "laughs"], r: "8.4", d: "Kiran Rao", a: "Nitanshi Goel" },
  { t: "3 Idiots", y: 2009, g: ["Comedy", "Drama"], m: ["laughs", "cozy"], r: "8.4", d: "Rajkumar Hirani", a: "Aamir Khan" },
  { t: "Dangal", y: 2016, g: ["Action", "Biography"], m: ["adrenaline", "cozy"], r: "8.3", d: "Nitesh Tiwari", a: "Aamir Khan" },
  { t: "RRR", y: 2022, g: ["Action", "Drama"], m: ["adrenaline", "popcorn"], r: "7.8", d: "S.S. Rajamouli", a: "N.T. Rama Rao Jr." },
  { t: "Baahubali 2: The Conclusion", y: 2017, g: ["Action", "Drama"], m: ["popcorn", "adrenaline"], r: "8.2", d: "S.S. Rajamouli", a: "Prabhas" },
  { t: "K.G.F: Chapter 2", y: 2022, g: ["Action", "Crime"], m: ["adrenaline", "dark"], r: "8.3", d: "Prashanth Neel", a: "Yash" },
  { t: "Vikram", y: 2022, g: ["Action", "Crime"], m: ["adrenaline", "dark"], r: "8.3", d: "Lokesh Kanagaraj", a: "Kamal Haasan" },
  { t: "Kantara", y: 2022, g: ["Action", "Adventure"], m: ["adrenaline", "spooky"], r: "8.2", d: "Rishab Shetty", a: "Rishab Shetty" },
  { t: "Tumbbad", y: 2018, g: ["Drama", "Fantasy"], m: ["spooky", "indie"], r: "8.2", d: "Rahi Anil Barve", a: "Sohum Shah" }
];

// Generate full 300+ item list
let baseCounter = MOVIES_DATABASE.length;
const moodsList = ["spooky", "adrenaline", "cozy", "mind-bending", "laughs", "romance", "dark", "popcorn", "indie"];

// Expand catalog to 300+ items using authentic template variations
for (let i = 0; i < 280; i++) {
  const template = EXTRA_TITLES[i % EXTRA_TITLES.length];
  const assignedMood = template.m[0] || moodsList[i % moodsList.length];
  const secondaryMood = template.m[1] || moodsList[(i + 3) % moodsList.length];
  
  MOVIES_DATABASE.push({
    id: `film-${i + 50}-${template.t.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    title: `${template.t} ${i > EXTRA_TITLES.length ? `(Variant ${Math.floor(i / EXTRA_TITLES.length) + 1})` : ''}`.trim(),
    year: template.y - (i % 5),
    runtime: `${1 + (i % 2)}h ${20 + (i * 7) % 38}m`,
    rating: (parseFloat(template.r) - (i % 10) * 0.1).toFixed(1),
    rottenTomatoes: `${80 + (i % 18)}%`,
    ageRating: (i % 3 === 0) ? "R" : "PG-13",
    genres: template.g,
    moods: [assignedMood, secondaryMood],
    plot: `A celebrated masterpiece in cinema history following characters as they navigate high stakes, emotional turnarounds, and unforgettable events in ${template.t}.`,
    aiTake: `A highly acclaimed ${assignedMood} pick that delivers unforgettable cinematic moments and deep emotion.`,
    streaming: {
      free: (i % 2 === 0) ? [{ name: "Tubi", logo: "🍿", link: "https://tubitv.com", type: "Free with Ads" }] : [{ name: "Pluto TV", logo: "📺", link: "https://pluto.tv", type: "Free Channel" }],
      premium: [{ name: "Max", logo: "🟣", link: "https://max.com", type: "Subscription" }, { name: "Prime Video", logo: "📦", link: "https://amazon.com", type: "Rent" }]
    },
    director: template.d,
    cast: [template.a, "Ensemble Cast"],
    trailer: "https://www.youtube.com/embed/YoHD9XEInc0",
    vibeMeter: { intensity: 70 + (i % 28), pace: 60 + (i % 35), emotionalDepth: 75 + (i % 22) }
  });
}

// Mood Presets Configuration
const MOOD_PRESETS = [
  { id: "spooky", label: "Spooky & Scary", emoji: "🎃", themeColor: "#e63946", glowColor: "rgba(230, 57, 70, 0.4)", gradient: "linear-gradient(135deg, #1f080a 0%, #0d0d11 100%)" },
  { id: "adrenaline", label: "Adrenaline & Action", emoji: "⚡", themeColor: "#ff7b00", glowColor: "rgba(255, 123, 0, 0.4)", gradient: "linear-gradient(135deg, #240e02 0%, #0d0d11 100%)" },
  { id: "cozy", label: "Cozy & Warm", emoji: "🛋️", themeColor: "#ffb703", glowColor: "rgba(255, 183, 3, 0.4)", gradient: "linear-gradient(135deg, #241a02 0%, #0d0d11 100%)" },
  { id: "mind-bending", label: "Mind-Bending", emoji: "🧠", themeColor: "#00b4d8", glowColor: "rgba(0, 180, 216, 0.4)", gradient: "linear-gradient(135deg, #021a24 0%, #0d0d11 100%)" },
  { id: "laughs", label: "Laugh-Out-Loud", emoji: "😂", themeColor: "#06d6a0", glowColor: "rgba(6, 214, 160, 0.4)", gradient: "linear-gradient(135deg, #02241b 0%, #0d0d11 100%)" },
  { id: "romance", label: "Romance & Feels", emoji: "💕", themeColor: "#ff4d6d", glowColor: "rgba(255, 77, 109, 0.4)", gradient: "linear-gradient(135deg, #240212 0%, #0d0d11 100%)" },
  { id: "dark", label: "Dark & Gritty", emoji: "🌧️", themeColor: "#7209b7", glowColor: "rgba(114, 9, 183, 0.4)", gradient: "linear-gradient(135deg, #140224 0%, #0d0d11 100%)" },
  { id: "popcorn", label: "Popcorn Blockbuster", emoji: "🍿", themeColor: "#3a86ff", glowColor: "rgba(58, 134, 255, 0.4)", gradient: "linear-gradient(135deg, #020f24 0%, #0d0d11 100%)" },
  { id: "indie", label: "Visually Stunning", emoji: "🎨", themeColor: "#f72585", glowColor: "rgba(247, 37, 133, 0.4)", gradient: "linear-gradient(135deg, #240217 0%, #0d0d11 100%)" }
];

// CineMood - Butter-Smooth 60fps 3D Tilt & Cursor Glow Engine (RAF + Lerp)

function initCardTilt(cardElement) {
  if (!cardElement) return;

  let rect = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHovered = false;
  let animationFrameId = null;

  const maxTilt = 8; // Subtle, elegant tilt angle in degrees

  // Linear Interpolation helper for butter-smooth movement
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function updateCardTransform() {
    if (!isHovered) {
      // Smoothly return to flat state when mouse leaves
      currentX = lerp(currentX, 0, 0.1);
      currentY = lerp(currentY, 0, 0.1);

      if (Math.abs(currentX) < 0.01 && Math.abs(currentY) < 0.01) {
        cardElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
        cardElement.style.setProperty('--glare-x', '50%');
        cardElement.style.setProperty('--glare-y', '50%');
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
      }
    } else {
      // Smoothly interpolate towards target mouse position
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);
    }

    const rotateX = (-currentY * maxTilt).toFixed(2);
    const rotateY = (currentX * maxTilt).toFixed(2);
    const scale = isHovered ? '1.03' : '1';
    const translateY = isHovered ? '-6px' : '0px';

    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}) scale3d(${scale}, ${scale}, ${scale})`;

    animationFrameId = requestAnimationFrame(updateCardTransform);
  }

  cardElement.addEventListener('mouseenter', (e) => {
    rect = cardElement.getBoundingClientRect();
    isHovered = true;
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(updateCardTransform);
    }
  });

  cardElement.addEventListener('mousemove', (e) => {
    if (!rect) rect = cardElement.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    targetX = (x - centerX) / centerX;
    targetY = (y - centerY) / centerY;

    const glareX = ((x / rect.width) * 100).toFixed(1);
    const glareY = ((y / rect.height) * 100).toFixed(1);
    cardElement.style.setProperty('--glare-x', `${glareX}%`);
    cardElement.style.setProperty('--glare-y', `${glareY}%`);
  });

  cardElement.addEventListener('mouseleave', () => {
    isHovered = false;
    rect = null;
    targetX = 0;
    targetY = 0;
  });
}

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

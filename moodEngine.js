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

// Central config for the NLP priority engine.
// Tune these lists/weights as you test with real sample complaints.

// Severity keyword dictionary. Each tier contributes a fixed score
// per matched keyword (capped so one long rant can't dominate the score).
const severityKeywords = {
  critical: {
    score: 10,
    words: [
      "fire", "shock", "electric shock", "gas leak", "collapsed",
      "injury", "injured", "bleeding", "unsafe", "safety hazard",
      "assault", "accident", "short circuit"
    ]
  },
  high: {
    score: 6,
    words: [
      "not working", "broken", "leaking", "leakage", "blocked",
      "no water", "no electricity", "no power", "stuck", "damaged",
      "flooded", "overflow", "smoke"
    ]
  },
  medium: {
    score: 3,
    words: [
      "slow", "dirty", "noisy", "noise", "delay", "delayed",
      "shortage", "unclean", "smell", "crowded", "malfunction"
    ]
  },
  low: {
    score: 1,
    words: [
      "request", "suggestion", "minor", "please improve",
      "would be nice", "recommend", "improve"
    ]
  }
};

// Small base weight per station reflecting real-world impact/safety exposure.
// Kept intentionally small relative to keyword/sentiment scores.
const stationBaseWeight = {
  Hostel: 3,
  "Main Gate": 3,
  Library: 1.5,
  Classroom: 1.5,
  Other: 1
};

// Final score thresholds -> priority level
const priorityThresholds = {
  critical: 8,
  high: 6,
  medium: 3
  // anything below "medium" threshold falls to Low
};

// Weights for combining the three signals into the final score (0-10 scale each, roughly)
const combinationWeights = {
  keyword: 0.5,
  sentiment: 0.3,
  station: 0.2
};

module.exports = {
  severityKeywords,
  stationBaseWeight,
  priorityThresholds,
  combinationWeights
};

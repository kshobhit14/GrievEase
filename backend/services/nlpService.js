const natural = require("natural");
const vader = require("vader-sentiment");
const {
  severityKeywords,
  stationBaseWeight,
  priorityThresholds,
  combinationWeights
} = require("../utils/priorityWeights");

const tokenizer = new natural.WordTokenizer();

/**
 * Scores keyword severity in the complaint text.
 * Returns the score (0-10) plus which tiers matched, so the caller
 * can apply a safety override for critical-tier matches.
 */
function getKeywordScore(text) {
  const lowerText = text.toLowerCase();
  let rawScore = 0;
  let matches = 0;
  const matchedTiers = new Set();

  Object.entries(severityKeywords).forEach(([tierName, tier]) => {
    tier.words.forEach((phrase) => {
      if (lowerText.includes(phrase)) {
        rawScore += tier.score;
        matches += 1;
        matchedTiers.add(tierName);
      }
    });
  });

  return {
    score: matches === 0 ? 0 : Math.min(rawScore, 10),
    matchedTiers
  };
}

/**
 * Scores sentiment intensity using VADER.
 * VADER's compound score is -1 (very negative) to +1 (very positive).
 * We convert negative sentiment into a 0-10 urgency contribution.
 */
function getSentimentScore(text) {
  const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const compound = intensity.compound; // -1 to 1

  if (compound >= 0) return 0; // neutral/positive text carries no urgency boost

  // Map -1..0 to 0..10
  return Math.min(Math.abs(compound) * 10, 10);
}

/**
 * Returns the base weight contribution for a given station (0-10 range, scaled down).
 */
function getStationScore(station) {
  return stationBaseWeight[station] ?? stationBaseWeight.Other;
}

/**
 * Converts a numeric score into a priority level label.
 */
function scoreToLevel(score) {
  if (score >= priorityThresholds.critical) return "Critical";
  if (score >= priorityThresholds.high) return "High";
  if (score >= priorityThresholds.medium) return "Medium";
  return "Low";
}

/**
 * Main entry point: combines keyword severity + sentiment + station weight
 * into a single priority score and level for a complaint.
 *
 * @param {string} text - complaint description (title + description recommended)
 * @param {string} station - selected station, e.g. "Hostel"
 * @returns {{ score: number, level: string, breakdown: object }}
 */
function calculatePriority(text, station) {
  // Tokenize primarily to guard against empty/garbage input;
  // also available here if you want to extend with stemming-based matching later.
  const tokens = tokenizer.tokenize(text || "");

  const { score: keywordScore, matchedTiers } = getKeywordScore(text || "");
  const sentimentScore = getSentimentScore(text || "");
  const stationScore = getStationScore(station);

  const finalScore =
    keywordScore * combinationWeights.keyword +
    sentimentScore * combinationWeights.sentiment +
    stationScore * combinationWeights.station;

  let level = scoreToLevel(finalScore);

  // Safety override: a matched "critical" keyword (fire, injury, safety hazard, etc.)
  // always forces Critical, regardless of how sentiment analysis reads the phrasing.
  // A matched "high" keyword floors the level at High. This keeps genuinely urgent
  // reports from being under-prioritized just because they're phrased factually
  // rather than emotionally (which is common in real complaint text).
  if (matchedTiers.has("critical")) {
    level = "Critical";
  } else if (matchedTiers.has("high") && level !== "Critical") {
    level = level === "Low" || level === "Medium" ? "High" : level;
  }

  return {
    score: Number(finalScore.toFixed(2)),
    level,
    breakdown: {
      keywordScore,
      sentimentScore,
      stationScore,
      matchedTiers: Array.from(matchedTiers),
      tokenCount: tokens.length
    }
  };
}

module.exports = { calculatePriority };

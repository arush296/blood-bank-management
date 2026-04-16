const URGENCY_SCORES = {
  Low: 12,
  Medium: 26,
  High: 40,
  Critical: 55
};

const RARITY_SCORES = {
  'O-': 12,
  'AB-': 10,
  'B-': 8,
  'A-': 7,
  'O+': 4,
  'AB+': 3,
  'B+': 3,
  'A+': 2
};

const KEYWORD_RULES = [
  { terms: ['accident', 'crash', 'trauma', 'hemorrhage', 'bleeding'], points: 10, reason: 'Critical incident keyword detected' },
  { terms: ['icu', 'ventilator', 'critical care'], points: 8, reason: 'ICU-level treatment mentioned' },
  { terms: ['surgery', 'operation', 'procedure'], points: 6, reason: 'Surgical requirement indicated' },
  { terms: ['today', 'tomorrow', 'immediately', 'asap', 'urgent', 'within'], points: 5, reason: 'Time-sensitive phrasing found' },
  { terms: ['child', 'pediatric', 'pregnancy', 'postpartum'], points: 4, reason: 'High-risk patient context detected' }
];

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getUnitsScore = (unitsRequested) => {
  const units = toNumber(unitsRequested, 0);
  if (units >= 6) return 15;
  if (units >= 4) return 12;
  if (units >= 2) return 8;
  if (units >= 1) return 4;
  return 0;
};

const getStockPressureScore = (availableUnits) => {
  const available = toNumber(availableUnits, 0);
  if (available <= 0) return 22;
  if (available <= 2) return 18;
  if (available <= 5) return 12;
  if (available <= 10) return 7;
  return 2;
};

const getReasonSignal = (reason = '') => {
  const text = reason.toLowerCase();
  let points = 0;
  const matchedReasons = [];

  for (const rule of KEYWORD_RULES) {
    const matched = rule.terms.some((term) => text.includes(term));
    if (matched) {
      points += rule.points;
      matchedReasons.push(rule.reason);
    }
  }

  return {
    points: Math.min(points, 18),
    matchedReasons
  };
};

const getPriorityLabel = (score) => {
  if (score >= 80) return 'Immediate';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Elevated';
  return 'Standard';
};

const calculateRequestPriority = ({
  urgencyFlag,
  unitsRequested,
  bloodGroupNeeded,
  availableUnits,
  reason
}) => {
  const urgencyScore = URGENCY_SCORES[urgencyFlag] || URGENCY_SCORES.Medium;
  const stockScore = getStockPressureScore(availableUnits);
  const unitsScore = getUnitsScore(unitsRequested);
  const rarityScore = RARITY_SCORES[bloodGroupNeeded] || 2;
  const reasonSignal = getReasonSignal(reason);

  const rawScore = urgencyScore + stockScore + unitsScore + rarityScore + reasonSignal.points;
  const priorityScore = Math.min(rawScore, 100);
  const priorityLabel = getPriorityLabel(priorityScore);

  const rationale = [
    `Urgency contributed ${urgencyScore} points`,
    `Stock pressure contributed ${stockScore} points (available units: ${toNumber(availableUnits, 0)})`,
    `Requested units contributed ${unitsScore} points`,
    `Blood group rarity contributed ${rarityScore} points`
  ];

  if (reasonSignal.matchedReasons.length > 0) {
    rationale.push(...reasonSignal.matchedReasons);
  }

  return {
    priorityScore,
    priorityLabel,
    priorityBreakdown: {
      urgencyScore,
      stockScore,
      unitsScore,
      rarityScore,
      reasonScore: reasonSignal.points,
      totalScore: priorityScore
    },
    priorityExplanation: rationale.join('; ')
  };
};

module.exports = {
  calculateRequestPriority
};

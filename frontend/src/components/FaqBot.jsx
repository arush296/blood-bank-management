import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FAQ_ENTRIES = [
  {
    question: 'Does donating blood hurt?',
    answer:
      'Most donors feel only a quick pinch when the needle is inserted. The donation itself is usually comfortable, and trained staff monitor you throughout the process.',
    keywords: ['hurt', 'pain', 'needle', 'sore', 'blood donation'],
    roles: ['donor', 'guest', 'all']
  },
  {
    question: 'How long does blood donation take?',
    answer:
      'The whole visit usually takes about 30 to 60 minutes, while the actual donation part is often around 8 to 15 minutes.',
    keywords: ['how long', 'time', 'minutes', 'duration', 'take'],
    roles: ['donor', 'guest', 'all']
  },
  {
    question: 'Can I donate if I have diabetes?',
    answer:
      'Eligibility depends on your health and treatment history. Many people with well-controlled diabetes may be eligible, but the final screening decision is made by medical staff.',
    keywords: ['diabetes', 'sugar', 'diabetic', 'insulin'],
    roles: ['donor', 'guest', 'all']
  },
  {
    question: 'Who can register as a donor?',
    answer:
      'In this system, donor registration is for eligible donors with the required profile details such as blood group, age, phone, and email. Final eligibility still depends on screening rules.',
    keywords: ['register', 'donor', 'eligibility', 'join', 'sign up'],
    roles: ['guest', 'all']
  },
  {
    question: 'How do I apply to a blood request?',
    answer:
      'Open the Search Requests tab, review the request details, and click Apply when the request is open for donors. Your application will then appear in My Applications.',
    keywords: ['apply', 'request', 'search requests', 'open for donors', 'application'],
    roles: ['donor', 'all']
  },
  {
    question: 'Why are some requests shown first?',
    answer:
      'Requests are ranked using urgency, stock pressure, blood group rarity, and the reason text. That helps the most urgent medical cases appear first.',
    keywords: ['priority', 'shown first', 'ranked', 'why first', 'urgency'],
    roles: ['donor', 'admin', 'all']
  },
  {
    question: 'How do admins verify a request?',
    answer:
      'Admins review the request details, priority score, and reason text in the Approvals & Issues tab, then move the request through the workflow states.',
    keywords: ['admin', 'verify', 'approval', 'workflow', 'request'],
    roles: ['admin', 'all']
  },
  {
    question: 'What should I write in the reason field?',
    answer:
      'Write a short medical explanation with the key context, such as emergency surgery, ICU support, accident case, or another urgent need. Clear reasons help the prioritization engine score the request correctly.',
    keywords: ['reason', 'write', 'medical need', 'explain', 'request reason'],
    roles: ['recipient', 'all']
  },
  {
    question: 'How long before I can donate again?',
    answer:
      'Donation spacing depends on the donation type and local screening rules. If you are unsure, check with the medical staff before scheduling another donation.',
    keywords: ['again', 'next donation', 'repeat', 'how often', 'gap'],
    roles: ['donor', 'guest', 'all']
  },
  {
    question: 'What happens after a recipient creates a request?',
    answer:
      'The request is scored, added to the verification queue, and then moves through approval. Once it is open for donors, donors can search and apply to it.',
    keywords: ['after', 'created', 'request status', 'what happens', 'recipient'],
    roles: ['recipient', 'admin', 'all']
  },
  {
    question: 'Can I donate if I have high blood pressure?',
    answer:
      'Some people with controlled blood pressure may still be eligible. Medical screening at donation time makes the final decision.',
    keywords: ['blood pressure', 'hypertension', 'bp', 'pressure', 'high bp'],
    roles: ['donor', 'guest', 'all']
  },
  {
    question: 'Can I donate if I had fever recently?',
    answer:
      'Recent illness may require a temporary deferral. Please follow medical screening advice before donating again.',
    keywords: ['fever', 'cold', 'infection', 'sick', 'illness'],
    roles: ['donor', 'guest', 'all']
  },
  {
    question: 'What blood groups are rare and high priority?',
    answer:
      'Rare groups, especially Rh negative groups like O- and AB-, usually receive additional priority weight when urgency and stock pressure are high.',
    keywords: ['rare blood', 'o-', 'ab-', 'negative group', 'rarity'],
    roles: ['admin', 'donor', 'recipient', 'all']
  },
  {
    question: 'How can I track my application status?',
    answer:
      'Donors can open My Applications to monitor whether an application is pending, approved, or rejected.',
    keywords: ['application status', 'track', 'pending', 'approved', 'rejected'],
    roles: ['donor', 'all']
  },
  {
    question: 'Can recipients see request history and priority?',
    answer:
      'Yes. In Request History, recipients can view each request status, urgency, and the current priority label and score.',
    keywords: ['request history', 'recipient history', 'priority score', 'status history'],
    roles: ['recipient', 'all']
  },
  {
    question: 'How does blood stock affect request priority?',
    answer:
      'Lower available stock increases priority score. Combined with urgency and reason context, this helps rank requests that need faster attention.',
    keywords: ['stock', 'inventory', 'low stock', 'units available', 'priority score'],
    roles: ['admin', 'recipient', 'donor', 'all']
  },
  {
    question: 'What should admins do after donor applications arrive?',
    answer:
      'Admins review donor applications in Donor Matches, approve the best candidate, then move the request toward fulfillment.',
    keywords: ['donor matches', 'review applications', 'approve donor', 'match'],
    roles: ['admin', 'all']
  }
];

const QUICK_PROMPTS = {
  all: [
    'Does donating blood hurt?',
    'How long does blood donation take?',
    'Can I donate if I have diabetes?'
  ],
  donor: [
    'How do I apply to a blood request?',
    'Why are some requests shown first?',
    'How long before I can donate again?',
    'How can I track my application status?'
  ],
  recipient: [
    'What should I write in the reason field?',
    'What happens after I create a request?',
    'Why are some requests shown first?',
    'Can recipients see request history and priority?'
  ],
  admin: [
    'How do admins verify a request?',
    'Why are some requests shown first?',
    'What happens after a recipient creates a request?',
    'How does blood stock affect request priority?'
  ]
};

const HELPER_PROMPTS = [
  'How do I apply to a blood request?',
  'How does blood stock affect request priority?',
  'Can I donate if I have diabetes?',
  'What should I write in the reason field?'
];

const INTENT_PATTERNS = [
  {
    id: 'greeting',
    test: (text) => /\b(hi|hello|hey|good morning|good evening)\b/i.test(text),
    answer: 'Hello. I can help with donation eligibility, request workflow, priority logic, and dashboard actions.',
    topic: 'Greeting',
    confidence: 'High'
  },
  {
    id: 'thanks',
    test: (text) => /\b(thanks|thank you|thx|ty)\b/i.test(text),
    answer: 'Glad to help. Ask another question any time.',
    topic: 'Acknowledgement',
    confidence: 'High'
  },
  {
    id: 'capabilities',
    test: (text) => /\b(help|what can you do|capabilities|how can you help)\b/i.test(text),
    answer:
      'I can answer questions about donation basics, eligibility hints, request creation, admin approvals, donor applications, and priority scoring behavior.',
    topic: 'Bot capabilities',
    confidence: 'High'
  },
  {
    id: 'emergency',
    test: (text) => /\b(emergency|critical now|urgent now|immediate help|call ambulance)\b/i.test(text),
    answer:
      'If this is an active medical emergency, contact emergency services and hospital staff immediately. I can help with system workflow, but not live medical treatment decisions.',
    topic: 'Emergency guidance',
    confidence: 'High'
  }
];

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'can', 'do', 'does', 'for', 'from',
  'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'the', 'to',
  'what', 'when', 'where', 'who', 'why', 'with', 'you', 'your'
]);

const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stemToken = (token) => {
  if (token.length <= 4) {
    return token;
  }

  return token
    .replace(/(ingly|edly|ing|ed|ly|es|s)$/i, '')
    .trim();
};

const tokenize = (value) =>
  normalize(value)
    .split(/\s+/)
    .map((token) => stemToken(token.trim()))
    .filter((token) => token && !STOP_WORDS.has(token));

const levenshteinDistance = (a, b) => {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const fuzzyTokenMatch = (queryToken, keywordToken) => {
  if (!queryToken || !keywordToken) {
    return false;
  }

  if (queryToken === keywordToken) {
    return true;
  }

  if (Math.abs(queryToken.length - keywordToken.length) > 1) {
    return false;
  }

  return levenshteinDistance(queryToken, keywordToken) <= 1;
};

const scoreEntry = (query, entry) => {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);
  let score = 0;

  entry.keywords.forEach((keyword) => {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) {
      return;
    }

    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 4 : 3;
      return;
    }

    const keywordTokens = normalizedKeyword.split(/\s+/).filter(Boolean);
    const overlap = keywordTokens.filter((token) => tokens.includes(token)).length;
    if (overlap > 0) {
      score += overlap * 2;
      return;
    }

    const fuzzyOverlap = keywordTokens.filter((keywordToken) =>
      tokens.some((queryToken) => fuzzyTokenMatch(queryToken, keywordToken))
    ).length;
    if (fuzzyOverlap > 0) {
      score += fuzzyOverlap;
    }
  });

  const questionTokens = entry.question
    .split(/\s+/)
    .map((token) => stemToken(normalize(token)))
    .filter(Boolean);

  questionTokens.forEach((token) => {
    if (tokens.includes(token)) {
      score += 1;
      return;
    }

    if (tokens.some((queryToken) => fuzzyTokenMatch(queryToken, token))) {
      score += 0.5;
    }
  });

  return score;
};

const findIntentResponse = (query) => {
  const matchedIntent = INTENT_PATTERNS.find((intent) => intent.test(query));
  if (!matchedIntent) {
    return null;
  }

  return {
    answer: matchedIntent.answer,
    topic: matchedIntent.topic,
    confidence: matchedIntent.confidence,
    suggestions: HELPER_PROMPTS.slice(0, 3)
  };
};

const getVisibleEntries = (role) =>
  FAQ_ENTRIES.filter((entry) => entry.roles.includes('all') || entry.roles.includes(role));

const rankEntries = (query, role) => {
  const visibleEntries = getVisibleEntries(role);

  return visibleEntries
    .map((entry) => ({
      ...entry,
      score: scoreEntry(query, entry)
    }))
    .sort((left, right) => right.score - left.score);
};

const splitQueryIntoSegments = (query) => {
  const segments = query
    .split(/\?|\.|;|,|\band\b|\balso\b|\bthen\b/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);

  if (segments.length === 0) {
    return [query];
  }

  return segments.slice(0, 3);
};

const buildAnswer = (query, role) => {
  const intentResponse = findIntentResponse(query);
  if (intentResponse) {
    return intentResponse;
  }

  const querySegments = splitQueryIntoSegments(query);
  const segmentAnswers = [];

  querySegments.forEach((segment) => {
    const ranked = rankEntries(segment, role);
    const bestMatch = ranked[0];

    if (bestMatch && bestMatch.score >= 2.5) {
      segmentAnswers.push(bestMatch);
    }
  });

  if (segmentAnswers.length > 0) {
    const uniqueAnswers = [];
    segmentAnswers.forEach((entry) => {
      if (!uniqueAnswers.some((item) => item.question === entry.question)) {
        uniqueAnswers.push(entry);
      }
    });

    const topAnswers = uniqueAnswers.slice(0, 2);
    const formattedAnswer =
      topAnswers.length === 1
        ? topAnswers[0].answer
        : topAnswers
            .map((entry, index) => `${index + 1}. ${entry.answer}`)
            .join('\n');

    const averageScore = topAnswers.reduce((sum, item) => sum + item.score, 0) / topAnswers.length;

    return {
      answer: formattedAnswer,
      topic: topAnswers.map((item) => item.question).join(' + '),
      confidence: averageScore >= 6 ? 'High' : 'Medium',
      suggestions: rankEntries(query, role)
        .slice(0, 3)
        .map((entry) => entry.question)
    };
  }

  const ranked = rankEntries(query, role);
  const bestMatch = ranked[0];

  if (!bestMatch || bestMatch.score < 2) {
    return {
      answer:
        'I could not find an exact match yet. Try rephrasing your question or choose one of the suggested topics below.',
      topic: 'No exact match',
      confidence: 'Low',
      suggestions: rankEntries('donation request priority eligibility', role)
        .slice(0, 3)
        .map((entry) => entry.question)
    };
  }

  return {
    answer: bestMatch.answer,
    topic: bestMatch.question,
    confidence: bestMatch.score >= 6 ? 'High' : 'Medium',
    suggestions: ranked
      .slice(1, 4)
      .map((entry) => entry.question)
  };
};

const FaqBot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messageListRef = useRef(null);
  const messageIdRef = useRef(2);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi. Ask me about blood donation, request priorities, approvals, or how the system works.'
    }
  ]);

  const role = user?.role || 'guest';
  const promptSet = QUICK_PROMPTS[role] || QUICK_PROMPTS.all;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [isOpen, messages]);

  const submitQuestion = (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const nextMessageId = () => {
      const nextId = messageIdRef.current;
      messageIdRef.current += 1;
      return nextId;
    };

    const userMessage = {
      id: nextMessageId(),
      sender: 'user',
      text: trimmedQuestion
    };

    const response = buildAnswer(trimmedQuestion, role);
    const botMessage = {
      id: nextMessageId(),
      sender: 'bot',
      text: response.answer,
      meta: `${response.topic} · ${response.confidence} confidence`,
      suggestions: response.suggestions || []
    };

    setMessages((current) => [...current, userMessage, botMessage]);
    setInputValue('');
  };

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  const pageLabel = useMemo(() => {
    if (location.pathname.includes('admin')) {
      return 'Admin support';
    }

    if (location.pathname.includes('recipient')) {
      return 'Recipient support';
    }

    if (location.pathname.includes('donor')) {
      return 'Donor support';
    }

    return 'General support';
  }, [location.pathname]);

  if (isAuthRoute) {
    return null;
  }

  return (
    <div className={`faq-bot ${isOpen ? 'open' : ''}`}>
      {!isOpen ? (
        <button
          type="button"
          className="faq-bot-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open FAQ bot"
        >
          <span className="faq-bot-launcher-icon">?</span>
          <span className="faq-bot-launcher-text">
            <strong>FAQ Bot</strong>
            <small>{pageLabel}</small>
          </span>
        </button>
      ) : (
        <section className="faq-bot-panel" aria-label="FAQ bot">
          <header className="faq-bot-header">
            <div>
              <p className="faq-bot-kicker">24/7 help</p>
              <h3>General FAQ Bot</h3>
            </div>
            <button type="button" className="faq-bot-close" onClick={() => setIsOpen(false)} aria-label="Close FAQ bot">
              ×
            </button>
          </header>

          <p className="faq-bot-description">
            Ask a question in plain language. I will match it to the nearest blood bank guideline or workflow answer.
          </p>

          <div className="faq-bot-messages" role="log" aria-live="polite" ref={messageListRef}>
            {messages.map((message) => (
              <article key={message.id} className={`faq-bot-message ${message.sender}`}>
                <p>{message.text}</p>
                {message.meta && <span>{message.meta}</span>}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="faq-inline-suggestions">
                    {message.suggestions.map((suggestedQuestion) => (
                      <button
                        key={`${message.id}-${suggestedQuestion}`}
                        type="button"
                        className="faq-inline-suggestion-btn"
                        onClick={() => submitQuestion(suggestedQuestion)}
                      >
                        {suggestedQuestion}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="faq-bot-prompts" aria-label="Suggested questions">
            {promptSet.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="faq-prompt-btn"
                onClick={() => submitQuestion(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="faq-bot-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitQuestion(inputValue);
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask about donation, requests, or approvals..."
              aria-label="Ask the FAQ bot"
            />
            <button type="submit">Ask</button>
          </form>
        </section>
      )}
    </div>
  );
};

export default FaqBot;
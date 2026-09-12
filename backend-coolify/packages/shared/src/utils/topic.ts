import { TopicModel } from "@repo/database";

/**
 * Set of common stop words, prepositions, conjunctions, pronouns, auxiliary terms,
 * qualifiers, adverbs, numbers, and filler tokens to exclude from metadata tag extraction.
 */
const IRRELEVANT_WORDS = new Set([
  // Articles & Coordinating Conjunctions
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "nor",
  "so",
  "yet",

  // Prepositions & Spatial/Temporal Relations
  "at",
  "by",
  "from",
  "in",
  "into",
  "of",
  "off",
  "on",
  "onto",
  "out",
  "over",
  "to",
  "up",
  "with",
  "under",
  "above",
  "below",
  "about",
  "against",
  "along",
  "among",
  "around",
  "before",
  "behind",
  "between",
  "beyond",
  "during",
  "except",
  "following",
  "inside",
  "near",
  "outside",
  "since",
  "through",
  "throughout",
  "till",
  "until",
  "upon",
  "within",
  "without",
  "via",
  "forward",
  "backward",

  // Pronouns (Subject, Object, Possessive, Reflexive)
  "i",
  "me",
  "my",
  "myself",
  "we",
  "our",
  "ours",
  "ourselves",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "he",
  "him",
  "his",
  "himself",
  "she",
  "her",
  "hers",
  "herself",
  "it",
  "its",
  "itself",
  "they",
  "them",
  "their",
  "theirs",
  "themselves",
  "one",
  "ones",
  "someone",
  "somebody",
  "something",
  "anyone",
  "anybody",
  "anything",
  "everyone",
  "everybody",
  "everything",
  "noone",
  "nobody",
  "nothing",
  "none",

  // Demonstratives, Relatives & Interrogatives
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "which",
  "what",
  "whatever",
  "whoever",
  "when",
  "where",
  "why",
  "how",
  "whereby",
  "wherein",
  "whereupon",

  // Auxiliary & State Verbs (Infinitive, Present, Past, Participle)
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "ought",
  "get",
  "gets",
  "got",
  "getting",
  "gotten",
  "go",
  "goes",
  "went",
  "gone",
  "going",
  "make",
  "makes",
  "made",
  "making",
  "take",
  "takes",
  "took",
  "taking",
  "taken",
  "come",
  "comes",
  "came",
  "coming",
  "put",
  "puts",
  "putting",
  "seem",
  "seems",
  "seemed",
  "seeming",

  // Quantifiers, Determiners & Degree Modifiers
  "just",
  "like",
  "very",
  "really",
  "some",
  "any",
  "all",
  "both",
  "each",
  "every",
  "more",
  "most",
  "less",
  "least",
  "many",
  "much",
  "few",
  "fewer",
  "fewest",
  "little",
  "several",
  "lot",
  "lots",
  "own",
  "other",
  "others",
  "another",
  "such",
  "same",
  "too",
  "enough",
  "quite",
  "rather",
  "somewhat",
  "fairly",
  "pretty",
  "almost",
  "nearly",
  "mostly",
  "mainly",
  "completely",
  "partially",

  // Common Adverbs (Time, Frequency, Manner, Logic)
  "now",
  "then",
  "already",
  "still",
  "yet",
  "soon",
  "today",
  "yesterday",
  "tomorrow",
  "tonight",
  "always",
  "never",
  "sometimes",
  "often",
  "seldom",
  "rarely",
  "usually",
  "generally",
  "frequently",
  "here",
  "there",
  "everywhere",
  "anywhere",
  "nowhere",
  "somewhere",
  "away",
  "alone",
  "together",
  "maybe",
  "perhaps",
  "probably",
  "possibly",
  "definitely",
  "actually",
  "instead",
  "otherwise",
  "therefore",
  "however",
  "besides",
  "furthermore",
  "moreover",
  "meanwhile",
  "thus",
  "hence",

  // Numbers, Sequences & Ordinals (Text Representation)
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "last",
  "next",
  "previous",
  "once",
  "twice",
  "thrice",

  // Conversational Filler, Slang & Modern Contraction Tokens
  "gonna",
  "wanna",
  "gotta",
  "im",
  "ive",
  "id",
  "ill",
  "youre",
  "youve",
  "youd",
  "youll",
  "hes",
  "hed",
  "hell",
  "shes",
  "shed",
  "its",
  "dont",
  "doesnt",
  "didnt",
  "havent",
  "hasnt",
  "hadnt",
  "cant",
  "couldnt",
  "shouldnt",
  "wouldnt",
  "wont",
  "wasnt",
  "werent",
  "isnt",
  "arent",
  "hey",
  "hi",
  "hello",
  "yeah",
  "yes",
  "no",
  "okay",
  "ok",
  "pls",
  "please",
  "thx",
  "thanks",
  "lol",
  "lmao",
  "omg",
  "btw",
  "fyi",
  "bro",
  "dude",
  "guy",
  "guys",
  "thing",
  "things",
  "stuff",
  "well",
  "oh",
  "ah",
  "uh",
  "um",
  "ya",
  "yall",
  "vs",
  "versus",
]);

/**
 * Extracts up to 3 unique, randomized, relevant keyword topics from a string content sample.
 */
export const topicsExtractor = (caption?: string): string[] => {
  if (!caption || !caption.trim()) {
    return [];
  }

  // Sanitize punctuation and isolate alpha-numeric string sequences
  const cleanTokens = caption
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  // Collect all unique valid words across the entire caption string
  const validWordsSet = new Set<string>();
  for (const token of cleanTokens) {
    if (token.length > 1 && !IRRELEVANT_WORDS.has(token)) {
      validWordsSet.add(token);
    }
  }

  const uniqueCandidates = Array.from(validWordsSet);

  // Apply Durstenfeld shuffle algorithm variant for random selection distribution
  for (let i = uniqueCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = uniqueCandidates[i];
    uniqueCandidates[i] = uniqueCandidates[j];
    uniqueCandidates[j] = temp;
  }

  // Slice down to the maximum allowed metadata topics limit
  return uniqueCandidates.slice(0, 3);
};

/**
 * Extracts up to 3 topic titles from a text caption based on matching words in the Topic collection.
 * Ranks topic matches by word occurrence frequency within the caption.
 *
 * @param caption The text string to analyze for topic keyword matches.
 * @returns Array containing up to 3 matched topic titles.
 */
export const extractTopicsFromCaption = async (
  caption?: string,
): Promise<string[]> => {
  if (!caption || !caption.trim()) {
    return [];
  }

  // Sanitize text, extract clean alphanumeric words (length > 2 to ignore common stop words)
  const words = caption
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  if (words.length === 0) {
    return [];
  }

  // Count word frequencies within the caption
  const wordFrequencyMap = new Map<string, number>();
  for (const word of words) {
    wordFrequencyMap.set(word, (wordFrequencyMap.get(word) || 0) + 1);
  }

  const uniqueWords = Array.from(wordFrequencyMap.keys());

  // Escape special regex characters in extracted words for safe query construction
  const regexPatterns = uniqueWords.map(
    (word) =>
      new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
  );

  // Fetch topics from database where the title matches any of the caption words
  const matchedTopics = await TopicModel.find(
    {
      title: { $in: regexPatterns },
    },
    { title: 1 },
  )
    .lean()
    .exec();

  if (!matchedTopics || matchedTopics.length === 0) {
    return [];
  }

  // Calculate total score for each matched topic title based on caption word frequencies
  const scoredTopics = matchedTopics.map((topic) => {
    const titleLower = topic.title.toLowerCase();
    let matchScore = 0;

    for (const [word, frequency] of wordFrequencyMap.entries()) {
      if (titleLower.includes(word)) {
        matchScore += frequency;
      }
    }

    return {
      title: topic.title,
      score: matchScore,
    };
  });

  // Sort matched topics by calculated match score in descending order
  scoredTopics.sort((a, b) => b.score - a.score);

  // Pick top 3 highest scoring topic titles
  return scoredTopics.slice(0, 3).map((item) => item.title);
};

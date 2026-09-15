/**
 * Categorized social media topics for initial database seeding.
 */
export const SEED_TOPICS = [
  // Tech, Science & AI
  "Artificial Intelligence",
  "Machine Learning",
  "Software Engineering",
  "Web Development",
  "Cybersecurity",
  "Cloud Computing",
  "Data Science",
  "DevOps",
  "Science & Space",
  "UI/UX & Design",
  "Hardware & Robotics",

  // Education & Academia
  "Education & Learning",
  "Academia & Research",
  "Career & Professional Growth",

  // Business, Web3 & Finance
  "Startups & Entrepreneurship",
  "Cryptocurrency & Web3",
  "Personal Finance",
  "Venture Capital",
  "Investing & Stocks",
  "Product Management",

  // Media, Entertainment & Culture
  "Gaming & Esports",
  "Movies & Cinema",
  "Anime & Manga",
  "Pop Culture & Memes",
  "Comedy & Humor",
  "Streaming & Content Creation",
  "Podcasts",
  "Music & Performing Arts",
  "Books & Literature",
  "Visual Arts & Crafts",

  // Sports, Gaming & Betting
  "Sports & Athletics",
  "Sports Betting & Gambling",

  // Society, News & World
  "News & Current Events",
  "Politics & Governance",
  "Environment & Sustainability",
  "Law & Justice",

  // Lifestyle, Health & Community
  "Digital Nomad",
  "Fitness & Wellness",
  "Mental Health",
  "Fashion & Style",
  "Travel & Exploration",
  "Photography",
  "Food & Culinary",
  "Pets & Animals",
  "Parenting & Family",
  "Automotive & Vehicles",
  "Home & Gardening",
  "Relationships & Dating",

  // Fallback & Meta
  "General & Off-Topic",
] as const;

export type SeedTopic = (typeof SEED_TOPICS)[number];

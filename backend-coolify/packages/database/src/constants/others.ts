import { KycRequestType, KycTierType } from "../types/kyc";
import { ITopicSeedCategory } from "../types/others";

/**
 * Categorized social media topics grouped into parent categories for multi-tier user selection.
 */
export const SEED_TOPICS: readonly ITopicSeedCategory[] = [
  {
    category: "Tech & Science",
    topics: [
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
    ],
  },
  {
    category: "Business & Finance",
    topics: [
      "Startups & Entrepreneurship",
      "Cryptocurrency & Web3",
      "Personal Finance",
      "Venture Capital",
      "Investing & Stocks",
      "Product Management",
    ],
  },
  {
    category: "Entertainment & Culture",
    topics: [
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
    ],
  },
  {
    category: "Lifestyle & Community",
    topics: [
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
    ],
  },
  {
    category: "Education & Growth",
    topics: [
      "Education & Learning",
      "Academia & Research",
      "Career & Professional Growth",
    ],
  },
  {
    category: "Sports & Betting",
    topics: ["Sports & Athletics", "Betting & Gambling"],
  },
  {
    category: "Society & World",
    topics: [
      "News & Current Events",
      "Politics & Governance",
      "Environment & Sustainability",
      "Law & Justice",
    ],
  },
  {
    category: "General",
    topics: ["General & Off-Topic"],
  },
] as const;

/**
 * Flattened array containing all seed topics for database validation and indexing.
 */
export const FLAT_SEED_TOPICS = SEED_TOPICS.flatMap((item) => item.topics);
export type SeedTopic = (typeof FLAT_SEED_TOPICS)[number];

/**
 * Tier requirements mapped to each KYC request type using defined KycTierType values.
 * TIER_1: Identity | TIER_2: Address | TIER_3: Finance | TIER_4: Business
 */
export const KYC_REQUEST_TIERS = {
  AGE_CONFIRMATION: ["TIER_1"],
  VERIFIED_BADGE: ["TIER_1"],
  PUBLIC_FIGURE: ["TIER_1"],
  WALLET_AND_PAYOUT: ["TIER_1", "TIER_2", "TIER_3"],
  ENTERPRISE_SUBSCRIPTION: ["TIER_1", "TIER_2", "TIER_3", "TIER_4"],
  DOCUMENT_UPDATE: ["TIER_1", "TIER_2", "TIER_3", "TIER_4"],
} as const satisfies Record<KycRequestType, readonly KycTierType[]>;

export const KYC_REQUEST_TYPES = Object.keys(
  KYC_REQUEST_TIERS,
) as (keyof typeof KYC_REQUEST_TIERS)[];

export const KYC_REVIEW_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELED",
] as const;

/**
 * Skill Extraction Module
 * Extracts skills from resume text, profile descriptions, or uploaded documents
 * Uses NLP techniques and pattern matching
 */

// Comprehensive skill database organized by category
const SKILL_DATABASE = {
  // Technical Skills
  programming: [
    "javascript",
    "python",
    "java",
    "c++",
    "c#",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "typescript",
    "go",
    "rust",
    "scala",
    "perl",
    "r",
    "matlab",
    "sql",
    "html",
    "css",
  ],
  frameworks: [
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "django",
    "flask",
    "spring",
    "laravel",
    "rails",
    "nextjs",
    "nuxt",
    ".net",
    "flutter",
    "react native",
  ],
  databases: [
    "mongodb",
    "mysql",
    "postgresql",
    "redis",
    "elasticsearch",
    "firebase",
    "oracle",
    "sqlite",
    "cassandra",
    "dynamodb",
  ],
  cloud: [
    "aws",
    "azure",
    "google cloud",
    "gcp",
    "docker",
    "kubernetes",
    "heroku",
    "digitalocean",
    "vercel",
    "netlify",
  ],

  // Design Skills
  design: [
    "photoshop",
    "illustrator",
    "figma",
    "sketch",
    "xd",
    "indesign",
    "canva",
    "ui design",
    "ux design",
    "graphic design",
    "logo design",
    "web design",
    "motion graphics",
    "video editing",
    "animation",
    "blender",
    "3d modeling",
  ],

  // Marketing & Business
  marketing: [
    "seo",
    "sem",
    "social media marketing",
    "content marketing",
    "email marketing",
    "google ads",
    "facebook ads",
    "instagram marketing",
    "tiktok marketing",
    "influencer marketing",
    "affiliate marketing",
    "copywriting",
    "branding",
  ],

  // Local/Physical Work Skills
  manual: [
    "driving",
    "delivery",
    "cooking",
    "cleaning",
    "gardening",
    "plumbing",
    "electrical work",
    "carpentry",
    "painting",
    "masonry",
    "welding",
    "mechanic",
    "tailoring",
    "sewing",
    "embroidery",
    "handicrafts",
  ],

  // Service Industry
  service: [
    "customer service",
    "sales",
    "retail",
    "cashier",
    "hospitality",
    "bartending",
    "catering",
    "event planning",
    "waitering",
    "housekeeping",
    "reception",
    "front desk",
    "call center",
  ],

  // Education & Training
  education: [
    "tutoring",
    "teaching",
    "training",
    "coaching",
    "mentoring",
    "curriculum development",
    "lesson planning",
    "online teaching",
    "mathematics tutoring",
    "science tutoring",
    "english tutoring",
    "music teaching",
    "dance teaching",
    "sports coaching",
  ],

  // Healthcare
  healthcare: [
    "nursing",
    "caregiving",
    "first aid",
    "cpr",
    "elderly care",
    "child care",
    "babysitting",
    "patient care",
    "home health aide",
    "physical therapy assistance",
    "medical assistance",
  ],

  // Languages
  languages: [
    "english",
    "hindi",
    "spanish",
    "french",
    "german",
    "chinese",
    "japanese",
    "korean",
    "arabic",
    "portuguese",
    "russian",
    "tamil",
    "telugu",
    "kannada",
    "malayalam",
    "marathi",
    "gujarati",
    "bengali",
    "punjabi",
    "urdu",
  ],

  // Soft Skills
  soft: [
    "communication",
    "leadership",
    "teamwork",
    "problem solving",
    "time management",
    "organization",
    "attention to detail",
    "multitasking",
    "adaptability",
    "critical thinking",
    "creativity",
    "negotiation",
    "public speaking",
  ],

  // Office & Admin
  office: [
    "microsoft office",
    "excel",
    "word",
    "powerpoint",
    "data entry",
    "typing",
    "bookkeeping",
    "accounting",
    "tally",
    "quickbooks",
    "admin support",
    "virtual assistant",
    "scheduling",
    "filing",
  ],
};

// Flatten all skills for quick lookup
const ALL_SKILLS = Object.values(SKILL_DATABASE).flat();

// Common phrases that indicate skills in resume
const SKILL_INDICATORS = [
  "proficient in",
  "experienced in",
  "skilled in",
  "knowledge of",
  "expertise in",
  "familiar with",
  "worked with",
  "certified in",
  "trained in",
  "capable of",
  "able to",
  "good at",
  "excellent at",
];

/**
 * Extract skills from text using NLP pattern matching
 * @param {string} text - Resume or profile text
 * @returns {Object} - Extracted skills with confidence scores
 */
export const extractSkillsFromText = (text) => {
  if (!text || typeof text !== "string") {
    return { skills: [], categories: {}, confidence: 0 };
  }

  const normalizedText = text.toLowerCase();
  const foundSkills = new Map(); // skill -> confidence score

  // Method 1: Direct skill matching
  for (const skill of ALL_SKILLS) {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "gi");
    const matches = normalizedText.match(regex);
    if (matches) {
      const currentScore = foundSkills.get(skill) || 0;
      foundSkills.set(skill, Math.min(currentScore + matches.length * 20, 100));
    }
  }

  // Method 2: Skill indicator phrase matching
  for (const indicator of SKILL_INDICATORS) {
    const regex = new RegExp(
      `${escapeRegex(indicator)}\\s+([\\w\\s,]+?)(?:\\.|,|;|$)`,
      "gi",
    );
    let match;
    while ((match = regex.exec(normalizedText)) !== null) {
      const potentialSkills = match[1].split(/[,;]/);
      for (let ps of potentialSkills) {
        ps = ps.trim().toLowerCase();
        if (ps.length > 2 && ps.length < 50) {
          // Check if it matches or is close to a known skill
          const matchedSkill = findClosestSkill(ps);
          if (matchedSkill) {
            const currentScore = foundSkills.get(matchedSkill) || 0;
            foundSkills.set(matchedSkill, Math.min(currentScore + 30, 100));
          } else {
            // Add as a potential custom skill with lower confidence
            foundSkills.set(ps, 40);
          }
        }
      }
    }
  }

  // Method 3: Section-based extraction (Skills section in resume)
  const skillsSectionRegex =
    /(?:skills|expertise|proficiencies|competencies|technical skills|core competencies)[\s:]*([^\n]+(?:\n(?![A-Z])[^\n]+)*)/gi;
  let sectionMatch;
  while ((sectionMatch = skillsSectionRegex.exec(normalizedText)) !== null) {
    const skillsText = sectionMatch[1];
    const items = skillsText.split(/[,;•\-|\n]/);
    for (let item of items) {
      item = item.trim().toLowerCase();
      if (item.length > 2 && item.length < 50) {
        const matchedSkill = findClosestSkill(item);
        if (matchedSkill) {
          foundSkills.set(matchedSkill, 90); // High confidence from skills section
        } else if (item.length > 3) {
          foundSkills.set(item, 60); // Custom skill from skills section
        }
      }
    }
  }

  // Categorize found skills
  const categorizedSkills = {};
  for (const [category, skills] of Object.entries(SKILL_DATABASE)) {
    const found = [...foundSkills.keys()].filter((s) =>
      skills.some(
        (dbSkill) =>
          s === dbSkill || s.includes(dbSkill) || dbSkill.includes(s),
      ),
    );
    if (found.length > 0) {
      categorizedSkills[category] = found;
    }
  }

  // Sort by confidence score
  const sortedSkills = [...foundSkills.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([skill, confidence]) => ({ skill, confidence }));

  const avgConfidence =
    sortedSkills.length > 0
      ? Math.round(
          sortedSkills.reduce((sum, s) => sum + s.confidence, 0) /
            sortedSkills.length,
        )
      : 0;

  return {
    skills: sortedSkills.map((s) => s.skill),
    skillsWithConfidence: sortedSkills,
    categories: categorizedSkills,
    confidence: avgConfidence,
    totalFound: sortedSkills.length,
  };
};

/**
 * Find the closest matching skill from database
 */
const findClosestSkill = (input) => {
  const normalized = input.trim().toLowerCase();

  // Exact match
  if (ALL_SKILLS.includes(normalized)) {
    return normalized;
  }

  // Partial match
  for (const skill of ALL_SKILLS) {
    if (normalized.includes(skill) || skill.includes(normalized)) {
      return skill;
    }
  }

  // Fuzzy match using Levenshtein distance
  for (const skill of ALL_SKILLS) {
    if (levenshteinDistance(normalized, skill) <= 2) {
      return skill;
    }
  }

  return null;
};

/**
 * Escape special regex characters
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Levenshtein distance for fuzzy matching
 */
const levenshteinDistance = (str1, str2) => {
  const m = str1.length,
    n = str2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

/**
 * Suggest skills based on job category
 * @param {string} category - Job/gig category
 * @returns {Array} - Suggested skills for that category
 */
export const suggestSkillsForCategory = (category) => {
  const categoryLower = category?.toLowerCase() || "";

  const categoryMapping = {
    delivery: [
      ...SKILL_DATABASE.manual.slice(0, 3),
      ...SKILL_DATABASE.soft.slice(0, 3),
    ],
    tech: [
      ...SKILL_DATABASE.programming.slice(0, 5),
      ...SKILL_DATABASE.frameworks.slice(0, 3),
    ],
    design: [...SKILL_DATABASE.design.slice(0, 8)],
    marketing: [...SKILL_DATABASE.marketing.slice(0, 8)],
    education: [...SKILL_DATABASE.education.slice(0, 8)],
    service: [...SKILL_DATABASE.service.slice(0, 8)],
    healthcare: [...SKILL_DATABASE.healthcare.slice(0, 8)],
    office: [...SKILL_DATABASE.office.slice(0, 8)],
    manual: [...SKILL_DATABASE.manual.slice(0, 8)],
  };

  for (const [key, skills] of Object.entries(categoryMapping)) {
    if (categoryLower.includes(key)) {
      return skills;
    }
  }

  // Default: return common soft skills
  return SKILL_DATABASE.soft.slice(0, 5);
};

/**
 * Validate and clean user-input skills
 */
export const validateSkills = (skills) => {
  if (!Array.isArray(skills)) return [];

  return skills
    .map((s) => s?.toString().toLowerCase().trim())
    .filter((s) => s && s.length > 1 && s.length < 50)
    .filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates
};

/**
 * Get skill suggestions for autocomplete
 */
export const getSkillSuggestions = (partial, limit = 10) => {
  if (!partial || partial.length < 2) return [];

  const normalized = partial.toLowerCase();
  const suggestions = ALL_SKILLS.filter((skill) =>
    skill.includes(normalized),
  ).slice(0, limit);

  return suggestions;
};

// Export skill database for reference
export const getSkillCategories = () => Object.keys(SKILL_DATABASE);
export const getSkillsByCategory = (category) => SKILL_DATABASE[category] || [];

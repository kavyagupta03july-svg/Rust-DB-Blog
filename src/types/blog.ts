export type ArticleCategory =
  | 'Artificial Intelligence'
  | 'ChatGPT 6'
  | 'Machine Learning'
  | 'Rust Programming'
  | 'RustDB Database Technology'
  | 'Web Development'
  | 'CSS Animation'
  | 'Cybersecurity'
  | 'Future Technology'
  | 'Cloud Computing';

export const ALL_CATEGORIES: ArticleCategory[] = [
  'Artificial Intelligence',
  'ChatGPT 6',
  'Machine Learning',
  'Rust Programming',
  'RustDB Database Technology',
  'Web Development',
  'CSS Animation',
  'Cybersecurity',
  'Future Technology',
  'Cloud Computing',
];

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  codeSnippet?: {
    language: string;
    filename: string;
    code: string;
  };
  callout?: {
    title: string;
    body: string;
  };
}

export interface AuthorProfile {
  name: string;
  role: string;
  bio: string;
  avatarInitials: string;
  githubHandle: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  publishedAt: string;
  readingTimeMinutes: number;
  imageUrl: string;
  imageAlt: string;
  featured?: boolean;
  author: AuthorProfile;
  tags: string[];
  keyTakeaways: string[];
  sections: ArticleSection[];
  interactiveDemoType?: 'neural-routing' | 'btree-split' | 'zero-trust-handshake' | 'shader-pipeline';
}

export interface PlaygroundTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  html: string;
  css: string;
  js: string;
}

export interface CssAnimationDemo {
  id: string;
  title: string;
  category:
    | '3D Transforms'
    | 'Lighting & Glow'
    | 'Shaders & Gradients'
    | 'Surfaces'
    | 'Fluid Physics'
    | 'Particle Systems'
    | 'Micro-Interactions'
    | 'Card Mechanics'
    | 'State Indicators'
    | 'Scroll Choreography';
  summary: string;
  howItWorks: string;
  htmlCode: string;
  cssCode: string;
  jsCode?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Staff Systems Architect' | 'Reader' | 'Core Maintainer';
  token: string;
}

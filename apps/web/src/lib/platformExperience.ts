import type { PlatformThemePresetId } from '@/lib/platformTheme';

export const PLATFORM_EXPERIENCE_KEY = 'mobile_experience_config';
export const PLATFORM_EXPERIENCE_CACHE_KEY = 'katalyst-platform-experience-cache';

export interface PlatformExperienceConfig {
  copy: {
    authHeadline: string;
    authSubheadline: string;
    homeEyebrow: string;
    homeHeroTitle: string;
    homeHeroSubtitle: string;
    homePrimaryCta: string;
    homeSecondaryCta: string;
    quizzesTitle: string;
    quizzesSubtitle: string;
    learnTitle: string;
    learnSubtitle: string;
    progressTitle: string;
    progressSubtitle: string;
    premiumHeadline: string;
    premiumSubheadline: string;
    profileOfferTitle: string;
    profileOfferSubtitle: string;
    resourcesTitle: string;
    resourcesFilter: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    paywallHeadline: string;
    paywallSubtext: string;
    paywallProCta: string;
    paywallCourseCta: string;
    paywallSkipCta: string;
  };
  colors: {
    homeHeroCourseBg: string;
    premiumAccent: string;
    resourcesBackground: string;
    profileOfferAccent: string;
    heroGradientFrom: string;
    heroGradientTo: string;
    heroGradientAccent: string;
    railCardOverlay: string;
    editorialCardBackground: string;
    successAccent: string;
    dangerAccent: string;
  };
  layout: {
    homeActionsStyle: 'grid' | 'stack';
    courseCardColumns: 1 | 2;
    resourcesCardStyle: 'editorial' | 'compact';
    resourcesArticleCount: number;
    featuredCourseCount: number;
    popularCourseCount: number;
    practiceCourseCount: number;
    paywallFreeLimit: number;
  };
  widgets: {
    showHomeStats: boolean;
    showHomeActions: boolean;
    showPopularCourses: boolean;
    showFlashcards: boolean;
    showGrowthWidget: boolean;
    showTestimonials: boolean;
    showLeaderboardPreview: boolean;
    showProfileOffer: boolean;
    showLearnPlaylist: boolean;
  };
  theme: {
    platformPreset: PlatformThemePresetId;
  };
}

export const DEFAULT_PLATFORM_EXPERIENCE: PlatformExperienceConfig = {
  copy: {
    authHeadline: 'Build data and AI skills. Anytime, anywhere.',
    authSubheadline: 'Guided practice, streaks, quizzes, and editorial resources in one focused learning system.',
    homeEyebrow: 'Katalyst Growth System',
    homeHeroTitle: 'Your next skill sprint is already laid out.',
    homeHeroSubtitle: 'Pick up where you left off, revisit flashcards, and move through practice paths with a calmer, sharper interface.',
    homePrimaryCta: 'Continue learning',
    homeSecondaryCta: 'Open practice',
    quizzesTitle: 'Certification Library',
    quizzesSubtitle: 'Scrollable learning rails, richer course cards, and faster filtering across tracks.',
    learnTitle: 'Resources',
    learnSubtitle: 'Editorial-style articles, cheat sheets, and guided videos designed for deep study sessions.',
    progressTitle: 'Growth Dashboard',
    progressSubtitle: 'Track streaks, momentum, recent results, and study consistency in one place.',
    premiumHeadline: 'Upgrade into full-access learning.',
    premiumSubheadline: 'Unlock every lesson, complete quiz banks, guided projects, and deeper practice paths.',
    profileOfferTitle: 'Discount available',
    profileOfferSubtitle: 'Up to 50% off annual access for focused learners.',
    resourcesTitle: 'Featured articles',
    resourcesFilter: 'Category',
    testimonialsTitle: 'Trusted by ambitious teams',
    testimonialsSubtitle: 'Bring social proof and enterprise credibility directly into the upgrade experience.',
    paywallHeadline: "You've completed the free preview — {n} questions",
    paywallSubtext: 'Unlock all {remaining} remaining questions, deeper explanations, and the full certification path. Current score: {score}.',
    paywallProCta: 'Unlock all {total} questions',
    paywallCourseCta: 'Unlock this course for ₹{price}',
    paywallSkipCta: 'Browse other quizzes',
  },
  colors: {
    homeHeroCourseBg: '#2F3349',
    premiumAccent: '#7367F0',
    resourcesBackground: '#2F3349',
    profileOfferAccent: '#7367F0',
    heroGradientFrom: '#7367F0',
    heroGradientTo: '#9289FF',
    heroGradientAccent: '#00CFE8',
    railCardOverlay: 'rgba(47, 51, 73, 0.92)',
    editorialCardBackground: '#2F3349',
    successAccent: '#28C76F',
    dangerAccent: '#EA5455',
  },
  layout: {
    homeActionsStyle: 'grid',
    courseCardColumns: 2,
    resourcesCardStyle: 'editorial',
    resourcesArticleCount: 5,
    featuredCourseCount: 4,
    popularCourseCount: 6,
    practiceCourseCount: 6,
    paywallFreeLimit: 25,
  },
  widgets: {
    showHomeStats: true,
    showHomeActions: true,
    showPopularCourses: true,
    showFlashcards: true,
    showGrowthWidget: true,
    showTestimonials: true,
    showLeaderboardPreview: true,
    showProfileOffer: true,
    showLearnPlaylist: true,
  },
  theme: {
    platformPreset: null,
  },
};

function normalizeCount(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizePlatformExperience(value: unknown): PlatformExperienceConfig {
  const raw = (value ?? {}) as Partial<PlatformExperienceConfig>;

  return {
    copy: {
      ...DEFAULT_PLATFORM_EXPERIENCE.copy,
      ...(raw.copy ?? {}),
    },
    colors: {
      ...DEFAULT_PLATFORM_EXPERIENCE.colors,
      ...(raw.colors ?? {}),
    },
    layout: {
      ...DEFAULT_PLATFORM_EXPERIENCE.layout,
      ...(raw.layout ?? {}),
      courseCardColumns: (raw.layout?.courseCardColumns === 1 || raw.layout?.courseCardColumns === 2)
        ? raw.layout.courseCardColumns
        : DEFAULT_PLATFORM_EXPERIENCE.layout.courseCardColumns,
      homeActionsStyle: raw.layout?.homeActionsStyle === 'stack' ? 'stack' : DEFAULT_PLATFORM_EXPERIENCE.layout.homeActionsStyle,
      resourcesCardStyle: raw.layout?.resourcesCardStyle === 'compact' ? 'compact' : DEFAULT_PLATFORM_EXPERIENCE.layout.resourcesCardStyle,
      resourcesArticleCount: normalizeCount(raw.layout?.resourcesArticleCount, DEFAULT_PLATFORM_EXPERIENCE.layout.resourcesArticleCount, 1, 12),
      featuredCourseCount: normalizeCount(raw.layout?.featuredCourseCount, DEFAULT_PLATFORM_EXPERIENCE.layout.featuredCourseCount, 1, 12),
      popularCourseCount: normalizeCount(raw.layout?.popularCourseCount, DEFAULT_PLATFORM_EXPERIENCE.layout.popularCourseCount, 1, 16),
      practiceCourseCount: normalizeCount(raw.layout?.practiceCourseCount, DEFAULT_PLATFORM_EXPERIENCE.layout.practiceCourseCount, 1, 16),
      paywallFreeLimit: normalizeCount(raw.layout?.paywallFreeLimit, DEFAULT_PLATFORM_EXPERIENCE.layout.paywallFreeLimit, 5, 100),
    },
    widgets: {
      ...DEFAULT_PLATFORM_EXPERIENCE.widgets,
      ...(raw.widgets ?? {}),
    },
    theme: {
      ...DEFAULT_PLATFORM_EXPERIENCE.theme,
      ...(raw.theme ?? {}),
      platformPreset: raw.theme?.platformPreset === 'sandstone' || raw.theme?.platformPreset === 'midnight' || raw.theme?.platformPreset === 'aurora' || raw.theme?.platformPreset === 'deep-navy'
        ? raw.theme.platformPreset
        : null,
    },
  };
}

export function applyPlatformExperience(config: PlatformExperienceConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--platform-home-hero-course-bg', config.colors.homeHeroCourseBg);
  root.style.setProperty('--platform-premium-accent', config.colors.premiumAccent);
  root.style.setProperty('--platform-resources-background', config.colors.resourcesBackground);
  root.style.setProperty('--platform-profile-offer-accent', config.colors.profileOfferAccent);
  root.style.setProperty('--platform-hero-gradient-from', config.colors.heroGradientFrom);
  root.style.setProperty('--platform-hero-gradient-to', config.colors.heroGradientTo);
  root.style.setProperty('--platform-hero-gradient-accent', config.colors.heroGradientAccent);
  root.style.setProperty('--platform-rail-card-overlay', config.colors.railCardOverlay);
  root.style.setProperty('--platform-editorial-card-background', config.colors.editorialCardBackground);
  root.style.setProperty('--platform-success-accent', config.colors.successAccent);
  root.style.setProperty('--platform-danger-accent', config.colors.dangerAccent);

  try {
    localStorage.setItem(PLATFORM_EXPERIENCE_CACHE_KEY, JSON.stringify(config));
  } catch {
    // best-effort cache
  }
}

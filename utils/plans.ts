export type PlanType =
  | 'free'
  | 'starter'
  | 'standard'
  | 'pro'
  | 'enterprise100'
  | 'enterprise150'
  | 'enterprise200';

export interface PlanConfig {
  songLimit: number;
  playerLimit: number;
  landingPageLimit: number;
  allowWav: boolean;
  classicAudioSizeLimit: number;
  mixflipAudioSizeLimit: number;
  requireBranding: boolean;
  quickClipLimit: number;
  quickClipSizeLimit: number;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free: {
    songLimit: 5,
    playerLimit: 99,
    landingPageLimit: 1,
    allowWav: false,
    classicAudioSizeLimit: 25 * 1024 * 1024, // 25MB
    mixflipAudioSizeLimit: 15 * 1024 * 1024, // 15MB
    quickClipLimit: 20,
    quickClipSizeLimit: 5 * 1024 * 1024, // 5MB
    requireBranding: true
  },
  //legacy plan
  starter: {
    songLimit: 10,
    playerLimit: 99,
    landingPageLimit: 3,
    allowWav: false,
    classicAudioSizeLimit: 25 * 1024 * 1024, // 25MB
    mixflipAudioSizeLimit: 15 * 1024 * 1024, // 15MB
    requireBranding: true,
    quickClipLimit: 100,
    quickClipSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  standard: {
    songLimit: 20,
    playerLimit: 99,
    landingPageLimit: 5,
    allowWav: true,
    classicAudioSizeLimit: 100 * 1024 * 1024, // 100MB
    mixflipAudioSizeLimit: 60 * 1024 * 1024, // 60MB
    requireBranding: true,
    quickClipLimit: 100,
    quickClipSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  pro: {
    songLimit: 50,
    playerLimit: 99,
    landingPageLimit: 10,
    allowWav: true,
    classicAudioSizeLimit: 100 * 1024 * 1024, // 100MB
    mixflipAudioSizeLimit: 60 * 1024 * 1024, // 60MB
    requireBranding: false,
    quickClipLimit: 500,
    quickClipSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  enterprise100: {
    songLimit: 100,
    playerLimit: 99,
    landingPageLimit: 100,
    allowWav: true,
    classicAudioSizeLimit: 100 * 1024 * 1024, // 100MB
    mixflipAudioSizeLimit: 60 * 1024 * 1024, // 60MB
    requireBranding: false,
    quickClipLimit: 1000,
    quickClipSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  enterprise150: {
    songLimit: 150,
    playerLimit: 99,
    landingPageLimit: 150,
    allowWav: true,
    classicAudioSizeLimit: 100 * 1024 * 1024, // 100MB
    mixflipAudioSizeLimit: 60 * 1024 * 1024, // 60MB
    requireBranding: false,
    quickClipLimit: 1500,
    quickClipSizeLimit: 10 * 1024 * 1024 // 10MB
  },
  enterprise200: {
    songLimit: 200,
    playerLimit: 99,
    landingPageLimit: 200,
    allowWav: true,
    classicAudioSizeLimit: 100 * 1024 * 1024, // 100MB
    mixflipAudioSizeLimit: 60 * 1024 * 1024, // 60MB
    requireBranding: false,
    quickClipLimit: 2000,
    quickClipSizeLimit: 10 * 1024 * 1024 // 10MB
  }
};

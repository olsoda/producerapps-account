// utils/userplan.ts
// we find the user's id then look up public.subscriptions for the user's id. we then get the price_id and turn that into a plan name that we can use to check in the UI more easily
//verify if the plan is in trial/active or if it's cancelled
// each tier can have multiple prices eg a yearly and monthly price.
// there is a hierarchy of plans. eg pro > standard > starter > free. If a component says it requires standard plan, pro is ok too. If it requires starter, standard and pro are ok too. etc

// right now prod_QmHGv85UojlJtk is starter, prod_QXlPshQNp03ezH is standard, and prod_QXlPvem2zgHp65 is pro

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { PlanType, PLAN_CONFIGS, PlanConfig } from './plans';

export interface UserPlanInfo {
  plan: PlanType;
  limits: PlanConfig;
  usage: {
    songCount: number;
    playerCount: number;
    landingPageCount: number;
    quickClipCount: number;
  };
  isOverLimit: {
    songs: boolean;
    players: boolean;
    landingPages: boolean;
    quickClips: boolean;
  };
  hasAffiliateCode: boolean;
}

// Helper function to translate price ID to plan name
function translatePriceIdToPlanName(priceId: string): PlanType {
  const starterPrices = ['price_1PuiiQJ8ljJyukCc8PQMo3Le'];
  const standardPrices = [
    'price_1PggP1J8ljJyukCcAFri2TQl',
    'price_1RYzFlJ8ljJyukCcvoY8ek4L'
  ];
  const proPrices = [
    'price_1PggOWJ8ljJyukCcOC9XSSQB',
    'price_1RYzDXJ8ljJyukCcPI8ZIGm2'
  ];
  const ent100Prices = ['price_1Rfv52J8ljJyukCcYnpij05U']; // only yearly for now
  const ent150Prices = ['price_1RfvRyJ8ljJyukCcWOmJRHfk']; // only yearly for now
  const ent200Prices = ['price_1RgDnUJ8ljJyukCcuvAiPCTP']; // only yearly for now
  if (starterPrices.includes(priceId)) {
    return 'starter';
  } else if (standardPrices.includes(priceId)) {
    return 'standard';
  } else if (proPrices.includes(priceId)) {
    return 'pro';
  } else if (ent100Prices.includes(priceId)) {
    return 'enterprise100';
  } else if (ent150Prices.includes(priceId)) {
    return 'enterprise150';
  } else if (ent200Prices.includes(priceId)) {
    return 'enterprise200';
  }
  return 'free';
}

export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const supabase = createClient();

  // Get user data and subscription status
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    return createFreePlanInfo(0, 0, 0, 0, false);
  }

  // Get quick clip count
  const { count: quickClipCount } = await supabase
    .from('quick_clips')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // If user has no active subscription, return free plan
  if (!userData.has_active_subscription) {
    return createFreePlanInfo(
      userData.song_count,
      userData.player_count,
      userData.landing_page_count,
      quickClipCount || 0,
      !!userData.affiliate_program_code
    );
  }

  // Get active subscription
  const adminClient = createAdminClient();
  const { data: subscriptionData, error: subError } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created', { ascending: false })
    .limit(1)
    .single();

  console.log('subscriptionData', subscriptionData);

  if (subError || !subscriptionData || !subscriptionData.price_id) {
    return createFreePlanInfo(
      userData.song_count,
      userData.player_count,
      userData.landing_page_count,
      quickClipCount || 0,
      !!userData.affiliate_program_code
    );
  }

  const plan = translatePriceIdToPlanName(subscriptionData.price_id);
  return createPlanInfo(
    plan,
    userData.song_count,
    userData.player_count,
    userData.landing_page_count,
    quickClipCount || 0,
    !!userData.affiliate_program_code
  );
}

function createFreePlanInfo(
  songCount: number,
  playerCount: number,
  landingPageCount: number,
  quickClipCount: number,
  hasAffiliateCode: boolean
): UserPlanInfo {
  return createPlanInfo(
    'free',
    songCount,
    playerCount,
    landingPageCount,
    quickClipCount,
    hasAffiliateCode
  );
}

function createPlanInfo(
  plan: PlanType,
  songCount: number,
  playerCount: number,
  landingPageCount: number,
  quickClipCount: number,
  hasAffiliateCode: boolean
): UserPlanInfo {
  const limits = PLAN_CONFIGS[plan];

  return {
    plan,
    limits,
    usage: {
      songCount,
      playerCount,
      landingPageCount,
      quickClipCount
    },
    isOverLimit: {
      songs: songCount > limits.songLimit,
      players: playerCount > limits.playerLimit,
      landingPages: landingPageCount > limits.landingPageLimit,
      quickClips: quickClipCount > limits.quickClipLimit
    },
    hasAffiliateCode
  };
}

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getUserPlanInfo } from '@/utils/userplan';
import { PLAN_CONFIGS } from '@/utils/plans';

// Add export const dynamic = 'force-dynamic' to prevent static rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        plan: 'free',
        limits: PLAN_CONFIGS.free,
        usage: { songCount: 0, playerCount: 0, landingPageCount: 0, quickClipCount: 0 },
        isOverLimit: { songs: false, players: false, landingPages: false, quickClips: false },
        hasAffiliateCode: false
      });
    }

    const planInfo = await getUserPlanInfo(user.id);
    return NextResponse.json(planInfo);
  } catch (error) {
    console.error('Error in getCurrentUserPlan API:', error);
    return NextResponse.json({ 
      plan: 'free',
      limits: PLAN_CONFIGS.free,
      usage: { songCount: 0, playerCount: 0, landingPageCount: 0, quickClipCount: 0 },
      isOverLimit: { songs: false, players: false, landingPages: false, quickClips: false },
      hasAffiliateCode: false
    });
  }
}

// Helper function to translate price ID to plan name
function translatePriceIdToPlanName(priceId: string): string | null {
  const starterPrices = ['price_1PuiiQJ8ljJyukCc8PQMo3Le'];
  const standardPrices = ['price_1PggP1J8ljJyukCcAFri2TQl', 'price_1RYzFlJ8ljJyukCcvoY8ek4L'];
  const proPrices = ['price_1PggOWJ8ljJyukCcOC9XSSQB', 'price_1RYzDXJ8ljJyukCcPI8ZIGm2'];

  if (starterPrices.includes(priceId)) {
    return 'starter';
  } else if (standardPrices.includes(priceId)) {
    return 'standard';
  } else if (proPrices.includes(priceId)) {
    return 'pro';
  }

  return "free";
}

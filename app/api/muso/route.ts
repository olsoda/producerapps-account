// authenitcate that user is logged in and then we pull the muso profile id from the user's profile
// client-side api of muso should only be for logged in user to prevent abuse from anons

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getMusoProfileData, checkRateLimit } from '@/utils/muso';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  console.log(`[API_MUSO] REQUEST_START: ${requestId} | Timestamp: ${new Date().toISOString()}`);
  
  // Parse URL to check for profile ID parameter
  const { searchParams } = new URL(request.url);
  const profileIdParam = searchParams.get('profileId');
  
  console.log(`[API_MUSO] PARAMS: ${requestId} | ProfileId: ${profileIdParam || 'null'} | Mode: ${profileIdParam ? 'validation' : 'user-profile'}`);
  
  try {
    const supabase = createClient();
    
    const authStart = Date.now();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    const authDuration = Date.now() - authStart;

    console.log(`[API_MUSO] AUTH_CHECK: ${requestId} | Duration: ${authDuration}ms | User: ${user?.id || 'null'} | Error: ${authError ? 'yes' : 'no'}`);

    if (authError || !user) {
      const duration = Date.now() - startTime;
      console.log(`[API_MUSO] AUTH_FAILED: ${requestId} | Duration: ${duration}ms | Status: 401`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitStart = Date.now();
    const rateLimit = await checkRateLimit(user.id);
    const rateLimitDuration = Date.now() - rateLimitStart;
    
    console.log(`[API_MUSO] RATE_LIMIT: ${requestId} | Duration: ${rateLimitDuration}ms | Allowed: ${rateLimit.allowed} | Remaining: ${rateLimit.remaining}`);
    
    if (!rateLimit.allowed) {
      const duration = Date.now() - startTime;
      console.log(`[API_MUSO] RATE_LIMITED: ${requestId} | Duration: ${duration}ms | Status: 429 | Reset: ${rateLimit.resetTime}`);
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime 
      }, { status: 429 });
    }

    // Determine which profile ID to use
    let targetProfileId: string;
    
    if (profileIdParam) {
      // Validation mode - use the provided profile ID
      targetProfileId = profileIdParam;
      console.log(`[API_MUSO] VALIDATION_MODE: ${requestId} | ProfileId: ${targetProfileId}`);
    } else {
      // User profile mode - fetch user's saved profile ID
      const dbStart = Date.now();
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('muso_profile_id')
        .eq('id', user.id)
        .single();
      const dbDuration = Date.now() - dbStart;

      console.log(`[API_MUSO] DB_QUERY: ${requestId} | Duration: ${dbDuration}ms | ProfileId: ${userData?.muso_profile_id || 'null'} | Error: ${profileError ? 'yes' : 'no'}`);

      if (profileError) {
        const duration = Date.now() - startTime;
        console.log(`[API_MUSO] DB_ERROR: ${requestId} | Duration: ${duration}ms | Status: 500`);
        return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
      }

      if (!userData.muso_profile_id) {
        const duration = Date.now() - startTime;
        console.log(`[API_MUSO] NO_PROFILE: ${requestId} | Duration: ${duration}ms | Status: 404`);
        return NextResponse.json({ error: 'No Muso Profile ID configured for this user' }, { status: 404 });
      }

      targetProfileId = userData.muso_profile_id;
      console.log(`[API_MUSO] USER_PROFILE_MODE: ${requestId} | ProfileId: ${targetProfileId}`);
    }

    // Fetch Muso data for the target profile ID
    const musoDataStart = Date.now();
    const musoProfileData = await getMusoProfileData(targetProfileId);
    const musoDataDuration = Date.now() - musoDataStart;

    console.log(`[API_MUSO] MUSO_DATA: ${requestId} | Duration: ${musoDataDuration}ms | ProfileId: ${targetProfileId} | Profile: ${musoProfileData.profile?.data?.name || 'N/A'}`);

    const response = {
      ...musoProfileData,
      profileId: targetProfileId,
      isValid: true,
      profile: {
        id: musoProfileData.profile.data.id,
        name: musoProfileData.profile.data.name,
        city: musoProfileData.profile.data.city,
        country: musoProfileData.profile.data.country,
        bio: musoProfileData.profile.data.bio
      }
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[API_MUSO] SUCCESS: ${requestId} | Duration: ${totalDuration}ms | Status: 200 | Profile: ${response.profile?.data?.name || 'N/A'} | Charts: ${response.charts?.data?.length || 0}`);

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API_MUSO] ERROR: ${requestId} | Duration: ${duration}ms | Status: 500 | Error:`, error);
    
    // If this was a validation request and the profile doesn't exist, return validation error
    if (profileIdParam) {
      console.log(`[API_MUSO] VALIDATION_FAILED: ${requestId} | ProfileId: ${profileIdParam} | Duration: ${duration}ms`);
      return NextResponse.json({ 
        isValid: false, 
        error: 'Profile not found or invalid',
        profileId: profileIdParam 
      }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Edit2, X } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/template_ui/TemplateToasts/use-toast';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MUSO_URL_REGEX = /https?:\/\/credits\.muso\.ai\/profile\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

// Helper function to extract UUID from input
const extractUUID = (input: string): string => {
  // Check if it's a Muso.ai URL
  const urlMatch = input.match(MUSO_URL_REGEX);
  if (urlMatch) {
    return urlMatch[1];
  }
  // Return original input if it's not a URL
  return input;
};

interface MusoProfile {
  id: string;
  name: string;
  city: string;
  country: string;
  bio: string;
}

// Fetch user profile and muso data in one query
async function fetchUserMusoProfile() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('muso_profile_id')
    .eq('id', user.id)
    .single();

  if (dbError) {
    throw dbError;
  }

  const profileId = userData.muso_profile_id;
  
  // If no profile ID, return early
  if (!profileId) {
    return { profileId: null, profile: null };
  }

  // Fetch muso data
  try {
    const response = await fetch(`/api/muso?profileId=${encodeURIComponent(profileId)}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch muso data for profile ${profileId}`);
      return { profileId, profile: null };
    }
    
    const musoData = await response.json();
    return { profileId, profile: musoData.profile };
  } catch (error) {
    console.warn('Error fetching muso data:', error);
    return { profileId, profile: null };
  }
}

// Validate a profile ID by fetching its data
async function validateProfileId(profileId: string): Promise<MusoProfile | null> {
  try {
    const response = await fetch(`/api/muso?profileId=${encodeURIComponent(profileId)}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.profile;
  } catch (error) {
    return null;
  }
}

export default function MusoProfileForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [profileIdValue, setProfileIdValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [validationProfile, setValidationProfile] = useState<MusoProfile | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Single query to get user profile data and muso profile
  const { data: userMusoData, isLoading, error } = useQuery({
    queryKey: ['user-muso-profile'],
    queryFn: fetchUserMusoProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const currentProfileId = userMusoData?.profileId || null;
  const currentProfile = userMusoData?.profile || null;
  const hasExistingProfile = Boolean(currentProfileId);

  // Mutation for updating muso profile ID
  const updateProfileMutation = useMutation({
    mutationFn: async (newProfileId: string) => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Update the muso_profile_id in the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ muso_profile_id: newProfileId || null })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      return newProfileId;
    },
    onSuccess: (newProfileId) => {
      // Invalidate the user profile query to refetch data
      queryClient.invalidateQueries({ queryKey: ['user-muso-profile'] });

      // Show success toast
      const successMessage = newProfileId 
        ? 'Your Muso Profile ID has been verified and updated.'
        : 'Your Muso Profile ID has been removed.';
      
      toast({
        title: 'Success!',
        description: successMessage,
        variant: 'default'
      });

      // Exit edit mode and clear validation state
      setIsEditing(false);
      setValidationProfile(null);
      setValidationError(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update Muso Profile ID',
        variant: 'destructive'
      });
    }
  });

  // Initialize form state when data loads
  useEffect(() => {
    if (!isLoading && userMusoData !== undefined) {
      const profileId = currentProfileId || '';
      setProfileIdValue(profileId);
      // Start in edit mode if no existing profile
      setIsEditing(!hasExistingProfile);
    }
  }, [isLoading, currentProfileId, hasExistingProfile, userMusoData]);

  // Debounce profile validation
  useEffect(() => {
    if (!isEditing) {
      setValidationProfile(null);
      setValidationError(null);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      const trimmedValue = profileIdValue.trim();
      
      // Only validate if it's a new profile and has valid UUID format
      if (trimmedValue !== (currentProfileId || '').trim() && UUID_REGEX.test(trimmedValue)) {
        setIsValidating(true);
        setValidationError(null);
        
        try {
          const profile = await validateProfileId(trimmedValue);
          if (profile) {
            setValidationProfile(profile);
            setValidationError(null);
          } else {
            setValidationProfile(null);
            setValidationError('Profile not found or invalid');
          }
        } catch (error) {
          setValidationProfile(null);
          setValidationError('Error validating profile');
        } finally {
          setIsValidating(false);
        }
      } else {
        setValidationProfile(null);
        setValidationError(null);
        setIsValidating(false);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [profileIdValue, isEditing, currentProfileId]);

  useEffect(() => {
    // Validate UUID format if not empty
    if (profileIdValue.trim() === '') {
      setIsValid(true); // Empty is valid (allows removal)
    } else {
      setIsValid(UUID_REGEX.test(profileIdValue.trim()));
    }
  }, [profileIdValue]);

  // Check if the form has been modified
  const isModified = profileIdValue.trim() !== (currentProfileId || '').trim();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Normalize values for comparison
    const currentValue = profileIdValue.trim();
    const originalValue = (currentProfileId || '').trim();

    // Check if the new profile ID is the same as the old one
    if (currentValue === originalValue) {
      return;
    }

    // Validate format before submitting
    if (currentValue !== '' && !UUID_REGEX.test(currentValue)) {
      return;
    }

    // If we have a non-empty profile ID, ensure it's validated before submitting
    if (currentValue !== '' && currentValue !== originalValue && !validationProfile) {
      toast({
        title: 'Validation Required',
        description: 'Please wait for profile validation to complete before saving.',
        variant: 'destructive'
      });
      return;
    }

    updateProfileMutation.mutate(currentValue);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setProfileIdValue(currentProfileId || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileIdValue(currentProfileId || '');
    setValidationProfile(null);
    setValidationError(null);
  };

  // Show loading state while checking if user has a profile ID
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Muso Profile ID</h4>
        <div className="bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-900/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show database error if we can't check for profile ID
  if (error) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Muso Profile ID</h4>
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
          <p className="text-sm text-red-600">Error loading profile: {error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Display Mode - Show when not editing and has existing profile */}
      {!isEditing && hasExistingProfile && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {currentProfile?.name ? `${currentProfile.name} - Muso Profile Connected` : 'Muso Profile Connected'}
                  </p>
                  {currentProfile?.city && currentProfile?.country && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {currentProfile.city}, {currentProfile.country}
                    </p>
                  )}
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Profile ID: {currentProfileId}
                  </p>
                  <a
                    href={`https://credits.muso.ai/profile/${currentProfileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 mt-2"
                  >
                    View Muso Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode - Show when editing or no existing profile */}
      {(isEditing || !hasExistingProfile) && (
        <form id="musoProfileForm" onSubmit={handleSubmit}>
          <h4 className="text-sm font-medium mb-2">Muso Profile ID</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Your Profile ID should be a UUID format like: c63acdde-0a7b-458c-8892-2b0be8582315
          </p>
          <p className="text-sm text-muted-foreground mb-2">You can find this in the url of your Muso.AI profile page.</p>
          <p className="text-xs text-muted-foreground mb-4">
            Note: The Muso Profile you set here will be used across your entire account for all your landing pages.
          </p>
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                name="musoProfileId"
                value={profileIdValue}
                onChange={(e) => {
                  const extractedValue = extractUUID(e.target.value);
                  setProfileIdValue(extractedValue);
                }}
                placeholder="Enter your Muso.AI Profile ID or profile URL..."
                className={`flex-1 ${!isValid ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {profileIdValue && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProfileIdValue('')}
                  className="px-3"
                >
                  Clear
                </Button>
              )}
            </div>
            {!isValid && (
              <p className="text-sm text-red-500">
                Please enter a valid UUID format (e.g., c63acdde-0a7b-458c-8892-2b0be8582315)
              </p>
            )}
            
            {isValidating && profileIdValue.trim() && UUID_REGEX.test(profileIdValue.trim()) && (
              <p className="text-sm text-blue-600">
                Validating profile...
              </p>
            )}
            
            {validationProfile && (
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Profile Verified: {validationProfile.name}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {validationProfile.city}, {validationProfile.country}
                    </p>
                    <a
                      href={`https://credits.muso.ai/profile/${validationProfile.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 mt-1"
                    >
                      View Muso Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {validationError && profileIdValue.trim() && UUID_REGEX.test(profileIdValue.trim()) && (
              <p className="text-sm text-red-500">
                {validationError}
              </p>
            )}
            
            {profileIdValue.trim() === '' && currentProfileId && (
              <p className="text-sm text-orange-600">
                Profile ID will be removed when you save
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            {/* Show cancel button only if editing an existing profile */}
            {isEditing && hasExistingProfile && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                updateProfileMutation.isPending || 
                !isModified || 
                !isValid || 
                isValidating || 
                (profileIdValue.trim() !== '' && profileIdValue.trim() !== (currentProfileId || '').trim() && !validationProfile)
              }
            >
              {updateProfileMutation.isPending 
                ? (profileIdValue.trim() === '' 
                    ? 'Saving...' 
                    : 'Verifying & Saving...')
                : (profileIdValue.trim() === '' && currentProfileId 
                    ? 'Remove Profile ID' 
                    : profileIdValue.trim() === '' 
                      ? 'Save' 
                      : 'Update Muso Profile ID')
              }
            </Button>
          </div>
        </form>
      )}
    </>
  );
} 
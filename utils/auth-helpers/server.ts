'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getURL, getErrorRedirect, getStatusRedirect } from 'utils/helpers';
import { getAuthTypes } from 'utils/auth-helpers/settings';
import { createOrRetrieveCustomer } from 'utils/supabase/admin'; // Import the function
import {
  updateStripeCustomerEmail,
  updateStripeCustomerName
} from '@/utils/stripe/server'; // Import the Stripe update functions
import { stripe } from '@/utils/stripe/config';


function isValidEmail(email: string) {
  // Regular expression pattern for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function redirectToPath(path: string) {
  return redirect(path);
}

export async function SignOut(formData: FormData) {
  const pathName = String(formData.get('pathName')).trim();

  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return getErrorRedirect(
      pathName,
      'Hmm... Something went wrong.',
      'You could not be signed out.'
    );
  }

  return '/signin';
}

export async function signInWithEmail(formData: FormData) {
  const cookieStore = cookies();
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = createClient();
  let options = {
    emailRedirectTo: callbackURL,
    shouldCreateUser: true
  };

  // If allowPassword is false, do not create a new user
  const { allowPassword } = getAuthTypes();
  if (allowPassword) options.shouldCreateUser = false;
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: options
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin',
      'You could not be signed in.',
      error.message
    );
  } else if (data) {
    cookieStore.set('preferredSignInView', 'email_signin', { path: '/' });
    redirectPath = getStatusRedirect(
      '/signin',
      'Success!',
      'Please check your email for a magic link. You may now close this tab.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin',
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

export async function requestPasswordUpdate(formData: FormData) {
  const callbackURL = getURL('/auth/reset_password');

  // Get form data
  const email = String(formData.get('email')).trim();
  const turnstileToken = String(formData.get('turnstileToken')).trim();

  if (!isValidEmail(email)) {
    return getErrorRedirect(
      '/forgot-password',
      'Invalid email address.',
      'Please enter a valid email address.'
    );
  }

  // Verify Turnstile token with Cloudflare
  const verifyResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!,
        response: turnstileToken
      })
    }
  );

  const verificationResult = await verifyResponse.json();

  const supabase = createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackURL
  });

  if (error) {
    return getErrorRedirect(
      '/forgot-password',
      error.message,
      'Please try again.'
    );
  }

  return getStatusRedirect(
    '/forgot-password',
    'Check your email!',
    'If this email address is associated with an account, you will receive a password reset link in your inbox.'
  );
}

export async function signInWithPassword(formData: FormData) {
  const cookieStore = cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  const supabase = createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin',
      'Sign in failed.',
      error.message
    );
  } else if (data.user) {
    cookieStore.set('preferredSignInView', 'password_signin', { path: '/' });
    redirectPath = getStatusRedirect('/', 'Success!', 'You are now signed in.');
  } else {
    redirectPath = getErrorRedirect(
      '/signin',
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

export async function validateReferralCode(referralCode: string) {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: referralCode,
      active: true
    });

    return promotionCodes.data.length > 0;
  } catch (error) {
    console.error('Error validating referral code:', error);
    return false;
  }
}

export async function signUp(formData: FormData) {
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  const confirmPassword = String(formData.get('confirmPassword')).trim();
  const firstName = String(formData.get('firstName')).trim();
  const lastName = String(formData.get('lastName')).trim();
  const referralCode = String(formData.get('referralCode')).trim();
  const turnstileToken = String(formData.get('turnstileToken')).trim();

  // Validate email
  if (!isValidEmail(email)) {
    return getErrorRedirect(
      '/signup',
      'Invalid email address.',
      'Please enter a valid email address.'
    );
  }

  // Validate password match
  if (password !== confirmPassword) {
    return getErrorRedirect(
      '/signup',
      'Passwords do not match.',
      'Please ensure your passwords match.'
    );
  }

  // Validate referral code if provided
  if (referralCode) {
    const isValid = await validateReferralCode(referralCode);
    if (!isValid) {
      return getErrorRedirect(
        '/signup',
        'Invalid referral code.',
        'The provided referral code is not valid.'
      );
    }
  }

  // Verify Turnstile token with Cloudflare
  const verifyResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!,
        response: turnstileToken
      })
    }
  );

  const verificationResult = await verifyResponse.json();

  // Proceed with the sign-up process
  const supabase = createClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackURL,
      data: {
        first_name: firstName,
        last_name: lastName,
        referral_code: referralCode || null
      }
    }
  });

  if (error) {
    return getErrorRedirect('/signup', 'Sign up failed.', error.message);
  } else if (data.session) {
    // User is signed up and logged in
    try {
      await createOrRetrieveCustomer({
        uuid: data.user!.id,
        email: email
      });
      return getStatusRedirect('/', 'Success!', 'You are now signed in.');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      return getErrorRedirect(
        '/',
        'Signed up, but there was an error setting up your account.',
        error.message
      );
    }
  } else if (
    data.user &&
    data.user.identities &&
    data.user.identities.length === 0
  ) {
    return getErrorRedirect(
      '/signup',
      'Sign up failed.',
      'There is already an account associated with this email address. Try logging in or resetting your password.'
    );
  } else if (data.user) {
    return getStatusRedirect(
      '/signup-success-page',
      'Success!',
      'Please check your email for a confirmation link. You may now close this tab.'
    );
  } else {
    return getErrorRedirect(
      '/signup',
      'Hmm... Something went wrong.',
      'You could not be signed up.'
    );
  }
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password')).trim();
  const passwordConfirm = String(formData.get('passwordConfirm')).trim();
  let redirectPath: string;

  // Check that the password and confirmation match
  if (password !== passwordConfirm) {
    redirectPath = getErrorRedirect(
      '/reset-password',
      'Your password could not be updated.',
      'Passwords do not match.'
    );
  }

  const supabase = createClient();
  const { error, data } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/reset-password',
      'Your password could not be updated.',
      error.message
    );
  } else if (data.user) {
    redirectPath = getStatusRedirect(
      '/',
      'Success!',
      'Your password has been updated.'
    );
  } else {
    redirectPath = getErrorRedirect(
      '/reset-password',
      'Hmm... Something went wrong.',
      'Your password could not be updated.'
    );
  }

  return redirectPath;
}

export async function updateEmail(formData: FormData) {
  // Get form data
  const newEmail = String(formData.get('newEmail')).trim();

  // Check that the email is valid
  if (!isValidEmail(newEmail)) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your email could not be updated.',
      'Invalid email address.'
    );
  }

  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your email could not be updated.',
      userError.message
    );
  }

  const user = userData.user;

  if (!user || !user.email) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your email could not be updated.',
      'User not found.'
    );
  }

  // Update email in Supabase auth
  const { error: updateError } = await supabase.auth.updateUser(
    {
      email: newEmail,
      data: { email_change_pending: true }
    },
    {
      emailRedirectTo: getURL('/auth/callback?action=email_change')
    }
  );

  if (updateError) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your email could not be updated.',
      updateError.message
    );
  }

  return getStatusRedirect(
    '/dashboard/account',
    'Confirmation emails sent.',
    `You will need to confirm the update by clicking the links sent to both the old and new email addresses.`
  );
}

export async function updateName(formData: FormData) {
  // Get form data
  const firstName = String(formData.get('firstName')).trim();
  const lastName = String(formData.get('lastName')).trim();
  const fullName = `${firstName} ${lastName}`.trim();

  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your name could not be updated.',
      userError.message
    );
  }

  const user = userData.user;

  if (!user) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your name could not be updated.',
      'User not found.'
    );
  }

  // Update name in Supabase auth
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName
    }
  });

  if (updateError) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your name could not be updated.',
      updateError.message
    );
  }

  // Update name in Stripe
  try {
    await updateStripeCustomerName(user.id, fullName);
  } catch (stripeError: any) {
    return getErrorRedirect(
      '/dashboard/account',
      'Your name could not be updated in Stripe.',
      stripeError.message
    );
  }

  return getStatusRedirect(
    '/dashboard/account',
    'Success!',
    'Your name has been updated.'
  );
}



// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect, getURL } from '@/utils/helpers';
import { createOrRetrieveCustomer } from '@/utils/supabase/admin';
import { updateStripeCustomerEmail } from '@/utils/stripe/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const action = requestUrl.searchParams.get('action');

  if (code) {
    const supabase = createClient();
    const { data: authData, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      return NextResponse.redirect(
        getErrorRedirect(
          getURL('/signin'),
          authError.name,
          "Sorry, we weren't able to log you in. Please try again."
        )
      );
    }

    if (authData.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser(
        authData.session.access_token
      );

      if (userError) {
        console.error('Error retrieving user data:', userError.message);
      } else if (userData.user) {
        const { email, id: uuid, user_metadata } = userData.user;

        if (email) {
          try {
            // Always create or retrieve customer on login
            await createOrRetrieveCustomer({ email, uuid });
            console.log('Customer created or retrieved successfully');

            if (action === 'email_change') {
              if (user_metadata.email_change_pending) {
                // Remove the pending flag
                await supabase.auth.updateUser({
                  data: { email_change_pending: null }
                });

                await updateStripeCustomerEmail(uuid, email);
                console.log('Customer email updated successfully in Stripe');

                return NextResponse.redirect(
                  getStatusRedirect(
                    getURL('/dashboard/account'),
                    'Success!',
                    'Your email has been updated.'
                  )
                );
              } else {
                // First confirmation, don't show success yet
                return NextResponse.redirect(
                  getStatusRedirect(
                    getURL('/dashboard/account'),
                    'Email confirmation in progress',
                    'Please also confirm the email sent to your other address.'
                  )
                );
              }
            }
          } catch (error) {
            console.error('Error updating customer information:', error);
            return NextResponse.redirect(
              getErrorRedirect(
                getURL('/dashboard/account'),
                'Error',
                'There was an error updating your information. Please try again.'
              )
            );
          }
        } else {
          console.error('User email is undefined');
        }
      }
    }
  }

  // Default redirect for other cases
  return NextResponse.redirect(
    getStatusRedirect(
      getURL('/dashboard'),
      'Success!',
      'You are now signed in.'
    )
  );
}

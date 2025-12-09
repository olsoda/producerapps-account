// path: components/PaymentMethodManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createStripePortal, fetchPaymentMethods } from '@/utils/stripe/server';

interface CardDetails {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface PaymentMethodDetails {
  card: CardDetails;
}

const PaymentMethodManager = () => {
  const supabase = createClient();
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [paymentMethodDetails, setPaymentMethodDetails] =
    useState<PaymentMethodDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethodStatus = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('has_payment_method')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError.message);
        } else {
          setHasPaymentMethod(userData?.has_payment_method || false);

          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

          if (customerError) {
            console.error(
              'Error fetching customer data:',
              customerError.message
            );
          } else if (customerData?.stripe_customer_id) {
            try {
              const paymentMethods = await fetchPaymentMethods(
                customerData.stripe_customer_id
              );
              if (paymentMethods.length > 0) {
                const cardDetails: CardDetails = {
                  brand: paymentMethods[0].card?.brand || '',
                  last4: paymentMethods[0].card?.last4 || '',
                  exp_month: paymentMethods[0].card?.exp_month || 0,
                  exp_year: paymentMethods[0].card?.exp_year || 0
                };
                setPaymentMethodDetails({ card: cardDetails });
              }
            } catch (error) {
              console.error('Error fetching payment method details:', error);
            }
          } else {
            console.error('No Stripe customer ID found.');
          }
        }
      }

      setLoading(false);
    };

    fetchPaymentMethodStatus();
  }, []);

  const handleUpdatePaymentMethod = async () => {
    try {
      const portalUrl = await createStripePortal('/dashboard/account');
      window.location.assign(portalUrl);
    } catch (error) {
      console.error('Error creating Stripe portal:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>
        Payment method:{' '}
        {hasPaymentMethod ? (
          <>
            <span>Attached</span>
            {paymentMethodDetails && (
              <div>
                <p>Brand: {paymentMethodDetails.card.brand}</p>
                <p>Last4: {paymentMethodDetails.card.last4}</p>
                <p>
                  Expires: {paymentMethodDetails.card.exp_month}/
                  {paymentMethodDetails.card.exp_year}
                </p>
              </div>
            )}
          </>
        ) : (
          <span>Not attached</span>
        )}
      </p>
      <button onClick={handleUpdatePaymentMethod}>Update payment method</button>
    </div>
  );
};

export default PaymentMethodManager;

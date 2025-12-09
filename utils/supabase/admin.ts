// path: app/utils/supabase/admin.ts
import { toDateTime } from '@/utils/helpers';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database, Tables, TablesInsert } from 'types_db';
// import MailerLite from '@mailerlite/mailerlite-nodejs';
import { Resend } from 'resend';
import sendWelcomeEmail from '@/lib/emails/welcome';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;

// Change to control trial period length
// const TRIAL_PERIOD_DAYS = 30;

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// const mailerLite = new MailerLite({
//   api_key: process.env.MAILERLITE_API_KEY || ''
// });

const resend = new Resend(process.env.RESEND_API_KEY || '');

const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
    allow_wav: false, // Set default values or handle as needed
    audio_size_limit: 15728640,
    player_limit: null,
    require_branding: null,
    song_limit: null,
    classic_audio_size_limit: 10485760,
    quickclip_limit: 20,
    quickclip_size_limit: 5 * 1024 * 1024 // 5MB
  };

  const { error: upsertError } = await supabaseAdmin
    .from('products')
    .upsert([productData]);

  if (upsertError)
    throw new Error(`Product insert/update failed: ${upsertError.message}`);
  console.log(`Product inserted/updated: ${product.id}`);
};

const upsertPriceRecord = async (
  price: Stripe.Price,
  retryCount = 0,
  maxRetries = 3
) => {
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: 0,
    description: null,
    metadata: null
  };

  const { error: upsertError } = await supabaseAdmin
    .from('prices')
    .upsert([priceData]);

  if (upsertError?.message.includes('foreign key constraint')) {
    if (retryCount < maxRetries) {
      console.log(`Retry attempt ${retryCount + 1} for price ID: ${price.id}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await upsertPriceRecord(price, retryCount + 1, maxRetries);
    } else {
      throw new Error(
        `Price insert/update failed after ${maxRetries} retries: ${upsertError.message}`
      );
    }
  } else if (upsertError) {
    throw new Error(`Price insert/update failed: ${upsertError.message}`);
  } else {
    console.log(`Price inserted/updated: ${price.id}`);
  }
};

const deleteProductRecord = async (product: Stripe.Product) => {
  const { error: deletionError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', product.id);
  if (deletionError)
    throw new Error(`Product deletion failed: ${deletionError.message}`);
  console.log(`Product deleted: ${product.id}`);
};

const deletePriceRecord = async (price: Stripe.Price) => {
  const { error: deletionError } = await supabaseAdmin
    .from('prices')
    .delete()
    .eq('id', price.id);
  if (deletionError)
    throw new Error(`Price deletion failed: ${deletionError.message}`);
  console.log(`Price deleted: ${price.id}`);
};

const upsertCustomerToSupabase = async (uuid: string, customerId: string) => {
  const { error: upsertError } = await supabaseAdmin
    .from('customers')
    .upsert([{ id: uuid, stripe_customer_id: customerId }]);

  if (upsertError)
    throw new Error(
      `Supabase customer record creation failed: ${upsertError.message}`
    );

  return customerId;
};

const createCustomerInStripe = async (uuid: string, email: string) => {
  // Check if the customer already exists in Supabase
  const { data: existingCustomer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', uuid)
    .single();

  if (customerError && customerError.code !== 'PGRST116') {
    // Handle errors that are not 'no results' errors
    throw new Error(
      `Error fetching customer from Supabase: ${customerError.message}`
    );
  }

  if (existingCustomer) {
    // Customer already exists, return the existing Stripe customer ID
    console.log(
      `Customer already exists: ${existingCustomer.stripe_customer_id}`
    );
    return existingCustomer.stripe_customer_id;
  }

  // Fetch referral code if it exists
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('referral_code')
    .eq('id', uuid)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    // Handle errors that are not 'no results' errors
    throw new Error(`Error fetching user from Supabase: ${userError.message}`);
  }

  // Ensure user data is available
  const referralCode = user?.referral_code;

  // Fetch the promotion code ID if a referral code exists
  let promotionCodeId: string | null = null;
  if (referralCode) {
    promotionCodeId = await getPromotionCodeId(referralCode);
  }

  // Customer does not exist, create a new Stripe customer
  const customerData: Stripe.CustomerCreateParams = {
    metadata: { supabaseUUID: uuid },
    email: email
  };

  // If a promotion code ID exists, add it to the customer
  if (promotionCodeId) {
    customerData.promotion_code = promotionCodeId;
  }

  const newCustomer = await stripe.customers.create(customerData);
  if (!newCustomer) throw new Error('Stripe customer creation failed.');

  // Upsert the customer information to Supabase
  const { error: upsertError } = await supabaseAdmin
    .from('customers')
    .upsert([{ id: uuid, stripe_customer_id: newCustomer.id }]);

  if (upsertError)
    throw new Error(`Supabase customer upsert failed: ${upsertError.message}`);

  return newCustomer.id;
};

const getPromotionCodeId = async (code: string): Promise<string | null> => {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: code,
      active: true
    });

    if (promotionCodes.data.length > 0) {
      return promotionCodes.data[0].id;
    } else {
      console.warn(`Promotion code not found or inactive: ${code}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching promotion code`);
    return null;
  }
};

const createOrRetrieveCustomer = async ({
  email,
  uuid
}: {
  email: string;
  uuid: string;
}) => {
  // Check if the customer already exists in Supabase
  const { data: existingSupabaseCustomer, error: queryError } =
    await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', uuid)
      .maybeSingle();

  if (queryError) {
    throw new Error(`Supabase customer lookup failed: ${queryError.message}`);
  }

  // Retrieve the Stripe customer ID using the Supabase customer ID, with email fallback
  let stripeCustomerId: string | undefined;
  if (existingSupabaseCustomer?.stripe_customer_id) {
    const existingStripeCustomer = await stripe.customers.retrieve(
      existingSupabaseCustomer.stripe_customer_id
    );
    stripeCustomerId = existingStripeCustomer.id;
  } else {
    // If Stripe ID is missing from Supabase, try to retrieve Stripe customer ID by email
    const stripeCustomers = await stripe.customers.list({ email: email });
    stripeCustomerId =
      stripeCustomers.data.length > 0 ? stripeCustomers.data[0].id : undefined;
  }

  // If still no stripeCustomerId, create a new customer in Stripe
  const stripeIdToInsert = stripeCustomerId
    ? stripeCustomerId
    : await createCustomerInStripe(uuid, email);
  if (!stripeIdToInsert) throw new Error('Stripe customer creation failed.');

  // If we're creating a new customer or updating an existing one, add to MailerLite
  if (!stripeCustomerId) {
    // await addContactToMailerLite(email);
    await addContactToResend(email);
    await sendWelcomeEmail(email);
  }

  if (existingSupabaseCustomer && stripeCustomerId) {
    // If Supabase has a record but doesn't match Stripe, update Supabase record
    if (existingSupabaseCustomer.stripe_customer_id !== stripeCustomerId) {
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', uuid);

      if (updateError)
        throw new Error(
          `Supabase customer record update failed: ${updateError.message}`
        );
      console.warn(
        `Supabase customer record mismatched Stripe ID. Supabase record updated.`
      );
    }
    // If Supabase has a record and matches Stripe, return Stripe customer ID
    return stripeCustomerId;
  } else {
    console.warn(
      `Supabase customer record was missing. A new record was created.`
    );

    // If Supabase has no record, create a new record and return Stripe customer ID
    const upsertedStripeCustomer = await upsertCustomerToSupabase(
      uuid,
      stripeIdToInsert
    );
    if (!upsertedStripeCustomer)
      throw new Error('Supabase customer record creation failed.');

    return upsertedStripeCustomer;
  }
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  //Todo: check this assertion
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      billing_address: { ...address },
      payment_method: { ...payment_method[payment_method.type] }
    })
    .eq('id', uuid);
  if (updateError)
    throw new Error(`Customer update failed: ${updateError.message}`);
};

const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  // Get customer's UUID from the mapping table.
  const { data: customerData, error: noCustomerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (noCustomerError) {
    throw new Error(`Customer lookup failed: ${noCustomerError.message}`);
  }

  const { id: uuid } = customerData;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method']
  });

  // Upsert the latest status of the subscription object.
  const subscriptionData: TablesInsert<'subscriptions'> = {
    id: subscription.id,
    user_id: uuid,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity ?? 1,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? toDateTime(subscription.cancel_at).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? toDateTime(subscription.canceled_at).toISOString()
      : null,
    current_period_start: toDateTime(
      subscription.current_period_start
    ).toISOString(),
    current_period_end: toDateTime(
      subscription.current_period_end
    ).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at
      ? toDateTime(subscription.ended_at).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? toDateTime(subscription.trial_start).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? toDateTime(subscription.trial_end).toISOString()
      : null
  };

  const { error: upsertError } = await supabaseAdmin
    .from('subscriptions')
    .upsert([subscriptionData]);
  if (upsertError) {
    throw new Error(
      `Subscription insert/update failed: ${upsertError.message}`
    );
  }

  console.log(
    `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`
  );

  // Update the has_active_subscription field in the users table
  const hasActiveSubscription = ['active', 'trialing'].includes(
    subscription.status
  );
  console.log(
    `Updating has_active_subscription for user [${uuid}] to [${hasActiveSubscription}]`
  );

  const { error: userUpdateError } = await supabaseAdmin
    .from('users')
    .update({ has_active_subscription: hasActiveSubscription })
    .eq('id', uuid);

  if (userUpdateError) {
    throw new Error(
      `Updating user's active subscription status failed: ${userUpdateError.message}`
    );
  } else {
    console.log(
      `Updated has_active_subscription for user [${uuid}] to [${hasActiveSubscription}]`
    );
  }

  // For a new subscription, copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (createAction && subscription.default_payment_method && uuid) {
    //@ts-ignore
    await copyBillingDetailsToCustomer(
      uuid,
      subscription.default_payment_method as Stripe.PaymentMethod
    );
  }
};

//recieved from /api/webhooks/route.ts
const updateCustomerPaymentMethodStatus = async (
  customerId: string,
  hasPaymentMethod: boolean
) => {
  const { data: customerData, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (customerError) {
    throw new Error(`Customer lookup failed: ${customerError.message}`);
  }

  if (!customerData) {
    throw new Error(`Customer not found for Stripe customer ID: ${customerId}`);
  }

  const { id: uuid } = customerData;

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ has_payment_method: hasPaymentMethod })
    .eq('id', uuid);

  if (updateError) {
    throw new Error(
      `Updating user's payment method status failed: ${updateError.message}`
    );
  } else {
    console.log(
      `Updated has_payment_method for user [${uuid}] to [${hasPaymentMethod}]`
    );
  }
};
const updateCustomerDetailsInSupabase = async (customer: Stripe.Customer) => {
  const { id: stripeCustomerId, email, name } = customer;

  const { data: customerData, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (customerError) {
    throw new Error(`Customer lookup failed: ${customerError.message}`);
  }

  if (!customerData) {
    throw new Error(
      `Customer not found for Stripe customer ID: ${stripeCustomerId}`
    );
  }

  const { id: uuid } = customerData;

  // Parse full name into first and last name
  const [first_name, last_name] = name
    ? name.split(' ')
    : [undefined, undefined];

  // Update auth user
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    uuid,
    {
      email: email ?? undefined,
      user_metadata: {
        full_name: name ?? undefined,
        first_name: first_name ?? undefined,
        last_name: last_name ?? undefined
      }
    }
  );

  if (authError) {
    throw new Error(`Updating auth user details failed: ${authError.message}`);
  }

  // Update user in public.users table
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ full_name: name })
    .eq('id', uuid);

  if (updateError) {
    throw new Error(`Updating user details failed: ${updateError.message}`);
  } else {
    console.log(
      `Updated user details for user [${uuid}] with email [${email}] and name [${name}]`
    );
  }
};

// const addContactToMailerLite = async (email: string, name?: string) => {
//   try {
//     const params = { email: email, fields: { name: name || '' } };

//     const response = await mailerLite.subscribers.createOrUpdate(params);
//     console.log('Contact added to MailerLite:', response.data.data.email);
//   } catch (error) {
//     console.error('Error adding contact to MailerLite:', error);
//   }
// };
const addContactToResend = async (
  email: string,
  name?: string,
  first_name?: string,
  last_name?: string
) => {
  const params = {
    email: email,
    name: name || '',
    firstName: first_name || '',
    lastName: last_name || '',
    audienceId: process.env.RESEND_AUDIENCE_ID || ''
  };
  try {
    const response = await resend.contacts.create(params);
    console.log('Contact added to Resend:', response.data?.id);
  } catch (error) {
    console.error('Error adding contact to Resend:', error);
  }
};

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export {
  upsertProductRecord,
  upsertPriceRecord,
  deleteProductRecord,
  deletePriceRecord,
  createOrRetrieveCustomer,
  manageSubscriptionStatusChange,
  updateCustomerPaymentMethodStatus,
  updateCustomerDetailsInSupabase
};

import Pricing from '@/components/Pricing/Pricing';
import { createClient } from '@/utils/supabase/server';

export default async function SelectPlan() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error) {
    console.log(error);
  }

  const { data: products } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  return (
    <div>
      <p>poop</p>
      <p>poop2</p>
      <Pricing
        user={user}
        products={products ?? []}
        subscription={subscription}
      />{' '}
    </div>
  );
}

import { createOrRetrieveCustomer } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, uuid } = await req.json();

    if (!email || !uuid) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const customerId = await createOrRetrieveCustomer({ email, uuid });

    if (!customerId) {
      throw new Error('Failed to create or retrieve customer');
    }

    return NextResponse.json({
      success: true,
      customerId: customerId
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error creating Stripe customer'
      },
      { status: 500 }
    );
  }
}

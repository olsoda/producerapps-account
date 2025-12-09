import { NextRequest, NextResponse } from 'next/server';
import { postWebhook, generateDummyFormData } from '@/utils/webhook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, formName, formFields } = body;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Validate the webhook URL
    try {
      const urlObj = new URL(webhookUrl);
      if (urlObj.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'Webhook URLs must use HTTPS' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid webhook URL format' },
        { status: 400 }
      );
    }

    console.log(`Testing webhook: ${webhookUrl}`);

    // Generate dummy form data based on actual form fields
    const dummyFormData =
      formFields && formFields.length > 0
        ? generateDummyFormData(formFields)
        : {
            name: 'John Doe',
            email: 'john.doe@example.com',
            message:
              'This is a test webhook payload to verify your endpoint is receiving data correctly.'
          };

    // Use the abstracted webhook function
    const webhookResult = await postWebhook({
      webhookUrl,
      formData: dummyFormData,
      formName: formName || 'Test Form',
      isTest: true
    });

    if (webhookResult.success) {
      console.log(`Webhook test successful: ${webhookUrl}`, webhookResult);
      return NextResponse.json({
        success: true,
        status: webhookResult.status,
        response: webhookResult.response,
        message: 'Webhook test successful'
      });
    } else {
      console.error(`Webhook test failed: ${webhookUrl}`, webhookResult);
      return NextResponse.json(
        {
          success: false,
          status: webhookResult.status,
          error: webhookResult.error,
          response: webhookResult.response,
          message: 'Webhook test failed'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook test error:', error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Request timeout - webhook endpoint did not respond within 10 seconds',
          message: 'Webhook test failed due to timeout'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Webhook test failed'
      },
      { status: 500 }
    );
  }
}

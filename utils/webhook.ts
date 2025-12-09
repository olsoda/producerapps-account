import { createWebhookFailureEmail, sendEmail } from './email';

export interface WebhookPayload {
  event: string;
  form_name: string;
  submission_id?: string;
  submitted_at: string;
  submission_url?: string;
  page_name?: string;
  source?: string;
  test?: boolean;
  [key: string]: any; // For form data fields
}

export interface WebhookResult {
  success: boolean;
  status?: number;
  error?: string;
  response?: any;
  attempt?: {
    url: string;
    timestamp: string;
    payload_size: number;
  };
}

export interface WebhookOptions {
  webhookUrl: string;
  formData: any;
  formName: string;
  submissionId?: string;
  locationContext?: {
    url?: string;
    pageName?: string;
    source?: string;
  };
  isTest?: boolean;
  formOwnerEmail?: string;
}

/**
 * Posts a webhook with the given data
 */
export async function postWebhook({
  webhookUrl,
  formData,
  formName,
  submissionId,
  locationContext,
  isTest = false,
  formOwnerEmail
}: WebhookOptions): Promise<WebhookResult> {
  try {
    console.log(`Posting webhook to: ${webhookUrl}${isTest ? ' (TEST)' : ''}`);

    // Flatten the payload to make it Zapier-friendly
    const webhookPayload: WebhookPayload = {
      event: isTest ? 'webhook_test' : 'form_submission',
      form_name: formName,
      submitted_at: new Date().toISOString(),
      ...(isTest && { test: true }),
      // Include location context if available
      ...(locationContext && {
        submission_url: locationContext.url,
        page_name: locationContext.pageName,
        source: locationContext.source
      }),
      // Include submission ID if available
      ...(submissionId && { submission_id: submissionId }),
      // Flatten form data to top level for easier Zapier integration
      ...formData
    };

    const webhookAttempt = {
      url: webhookUrl,
      timestamp: new Date().toISOString(),
      payload_size: JSON.stringify(webhookPayload).length
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': isTest
          ? 'MixFlip-Webhook-Test/1.0'
          : 'MixFlip-Webhook/1.0',
        'X-MixFlip-Event': isTest ? 'webhook_test' : 'form_submission',
        ...(isTest && { 'X-MixFlip-Test': 'true' })
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    let responseData;
    const responseText = await response.text();
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (response.ok) {
      console.log(`Webhook posted successfully to ${webhookUrl}:`, {
        status: response.status,
        response: responseData
      });
      return {
        success: true,
        status: response.status,
        response: responseData,
        attempt: webhookAttempt
      };
    } else {
      console.error(`Webhook failed for ${webhookUrl}:`, {
        status: response.status,
        response: responseData
      });
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        response: responseData,
        attempt: webhookAttempt
      };
    }
  } catch (error) {
    console.error(`Webhook error for ${webhookUrl}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      attempt: {
        url: webhookUrl,
        timestamp: new Date().toISOString(),
        payload_size: JSON.stringify({
          event: isTest ? 'webhook_test' : 'form_submission',
          form_name: formName,
          submitted_at: new Date().toISOString(),
          ...(isTest && { test: true }),
          ...(locationContext && {
            submission_url: locationContext.url,
            page_name: locationContext.pageName,
            source: locationContext.source
          }),
          ...(submissionId && { submission_id: submissionId }),
          ...formData
        }).length
      }
    };
  }
}

/**
 * Generates dummy form data based on form fields for testing
 */
export function generateDummyFormData(fields: any[]): any {
  const dummyData: any = {};

  fields.forEach((field) => {
    if (field.kind === 'field') {
      switch (field.type) {
        case 'text':
        case 'email':
          if (field.key === 'name') {
            dummyData[field.key] = 'John Doe';
          } else if (field.key === 'email') {
            dummyData[field.key] = 'john.doe@example.com';
          } else {
            dummyData[field.key] = `Sample ${field.label || field.key}`;
          }
          break;
        case 'textarea':
          dummyData[field.key] =
            'This is a sample message for testing purposes.';
          break;
        case 'number':
          dummyData[field.key] = 42;
          break;
        case 'select':
          if (field.options && field.options.length > 0) {
            dummyData[field.key] = field.options[0];
          } else {
            dummyData[field.key] = 'Option 1';
          }
          break;
        case 'checkbox':
          dummyData[field.key] = true;
          break;
        case 'radio':
          if (field.options && field.options.length > 0) {
            dummyData[field.key] = field.options[0];
          } else {
            dummyData[field.key] = 'Option 1';
          }
          break;
        default:
          dummyData[field.key] = `Sample ${field.label || field.key}`;
      }
    }
  });

  return dummyData;
}

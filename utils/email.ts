import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
}

// Create AWS SES client
const createSESClient = () => {
  return new SESClient({
    region: 'us-west-1', // Based on your SES endpoint
    credentials: {
      accessKeyId: process.env.SES_USERNAME || '',
      secretAccessKey: process.env.SES_SECRET || ''
    }
  });
};

export const sendEmail = async (options: EmailOptions) => {
  try {
    const sesClient = createSESClient();

    const fromField = options.fromName
      ? `"${options.fromName} via ${process.env.SES_DISPLAYNAME || 'MixFlip Support'}" <${process.env.SES_EMAIL || 'support@mixflip.io'}>`
      : `"${process.env.SES_DISPLAYNAME || 'MixFlip Support'}" <${process.env.SES_EMAIL || 'support@mixflip.io'}>`;

    const command = new SendEmailCommand({
      Source: fromField,
      Destination: {
        ToAddresses: [options.to]
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8'
          },
          Text: {
            Data: options.text || options.html.replace(/<[^>]*>/g, ''),
            Charset: 'UTF-8'
          }
        }
      },
      ReplyToAddresses: [
        options.replyTo || process.env.SES_EMAIL || 'support@mixflip.io'
      ]
    });

    const result = await sesClient.send(command);
    console.log('Email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error}`);
  }
};

// Helper function to create form submission notification email
export const createFormSubmissionEmail = (
  formName: string,
  formData: any,
  submittedAt: string,
  clientName?: string,
  locationContext?: any
) => {
  const formatFormData = (data: any): string => {
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(
          ([key, value]) =>
            `<tr><td><strong>${key}:</strong></td><td>${value}</td></tr>`
        )
        .join('');
    }
    return `<tr><td colspan="2">${data}</td></tr>`;
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"> 
      <title>New Form Submission - ${formName} – </title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .timestamp { color: #6c757d; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📝 New Form Submission</h2>
          <p>You have received a new submission from your form: <strong>${formName}</strong></p>
        </div>
        
        <div class="content">
          <h3>Form Details:</h3>
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${formatFormData(formData)}
            </tbody>
          </table>
          
          <div class="timestamp">
            <p><strong>Submitted at:</strong> ${new Date(submittedAt).toLocaleString()}</p>
            ${
              locationContext
                ? `
              ${locationContext.url ? `<p><strong>Submission URL:</strong> <a href="${locationContext.url}">${locationContext.url}</a></p>` : ''}
              ${locationContext.pageName ? `<p><strong>Page Name:</strong> ${locationContext.pageName}</p>` : ''}
              ${locationContext.source ? `<p><strong>Source:</strong> ${locationContext.source}</p>` : ''}
            `
                : ''
            }
          </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6c757d;">
            This email was sent automatically by MixFlip when someone submitted your contact form.
          </p>
          <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">
            💡 <strong>Tip:</strong> You can reply directly to this email to respond to the person who submitted the form.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// Helper function to create webhook failure notification email
export const createWebhookFailureEmail = (
  formName: string,
  webhookUrl: string,
  error: string,
  statusCode?: number,
  response?: any,
  submissionId?: string,
  attemptedAt?: string
) => {
  const formatResponse = (response: any): string => {
    if (typeof response === 'string') {
      return response;
    }
    return JSON.stringify(response, null, 2);
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"> 
      <title>Webhook Delivery Failed - ${formName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .error-box { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .info-box { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .code-block { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; margin: 10px 0; }
        .timestamp { color: #6c757d; font-size: 14px; margin-top: 20px; }
        .action-box { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Webhook Delivery Failed</h2>
          <p>Your webhook for form <strong>${formName}</strong> failed to deliver successfully.</p>
        </div>
        
        <div class="content">
          <div class="error-box">
            <h3 style="margin-top: 0;">❌ Delivery Failed</h3>
            <p><strong>Error:</strong> ${error}</p>
            ${statusCode ? `<p><strong>Status Code:</strong> ${statusCode}</p>` : ''}
          </div>

          <h3>Webhook Details:</h3>
          <div class="info-box">
            <p><strong>Form Name:</strong> ${formName}</p>
            <p><strong>FAILING URL:</strong> <a href="${webhookUrl}" target="_blank">${webhookUrl}</a></p>
            ${submissionId ? `<p><strong>Submission ID:</strong> ${submissionId}</p>` : ''}
            ${attemptedAt ? `<p><strong>Attempted At:</strong> ${new Date(attemptedAt).toLocaleString()}</p>` : ''}
          </div>

          ${
            response
              ? `
          <h3>Response Details:</h3>
          <div class="code-block">
            ${formatResponse(response)}
          </div>
          `
              : ''
          }

          <div class="action-box">
            <h3 style="margin-top: 0;">🔧 What to do next:</h3>
            <ul>
              <li><strong>Check your webhook URL:</strong> 99% of the time this is the issue. Make sure the URL is correct and accessible</li>
              <li><strong>Verify your endpoint:</strong> Ensure your webhook endpoint is running and can receive POST requests. Sometimes an error on that endpoint will cause this to happen. Check the endpoint's status page, etc</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6c757d;">
            This email was sent automatically by MixFlip when a webhook delivery failed.
          </p>
          <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">
            💡 <strong>Need help?</strong> Contact our support team if you need assistance with webhook configuration.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// scripts/test-email.ts
import 'dotenv/config';
import { sendEmail, createFormSubmissionEmail } from '../utils/email';

const testEmail = process.argv[2];

if (!testEmail) {
  console.error(
    '❌ Please provide an email address.\nUsage: npx tsx scripts/test-email.ts you@example.com'
  );
  process.exit(1);
}

(async () => {
  try {
    console.log('📧 Testing email functionality...');
    console.log('📋 Using AWS region: us-west-1');
    console.log(
      '📋 Using SES username (Access Key):',
      process.env.SES_USERNAME
    );
    console.log('📋 Using SES email:', process.env.SES_EMAIL);
    console.log('📋 Using SES display name:', process.env.SES_DISPLAYNAME);
    console.log('📋 Test From field: "John Doe via MixFlip Contact Forms"');
    console.log('📋 Test reply-to address: john@example.com');

    // Test with sample form data
    const sampleFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is a test message from the contact form.'
    };

    const emailHtml = createFormSubmissionEmail(
      'Test Contact Form',
      sampleFormData,
      new Date().toISOString()
    );

    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email - Form Submission Notification',
      html: emailHtml,
      replyTo: 'john@example.com', // Test reply-to functionality
      fromName: 'John Doe' // Test from name functionality
    });

    console.log(`✅ Test email sent successfully to ${testEmail}`);
    console.log('📧 Message ID:', result.messageId);
  } catch (err) {
    console.error('❌ Failed to send test email:', err);
    process.exit(1);
  }
})();

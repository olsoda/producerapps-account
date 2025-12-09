// scripts/send-welcome.ts
import 'dotenv/config';
import sendWelcomeEmail from '../lib/emails/welcome';

const email = process.argv[2];

if (!email) {
  console.error(
    '❌ Please provide an email address.\nUsage: npx tsx scripts/send-welcome.ts you@example.com'
  );
  process.exit(1);
}

(async () => {
  try {
    await sendWelcomeEmail(email);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    process.exit(1);
  }
})();

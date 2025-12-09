// emails/WelcomeEmail.tsx
import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text
} from '@react-email/components';
import { Resend } from 'resend';

export default async function sendWelcomeEmail(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY || '');

  await resend.emails.send({
    from: 'David at MixFlip <support@resend.mixflip.io>',
    replyTo: 'support@mixflip.io',
    to: [email],
    subject: 'Welcome to MixFlip',
    react: <WelcomeEmail />
  });
}

export function WelcomeEmail() {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to MixFlip – your new secret weapon to win more clients.
      </Preview>
      <Tailwind>
        <Body className="bg-white text-black font-sans">
          <Container className="p-6 mx-auto">
            <Img
              src="https://r2.mixflip.io/websiteassets/og.png"
              alt="MixFlip"
              width={600}
              height={315}
              className="rounded-lg mx-auto mb-6 w-full h-auto"
            />

            <Heading className="text-2xl font-bold mb-2">
              Welcome to MixFlip
            </Heading>

            <Text className="mb-4">
              We're thrilled to have you on board. MixFlip is your new secret
              weapon to win more clients by showcasing the transformation you
              bring to every project. Here's a quick overview to get you
              started:
            </Text>

            <Section>
              <Text>
                • <strong>Create Songs:</strong> Upload and manage songs you
                want to showcase. Reuse them across multiple players.
              </Text>
              <Text>
                • <strong>Build Players:</strong> Let visitors switch between
                before & after versions. Tailor them for different pages.
              </Text>
              <Text>
                • <strong>Embed Anywhere:</strong> Add your players to your site
                and impress potential clients.
              </Text>
              <Text>
                • <strong>Create Landing Pages:</strong> Create landing pages
                for your songs and players to promote your work.
              </Text>
            </Section>

            <Text className="mt-4">
              Need help? Check out our{' '}
              <Link href="https://docs.mixflip.io">documentation</Link> or email
              us at{' '}
              <Link href="mailto:support@mixflip.io">support@mixflip.io</Link>.
            </Text>

            <Button
              href="https://mixflip.producerapps.com"
              className="bg-blue-500 text-white px-5 py-3 rounded mt-6"
            >
              Login to MixFlip
            </Button>

            <Text className="mt-6">– David and the MixFlip team</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

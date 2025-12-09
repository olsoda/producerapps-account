'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmailForm({
  userEmail
}: {
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModified, setIsModified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value !== userEmail) {
      setIsModified(true);
    }
    if (e.target.value === userEmail) {
      setIsModified(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);

    // Check if the new email is the same as the old email
    if (e.currentTarget.newEmail.value === userEmail) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }

    handleRequest(e, updateEmail, router);
    setIsSubmitting(false);
  };

  return (
    <Card className="flex flex-col justify-between w-full h-full">
      <div>
        <CardHeader>
          <CardTitle className="text-xl">Your Email</CardTitle>
          <CardDescription>
            Please enter the email address you want to use to login. <br />
            <br />
            We will email you at both the old and new email addresses to verify
            the change. You will need to click the links in BOTH emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form id="emailForm" onSubmit={(e) => handleSubmit(e)}>
            <div className="mb-4">
              <Input
                type="email"
                name="newEmail"
                defaultValue={userEmail ?? ''}
                placeholder="Your email"
                maxLength={64}
                className="w-full"
                onChange={(e) => {
                  handleChange(e);
                }}
              />
            </div>
          </form>
        </CardContent>
      </div>
      <CardFooter className="justify-end ">
        <Button
          type="submit"
          form="emailForm"
          disabled={isSubmitting || !isModified}
        >
          Update Email
        </Button>
      </CardFooter>
    </Card>
  );
}

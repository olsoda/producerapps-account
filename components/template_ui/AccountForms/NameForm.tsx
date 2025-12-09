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
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function NameForm({
  firstName,
  lastName
}: {
  firstName?: string;
  lastName?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState(firstName || '');
  const [lastNameValue, setLastNameValue] = useState(lastName || '');

  useEffect(() => {
    if (firstNameValue !== firstName || lastNameValue !== lastName) {
      setIsModified(true);
    } else {
      setIsModified(false);
    }
  }, [firstNameValue, lastNameValue, firstName, lastName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if the new name is the same as the old name
    if (firstNameValue === firstName && lastNameValue === lastName) {
      setIsSubmitting(false);
      return;
    }

    await handleRequest(e, updateName, router);
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Your Name</CardTitle>
        <CardDescription>Please enter your name.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="nameForm" onSubmit={handleSubmit}>
          <div className="mb-4 space-y-6">
            <Input
              type="text"
              name="firstName"
              value={firstNameValue}
              onChange={(e) => setFirstNameValue(e.target.value)}
              placeholder="First Name"
              maxLength={64}
              className="w-full mb-2"
            />
            <Input
              type="text"
              name="lastName"
              value={lastNameValue}
              onChange={(e) => setLastNameValue(e.target.value)}
              placeholder="Last Name"
              maxLength={64}
              className="w-full"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          form="nameForm"
          disabled={isSubmitting || !isModified}
        >
          Update Name
        </Button>
      </CardFooter>
    </Card>
  );
}

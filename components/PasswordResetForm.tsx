'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { handleRequest } from '@/utils/auth-helpers/client';
import { updatePassword } from '@/utils/auth-helpers/server';

interface PasswordResetFormProps {
  onSubmit?: () => void;
}

export default function PasswordResetForm({
  onSubmit
}: PasswordResetFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const validatePassword = (password: string) => {
    // Define your password criteria here
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  useEffect(() => {
    if (password && confirmPassword) {
      setIsPasswordValid(
        password === confirmPassword && validatePassword(password)
      );
    } else {
      setIsPasswordValid(false);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleRequest(e, updatePassword, router);
    setIsSubmitting(false);
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Change Password</CardTitle>
        <CardDescription>
          Please enter your new password and confirm it. <br /> <br />
          Password must be at least 8 characters long, contain at least one
          uppercase letter, one lowercase letter, one number, and one special
          character.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="passwordResetForm" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 mb-4">
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mb-2"
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              name="passwordConfirm"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="submit"
          form="passwordResetForm"
          disabled={isSubmitting || !isPasswordValid}
        >
          Reset Password
        </Button>
      </CardFooter>
    </Card>
  );
}

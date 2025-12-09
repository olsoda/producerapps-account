'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageCircle, X } from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import Image from 'next/image';

export default function SupportFormPopup() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [result, setResult] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult('Sending....');
    const formData = new FormData(event.currentTarget);

    formData.append('access_key', '04556dc7-9e7d-48d2-88bc-0c7724e19071');

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setResult("Thanks for Your Message! We'll reply to you via email!");
      setFormSubmitted(true);
    } else {
      console.error('Error', data);
      setResult(data.message);
    }
  };

  return (
    <div className="fixed z-40 rounded-md right-5 bottom-5">
      <div
        className={`fixed flex flex-col z-50 bottom-[100px] sm:top-auto right-5 left-auto max-w-md w-full bg-white shadow-2xl overflow-hidden rounded-2xl transition-all duration-300 ease-in-out transform ${
          isOpen
            ? 'visible opacity-100 translate-y-0'
            : 'invisible opacity-0 translate-y-4'
        }`}
      >
        <div className="flex flex-col p-5 space-y-3 border-b bg-gray-50">
          <div className="flex flex-row items-center space-x-2">
            <Image src="/favicon.png" width={40} height={40} alt="logo" />
            <h3 className="text-lg">How can we help?</h3>
          </div>
          <p className="text-muted-foreground">
            If you have any questions or comments please let us know! You can
            also email us at{' '}
            <a href="mailto:support@mixflip.io" className="text-primary">
              support@mixflip.io
            </a>{' '}
            or find our documentation at{' '}
            <a
              href="https://docs.mixflip.io"
              target="_blank"
              className="text-primary"
            >
              docs.mixflip.io
            </a>
            .
          </p>
        </div>
        <div className="flex-grow p-6 bg-gray-50">
          {formSubmitted ? (
            <div className="p-6 text-center border border-green-300 rounded-lg bg-green-50">
              {result}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="needs-validation" noValidate>
              <Input
                type="hidden"
                name="subject"
                value="New Submission from Web3Forms"
              />
              <Input
                type="checkbox"
                name="botcheck"
                style={{ display: 'none' }}
              />
              <input
                type="hidden"
                name="from_name"
                value={user?.user_metadata?.full_name || ''}
              />

              <div className="mb-4">
                <label
                  htmlFor="full_name"
                  className="block mb-2 text-sm text-gray-600"
                >
                  Full Name
                </label>
                <Input
                  type="text"
                  name="name"
                  id="full_name"
                  placeholder="John Doe"
                  defaultValue={user?.user_metadata?.full_name || ''}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm text-gray-600"
                >
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="you@company.com"
                  defaultValue={user?.email || ''}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="subject"
                  className="block mb-2 text-sm text-gray-600"
                >
                  Subject
                </label>
                <Input
                  type="text"
                  name="subject"
                  id="subject"
                  placeholder="Subject"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm text-gray-600"
                >
                  Your Message
                </label>
                <Textarea
                  rows={4}
                  name="message"
                  id="message"
                  placeholder="Your Message"
                  required
                  className="min-h-48"
                ></Textarea>
              </div>

              <div className="">
                <Button type="submit" className="w-full">
                  Submit
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center transition duration-300 rounded-full shadow-lg bg-primary w-14 h-14 focus:outline-none hover:bg-primary focus:bg-primary ease"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}

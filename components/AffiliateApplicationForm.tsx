'use client';
import React, { useState } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';

interface AffiliateApplicationFormProps {
  user: any;
}

export default function AffiliateApplicationForm({ user }: AffiliateApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult('');

    const formData = new FormData(event.currentTarget);
    
    // Add the web3forms access key and form metadata
    formData.append('access_key', '04556dc7-9e7d-48d2-88bc-0c7724e19071');
    formData.append('subject', 'MixFlip Affiliate Program Application');
    formData.append('from_name', user?.user_metadata?.full_name || user?.email || 'Unknown User');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult("Thank you for your application! We'll review it and get back to you within 2-3 business days via email.");
        setIsSubmitted(true);
      } else {
        console.error('Error', data);
        setResult(data.message || 'There was an error submitting your application. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setResult('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          {result}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Hidden fields for spam protection */}
      <Input
        type="checkbox"
        name="botcheck"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Personal Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="applicant_name">Full Name *</Label>
          <Input
            type="text"
            name="applicant_name"
            id="applicant_name"
            placeholder="Your full name"
            defaultValue={user?.user_metadata?.full_name || ''}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="applicant_email">Email Address *</Label>
          <Input
            type="email"
            name="applicant_email"
            id="applicant_email"
            placeholder="your@email.com"
            defaultValue={user?.email || ''}
            required
          />
        </div>
      </div>

      {/* Professional Background */}
      <div className="space-y-2">
        <Label htmlFor="professional_background">Professional Background *</Label>
        <Textarea
          name="professional_background"
          id="professional_background"
          placeholder="Describe your role in the music/audio industry..."
          rows={3}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Are you an audio engineer, music producer, mixing engineer, studio owner, etc.? What's your experience level?
        </p>
      </div>

      {/* Online Presence (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="online_presence">Website or Social Media (Optional)</Label>
        <Textarea
          name="online_presence"
          id="online_presence"
          placeholder="List any websites, social media, or online profiles you have..."
          rows={2}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Include any professional websites, social media accounts, or online portfolios (not required)
        </p>
      </div>

    

      {/* Sharing Strategy */}
      <div className="space-y-2">
        <Label htmlFor="sharing_strategy">How do you plan to share MixFlip? *</Label>
        <Textarea
          name="sharing_strategy"
          id="sharing_strategy"
          placeholder="Describe how you'd naturally share MixFlip with your network..."
          rows={4}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Will you recommend it during studio sessions, mention it to collaborators, share in audio communities?
        </p>
      </div>


      {/* Additional Information */}
      <div className="space-y-2">
        <Label htmlFor="additional_info">Additional Information</Label>
        <Textarea
          name="additional_info"
          id="additional_info"
          placeholder="Anything else you'd like us to know about your application..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Terms Agreement */}
      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            name="terms_agreement"
            id="terms_agreement"
            required
            className="mt-1"
          />
          <Label htmlFor="terms_agreement" className="text-sm leading-5">
            I agree to recommend MixFlip authentically based on my genuine experience with the platform. 
            I understand that my application will be reviewed and approval is not guaranteed.
          </Label>
        </div>
      </div>

      {/* Error/Success Message */}
      {result && !isSubmitted && (
        <Alert className={result.includes('error') ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
          <AlertDescription>
            {result}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        We typically review applications within 2-3 business days. You'll receive an email 
        with our decision and next steps if approved.
      </p>
    </form>
  );
} 
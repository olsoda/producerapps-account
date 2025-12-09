# ContactFormRenderer Component

A highly reusable contact form component that can be embedded in various contexts throughout your application.

## Features

- **Built-in Validation**: Required fields, email format, number ranges
- **Custom Validation**: Support for custom validation logic
- **Bot Protection**: Optional Turnstile integration
- **Error Handling**: Comprehensive error display and management
- **Accessibility**: ARIA attributes and keyboard navigation
- **Responsive**: Works on all screen sizes
- **Flexible**: Can be used with or without submit button
- **Built-in Submission**: Automatic submission to `/api/contact-form-submissions` endpoint
- **Standalone Mode**: Full-page form with success messages and redirects

## Basic Usage

```tsx
import ContactFormRenderer from '@/components/ContactFormRenderer';

// Basic form in a landing page
<ContactFormRenderer
  form={contactFormData}
  onSubmit={handleFormSubmit}
  submitButtonText="Send Message"
/>;
```

## Props

| Prop                      | Type                       | Default                                                 | Description                                    |
| ------------------------- | -------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `form`                    | `ContactFormData`          | **Required**                                            | The form configuration and fields              |
| `onSubmit`                | `(data) => Promise<void>`  | -                                                       | Function to handle form submission             |
| `onSuccess`               | `(data) => void`           | -                                                       | Callback when form submits successfully        |
| `onError`                 | `(error: Error) => void`   | -                                                       | Callback when form submission fails            |
| `submitButtonText`        | `string`                   | `'Submit'`                                              | Text for the submit button                     |
| `className`               | `string`                   | `''`                                                    | Additional CSS classes                         |
| `showLabels`              | `boolean`                  | `true`                                                  | Whether to show field labels                   |
| `showSubmitButton`        | `boolean`                  | `true`                                                  | Whether to show the submit button              |
| `requireTurnstile`        | `boolean`                  | `false`                                                 | Whether to require Turnstile verification      |
| `turnstileSiteKey`        | `string`                   | `process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Turnstile site key                             |
| `redirectUrl`             | `string`                   | -                                                       | URL to redirect to after successful submission |
| `customValidation`        | `(data) => string \| null` | -                                                       | Custom validation function                     |
| `enableBuiltInSubmission` | `boolean`                  | `false`                                                 | Use built-in submission handling               |
| `showSuccessMessage`      | `boolean`                  | `true`                                                  | Show success message after submission          |
| `standalone`              | `boolean`                  | `false`                                                 | Render as full-page standalone form            |

## Usage Examples

### 1. Landing Page Form

```tsx
// In a landing page component
<ContactFormRenderer
  form={landingPageContactForm}
  onSubmit={async (data) => {
    // Submit to your API
    await fetch('/api/contact-form', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }}
  submitButtonText="Get Started"
  className="max-w-2xl mx-auto"
/>
```

### 2. Modal Form with Turnstile

```tsx
// In a modal component
<ContactFormRenderer
  form={modalContactForm}
  onSubmit={handleModalFormSubmit}
  requireTurnstile={true}
  submitButtonText="Submit Request"
  onSuccess={(data) => {
    // Close modal, show success message, etc.
    closeModal();
    showSuccessToast();
  }}
/>
```

### 3. Custom Validation

```tsx
<ContactFormRenderer
  form={contactForm}
  onSubmit={handleSubmit}
  customValidation={(data) => {
    // Custom phone validation
    if (data.phone && !/^\d{10}$/.test(data.phone)) {
      return 'Phone number must be exactly 10 digits';
    }

    // Custom business logic
    if (data.budget && data.budget < 1000) {
      return 'Budget must be at least $1,000';
    }

    return null; // No errors
  }}
/>
```

### 4. Without Submit Button (Custom Handling)

```tsx
// When you want to handle submission differently
<ContactFormRenderer
  form={contactForm}
  showSubmitButton={false}
  className="space-y-4"
/>;

{
  /* Custom submit button elsewhere */
}
<Button onClick={handleCustomSubmit} className="w-full">
  Custom Submit Action
</Button>;
```

### 5. With Redirect After Success

```tsx
<ContactFormRenderer
  form={contactForm}
  onSubmit={handleSubmit}
  redirectUrl="/thank-you"
  submitButtonText="Submit & Continue"
/>
```

### 6. Built-in Submission Handling

```tsx
// Use the built-in submission to /api/contact-form-submissions
<ContactFormRenderer
  form={contactForm}
  enableBuiltInSubmission={true}
  submitButtonText="Send Message"
  requireTurnstile={true}
/>
```

### 7. Standalone Form with Full UI

```tsx
// Render as a complete standalone page with success messages
<ContactFormRenderer
  form={contactForm}
  enableBuiltInSubmission={true}
  standalone={true}
  submitButtonText="Submit Form"
/>
```

## Form Field Types

The component supports these field types:

- `text` - Single line text input
- `email` - Email input with validation
- `textarea` - Multi-line text input
- `number` - Number input with min/max validation
- `select` - Dropdown selection
- `checkbox` - Multiple choice checkboxes
- `radio` - Single choice radio buttons
- `section` - Section headers (non-input)

## Error Handling

The component provides comprehensive error handling:

- **Field-level errors**: Displayed below each field
- **Form-level errors**: Shown in toast notifications
- **Custom error callbacks**: For advanced error handling
- **Accessibility**: Errors are properly associated with fields

## Accessibility Features

- ARIA attributes for form validation
- Proper error associations
- Keyboard navigation support
- Screen reader friendly error messages
- Focus management

## Styling

The component uses Tailwind CSS classes and can be customized with:

- `className` prop for additional styles
- CSS custom properties for theming
- Responsive design built-in
- Consistent with your design system

## Integration with Landing Pages

When using in landing pages, you can:

1. **Pass form data** from your landing page configuration
2. **Use built-in submission** with `enableBuiltInSubmission={true}` for automatic handling
3. **Customize styling** to match your landing page design
4. **Add redirects** to thank you pages or other actions using the form's `redirect_link` field
5. **Integrate with analytics** through the success/error callbacks
6. **Enable Turnstile protection** with `requireTurnstile={true}` for spam prevention

## Best Practices

1. **Use built-in submission** with `enableBuiltInSubmission={true}` for standard contact forms
2. **Provide custom `onSubmit`** only when you need custom submission logic
3. **Use `requireTurnstile={true}`** for public-facing forms
4. **Implement proper error handling** in your submission logic
5. **Test accessibility** with screen readers
6. **Validate on the server** as well as client-side
7. **Use meaningful field labels** and help text
8. **Consider mobile UX** when designing forms
9. **Use `standalone={true}`** for full-page forms with built-in success handling

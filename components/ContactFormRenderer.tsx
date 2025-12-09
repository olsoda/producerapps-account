'use client';

import { Tables } from '@/types_db';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useMemo, useState } from 'react';

type FieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio';

type FormField = {
  id?: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  options?: string[];
  width?: 'full' | 'half';
  kind?: 'field' | 'section';
};

type FieldsState = {
  fields: FormField[];
};

interface ContactFormRendererProps {
  page: Tables<'pages'>;
  player: Tables<'players'>;
  pageContactForm: Tables<'page_contact_forms'>;
  contactForm: Tables<'contact_forms'>;
  previewShowSuccess?: boolean;
}

export default function ContactFormRenderer({
  page,
  player,
  pageContactForm,
  contactForm,
  previewShowSuccess
}: ContactFormRendererProps) {
  const parsedFields: FieldsState = (contactForm?.fields as any) || {
    fields: []
  };

  // Local state for field values, submission, captcha, and UI feedback
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [honeypot, setHoneypot] = useState<string>(''); // "website" anti-bot field
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Compute missing required fields and error messages
  const requiredErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const field of parsedFields.fields || []) {
      if (field.kind === 'section' || !field.required) continue;
      const value = fieldValues[field.key];
      if (field.type === 'checkbox') {
        if (!Array.isArray(value) || value.length === 0) {
          errors[field.key] = `${field.label} is required`;
        }
      } else if (typeof value !== 'string' || value.trim() === '') {
        errors[field.key] = `${field.label} is required`;
      }
    }
    return errors;
  }, [parsedFields.fields, fieldValues]);

  const hasMissingRequired = useMemo(
    () => Object.keys(requiredErrors).length > 0,
    [requiredErrors]
  );

  const markTouched = (key: string) =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  // Initialize field values once based on the configured fields
  useEffect(() => {
    setFieldValues((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const initial: Record<string, any> = {};
      (parsedFields.fields || []).forEach((field) => {
        if (field.kind === 'section') return;
        if (field.type === 'checkbox') initial[field.key] = [];
        else initial[field.key] = '';
      });
      return initial;
    });
  }, [parsedFields.fields]);

  // Fallback helpers
  const accentColor =
    page.accent_color_override || player.accent_color || '#2462EB';

  const formBackground =
    pageContactForm?.background_color || player.background_color || '#ffffff';

  const formTextColor = page.text_color || player.text_color || '#111111';

  const buttonBg =
    pageContactForm?.button_background_color ||
    page.accent_color_override ||
    player.accent_color ||
    '#2462EB';

  const buttonText = pageContactForm?.button_text_color || '#ffffff';

  const buttonHoverBg =
    pageContactForm?.button_hover_background_color ||
    pageContactForm?.button_background_color ||
    page.accent_color_override ||
    player.accent_color ||
    buttonBg;

  const borderColor =
    pageContactForm?.border_color ||
    player.player_border_color ||
    player.foreground_neutral ||
    'rgba(0,0,0,0.1)';

  const inputBg =
    pageContactForm?.input_background_color ||
    player.foreground_neutral ||
    '#ffffff';

  const inputText = pageContactForm?.input_text_color || formTextColor;

  const inputBorder =
    pageContactForm?.input_border_color ||
    player.player_border_color ||
    player.foreground_neutral ||
    '#dddddd';

  const inputFocusBorder =
    pageContactForm?.input_focus_border_color ||
    page.accent_color_override ||
    player.accent_color ||
    inputBorder;

  // Container paddings and radii
  const containerPadding = pageContactForm?.padding || '1rem';
  const containerBorderRadius = pageContactForm?.border_radius || '0.5rem';

  // Title/description
  const showTitle = pageContactForm?.show_title ?? true;
  const showDescription = pageContactForm?.show_description ?? true;
  const titleText = pageContactForm?.title_custom_text || 'Contact Us';
  const descriptionText =
    pageContactForm?.description_custom_text ||
    'Send us a message and we will get back to you as soon as possible.';
  const titleColor = pageContactForm?.title_color || formTextColor;
  const titleSize = pageContactForm?.title_size || '1rem';
  const descriptionColor = pageContactForm?.description_color || formTextColor;
  const descriptionSize = pageContactForm?.description_size || '0.875rem';

  // Label styles
  const labelColor = pageContactForm?.label_color || formTextColor;
  const labelFontSize = pageContactForm?.label_font_size || '0.75rem';
  const labelFontWeight = pageContactForm?.label_font_weight || '600';

  // Input layout
  const inputPadding = pageContactForm?.input_padding || '0.5rem 0.75rem';
  const inputBorderRadius = pageContactForm?.input_border_radius || '0.375rem';
  const placeholderTextColor =
    pageContactForm?.placeholder_text_color || '#9ca3af';

  // Button layout
  const buttonPadding = pageContactForm?.button_padding || '0.75rem 1rem';
  const buttonBorderColor = pageContactForm?.button_border_color || borderColor;
  const buttonBorderRadius =
    pageContactForm?.button_border_radius || '0.375rem';
  const buttonBorderWidth = pageContactForm?.button_border_width || '1px';
  const buttonFontSize = pageContactForm?.button_font_size || '1rem';
  const buttonFontWeight = pageContactForm?.button_font_weight || '400';

  // Local preview toggle passed by editor
  const showSuccessMessage = submittedSuccess || previewShowSuccess === true;
  const successTitleColor = pageContactForm?.success_title_color || titleColor;
  const successTextColor = pageContactForm?.success_text_color || formTextColor;
  const successBackgroundColor =
    pageContactForm?.success_background_color || formBackground;
  const successBorderColor =
    pageContactForm?.success_border_color || borderColor;
  const successButtonBg =
    pageContactForm?.success_button_background_color || buttonBg;
  const successButtonHoverBg =
    pageContactForm?.success_button_hover_background_color || buttonHoverBg;
  const successButtonText =
    pageContactForm?.success_button_text_color || buttonText;
  const successMessage =
    ((contactForm as any)?.success_message as string) ||
    'Thanks! Your submission was received.';

  // Handlers for updating field values
  const handleTextChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    markTouched(key);
  };

  const handleCheckboxChange = (
    key: string,
    option: string,
    checked: boolean
  ) => {
    setFieldValues((prev) => {
      const current: string[] = Array.isArray(prev[key]) ? prev[key] : [];
      const next = checked
        ? Array.from(new Set([...current, option]))
        : current.filter((v) => v !== option);
      return { ...prev, [key]: next };
    });
    markTouched(key);
  };

  const handleRadioChange = (key: string, option: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: option }));
    markTouched(key);
  };

  // Client-side validation for required fields
  const validateRequired = (): string | null => {
    for (const field of parsedFields.fields || []) {
      if (field.kind === 'section' || !field.required) continue;
      const value = fieldValues[field.key];
      if (field.type === 'checkbox') {
        if (!Array.isArray(value) || value.length === 0) {
          return `${field.label} is required`;
        }
      } else if (typeof value !== 'string' || value.trim() === '') {
        return `${field.label} is required`;
      }
    }
    return null;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    // Basic validation
    const requiredError = validateRequired();
    if (requiredError) {
      setErrorMessage(requiredError);
      setIsSubmitting(false);
      return;
    }

    // Ensure CAPTCHA token exists
    if (!turnstileToken) {
      setErrorMessage('Please complete the security check.');
      setIsSubmitting(false);
      return;
    }

    try {
      const locationContext = {
        href: typeof window !== 'undefined' ? window.location.href : undefined,
        pathname:
          typeof window !== 'undefined' ? window.location.pathname : undefined,
        search:
          typeof window !== 'undefined' ? window.location.search : undefined,
        referrer:
          typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        language:
          typeof navigator !== 'undefined' ? navigator.language : undefined,
        timezone:
          typeof Intl !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : undefined,
        pageId: page?.id,
        playerId: player?.id
      };

      const response = await fetch('/api/contact-form-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: (contactForm as any)?.id,
          formData: { ...fieldValues, website: honeypot },
          submittedAt: new Date().toISOString(),
          turnstileToken,
          locationContext
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to submit form');
      }

      setSubmittedSuccess(true);
      setFieldValues({});
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formId = `contact-form-${contactForm.id}`;

  // Create dynamic CSS for placeholder styling
  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (typeof document !== 'undefined') {
      const styleId = `placeholder-style-${formId}`;
      let existingStyle = document.getElementById(styleId);

      if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = styleId;
        document.head.appendChild(existingStyle);
      }

      existingStyle.textContent = `
        #${formId} input::placeholder,
        #${formId} textarea::placeholder {
          color: ${placeholderTextColor} !important;
        }
        #${formId} select option[value=""] {
          color: ${placeholderTextColor} !important;
        }
      `;
    }
  }, [formId, placeholderTextColor]);

  return (
    <form id={formId} className="w-full" onSubmit={handleSubmit}>
      <div
        className="w-full border"
        style={{
          backgroundColor: showSuccessMessage
            ? (successBackgroundColor as string)
            : (formBackground as string),
          color: showSuccessMessage
            ? (successTextColor as string)
            : (formTextColor as string),
          borderColor: showSuccessMessage
            ? (successBorderColor as string)
            : (borderColor as string),
          padding: containerPadding,
          borderRadius: containerBorderRadius
        }}
      >
        {!showSuccessMessage && (showTitle || showDescription) && (
          <div className="space-y-2 mb-4">
            {showTitle && (
              <h2
                style={{
                  color: titleColor,
                  fontSize: titleSize,
                  fontWeight: 700
                }}
              >
                {contactForm.custom_title || 'Contact Us'}
              </h2>
            )}
            {showDescription && (
              <p
                style={{
                  color: descriptionColor,
                  fontSize: descriptionSize
                }}
              >
                {contactForm.custom_description ||
                  'Send us a message and we will get back to you as soon as possible.'}
              </p>
            )}
          </div>
        )}
        {!showSuccessMessage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(parsedFields.fields || []).map((field) => {
              if (field.kind === 'section') {
                return (
                  <div key={field.key} className="sm:col-span-2 space-y-2">
                    <h3 className="text-lg font-semibold">{field.label}</h3>
                    {field.helpText ? (
                      <p className="text-sm opacity-80">{field.helpText}</p>
                    ) : null}
                  </div>
                );
              }

              const colSpan =
                (field.width || 'full') === 'full'
                  ? 'sm:col-span-2'
                  : 'sm:col-span-1';
              const showError =
                !!touched[field.key] && !!requiredErrors[field.key];

              return (
                <div key={field.key} className={colSpan}>
                  <div className="space-y-2">
                    <Label
                      className="text-sm font-medium"
                      style={{
                        color: labelColor,
                        fontSize: labelFontSize,
                        fontWeight: labelFontWeight as any
                      }}
                    >
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-600">*</span>
                      )}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        placeholder={field.placeholder || ''}
                        style={{
                          backgroundColor: inputBg,
                          color: inputText,
                          borderColor: showError
                            ? '#dc2626'
                            : (inputBorder as string),
                          padding: inputPadding,
                          borderRadius: inputBorderRadius
                        }}
                        value={(fieldValues[field.key] as string) || ''}
                        onChange={(e) =>
                          handleTextChange(field.key, e.target.value)
                        }
                        required={!!field.required}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            inputFocusBorder as string;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            inputBorder as string;
                          markTouched(field.key);
                        }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="w-full border"
                        style={{
                          backgroundColor: inputBg,
                          color: inputText,
                          borderColor: showError
                            ? '#dc2626'
                            : (inputBorder as string),
                          padding: inputPadding,
                          borderRadius: inputBorderRadius
                        }}
                        value={(fieldValues[field.key] as string) || ''}
                        onChange={(e) =>
                          handleTextChange(field.key, e.target.value)
                        }
                        required={!!field.required}
                        onFocus={(e) => {
                          (
                            e.currentTarget as HTMLSelectElement
                          ).style.borderColor = inputFocusBorder as string;
                        }}
                        onBlur={(e) => {
                          (
                            e.currentTarget as HTMLSelectElement
                          ).style.borderColor = inputBorder as string;
                          markTouched(field.key);
                        }}
                      >
                        <option value="">
                          {field.placeholder || 'Select an option'}
                        </option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(fieldValues[field.key]) &&
                                (fieldValues[field.key] as string[]).includes(
                                  opt
                                )
                              }
                              onChange={(e) =>
                                handleCheckboxChange(
                                  field.key,
                                  opt,
                                  e.target.checked
                                )
                              }
                              onBlur={() => markTouched(field.key)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="radio"
                              name={field.key}
                              checked={fieldValues[field.key] === opt}
                              onChange={() => handleRadioChange(field.key, opt)}
                              required={
                                !!field.required &&
                                (!fieldValues[field.key] ||
                                  fieldValues[field.key] === '')
                              }
                              onBlur={() => markTouched(field.key)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type={
                          field.type === 'email'
                            ? 'email'
                            : field.type === 'number'
                              ? 'number'
                              : 'text'
                        }
                        placeholder={field.placeholder || ''}
                        style={{
                          backgroundColor: inputBg,
                          color: inputText,
                          borderColor: showError
                            ? '#dc2626'
                            : (inputBorder as string),
                          padding: inputPadding,
                          borderRadius: inputBorderRadius
                        }}
                        value={(fieldValues[field.key] as string) || ''}
                        onChange={(e) =>
                          handleTextChange(field.key, e.target.value)
                        }
                        required={!!field.required}
                        min={field.type === 'number' ? field.min : undefined}
                        max={field.type === 'number' ? field.max : undefined}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor =
                            inputFocusBorder as string;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor =
                            inputBorder as string;
                          markTouched(field.key);
                        }}
                      />
                    )}
                    {showError ? (
                      <p className="text-xs text-red-600">
                        {requiredErrors[field.key]}
                      </p>
                    ) : null}
                    {field.helpText ? (
                      <p className="text-xs opacity-80">{field.helpText}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit button (non-functional for now) */}
        {!showSuccessMessage && (
          <div className="mt-6">
            {/* Honeypot field - keep visually hidden */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
            />

            {/* Invisible Turnstile CAPTCHA */}
            <div className="hidden">
              <Turnstile
                siteKey={
                  process.env
                    .NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY as string
                }
                onSuccess={(token) => setTurnstileToken(token)}
                options={{ size: 'invisible' }}
              />
            </div>

            <button
              type="submit"
              className="w-full text-center hover:opacity-90 transition-all duration-300"
              style={{
                backgroundColor: buttonBg,
                color: buttonText,
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                padding: buttonPadding,
                borderColor: buttonBorderColor as string,
                borderWidth: buttonBorderWidth as string,
                borderStyle: 'solid',
                borderRadius: buttonBorderRadius,
                fontSize: buttonFontSize,
                fontWeight: buttonFontWeight as any,
                opacity: isSubmitting || hasMissingRequired ? 0.7 : 1
              }}
              disabled={isSubmitting || hasMissingRequired}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = buttonHoverBg as string;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = buttonBg as string;
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>

            {errorMessage ? (
              <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </div>
        )}
        {/* success message to be shown if the showSuccessMessage is true as set by either a successful submission or flipping the preview switch in the editor for the landing page */}
        {showSuccessMessage && (
          <>
            <h3
              style={{
                color: successTitleColor,
                fontWeight: 700,
                fontSize: '1.1rem'
              }}
            >
              Message Sent!
            </h3>
            <p className="mt-1" style={{ fontSize: '0.95rem' }}>
              {successMessage}
            </p>
          </>
        )}
      </div>
    </form>
  );
}

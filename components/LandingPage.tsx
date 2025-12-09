import { Tables } from '@/types_db';
import MixFlipPlayer from './MixFlipPlayer';
import MusoBadges from './MusoBadges';
import {
  Spotify,
  Apple,
  Youtube,
  Twitch,
  Instagram,
  Facebook,
  Twitter,
  Tiktok,
  Linkedin
} from 'react-bootstrap-icons';

import { cn } from '@/utils/cn';
import { useCallback } from 'react';
import Image from 'next/image';
import LinkWrapper from './LinkWrapper';
import ContactFormRenderer from '@/components/ContactFormRenderer';
import ContactFormModal from '@/components/ContactFormModal';

interface SocialLink {
  id: string;
  url: string;
  platform:
    | 'Spotify'
    | 'Apple Music'
    | 'YouTube'
    | 'Twitch'
    | 'Instagram'
    | 'Facebook'
    | 'Twitter'
    | 'TikTok'
    | 'Linkedin'
    | 'Bluesky';
  color?: string;
  order: number;
}

const BlueSkyIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 600 530" className={className} fill="currentColor">
    <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
  </svg>
);

interface PageMetadata {
  title: string;
}

interface Link {
  id: string;
  url: string;
  text: string;
  button_color?: string;
  icon?: string | null;
  order: number;
}

interface HeaderImageStyles {
  shape: 'circle' | 'square';
  size: number;
  border: {
    enabled: boolean;
    color: string | null;
    width: number;
  };
}

interface LinkGlobalStyles {
  backgroundColor?: string;
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  buttonStyle?: 'standard' | 'squared' | 'pill';
  shadow?: {
    enabled: boolean;
    color: string | null;
    x: number;
    y: number;
    blur: number;
    spread: number;
  };
}

interface HeadlineStyles {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

interface ParagraphStyles {
  color?: string;
  alignment?: 'left' | 'center' | 'right';
}

interface HeadlineAndParagraphStyles {
  headline?: HeadlineStyles;
  paragraph?: ParagraphStyles;
}

interface SocialLinkStyles {
  color?: string;
  // Room for future additions like:
  // size?: string;
  // spacing?: string;
  // layout?: 'horizontal' | 'vertical';
  // etc.
}

interface ResolvedPageColors {
  pageBackgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

interface ClickEventProps {
  type: 'social' | 'custom';
  id: string;
  text: string;
  url: string;
  platform?: string;
}

interface LandingPageProps {
  page: Tables<'pages'> & {
    headline_and_paragraph_styles?: HeadlineAndParagraphStyles;
    link_global_styles?: LinkGlobalStyles;
    muso_stats_config?: any;
  };
  player: Tables<'players'> & {
    header_layout: HeaderLayout;
    playlist_order: PlaylistElement[];
  };
  playlistSongs: any[];
  hasActivePlan: boolean;
  resolvedColors: any;
  resolvedPageColors?: ResolvedPageColors;
  userAffiliateData?: string;
  musoData?: {
    profile?: any;
    charts?: any;
  } | null;
  pageContactForm?: Tables<'page_contact_forms'> | null;
  contactForm?: Tables<'contact_forms'> | null;
  previewShowSuccess?: boolean;
}

interface BackgroundImageProps {
  imageUrl: string;
  backgroundColor: string;
  children: React.ReactNode;
}

const OptimizedBackground = ({
  imageUrl,
  backgroundColor,
  children
}: BackgroundImageProps) => {
  if (!imageUrl) {
    return <div style={{ backgroundColor }}>{children}</div>;
  }

  // For blob URLs (local preview), use regular div with background
  if (imageUrl.startsWith('blob:')) {
    return (
      <div
        style={{
          backgroundColor,
          backgroundImage: `linear-gradient(${backgroundColor}, ${backgroundColor}), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {children}
      </div>
    );
  }

  // For hosted images, use Next.js Image with fill
  return (
    <div className="relative">
      <div className="absolute inset-0">
        <Image
          src={`https://r2.mixflip.io/${imageUrl}`}
          alt="Background"
          fill
          quality={80}
          priority={true}
          className="object-cover"
          sizes="800px"
        />
      </div>
      <div
        className="relative"
        style={{
          background: backgroundColor // This will be on top of the image
        }}
      >
        {children}
      </div>
    </div>
  );
};
interface Player {
  id: number;
  accent_color: string;
  background_color: string;
  foreground_neutral: string;
  text_color: string;
  before_audio_label: string;
  after_audio_label: string;
  user_id: string;
  show_branding: boolean;
  show_artwork: boolean;
  show_artwork_mobile: boolean;
  auto_advance: boolean; // TODO: implement this
  font_family: string | null;
  player_border_color: string | null;
  play_button_border_color: string | null;
  toggle_border_color: string | null;
  playlist_border_color: string | null;
  default_to_after: boolean;
  player_type: string;
  header_layout: HeaderLayout;
  playlist_order: PlaylistElement[];
  mobile_artwork_position: string | null;
}

interface HeaderElement {
  type: 'song_name' | 'artist' | 'description';
  visible: boolean;
}

interface HeaderLayout {
  [key: string]: HeaderElement[];
  line1: HeaderElement[];
  line2: HeaderElement[];
}

interface PlaylistElement {
  type: 'song' | 'artist' | 'description';
  visible: boolean;
}

export default function LandingPage({
  page,
  player,
  playlistSongs,
  hasActivePlan,
  resolvedColors,
  resolvedPageColors = {},
  userAffiliateData,
  musoData,
  pageContactForm,
  contactForm,
  previewShowSuccess
}: LandingPageProps) {
  // Parse JSON fields
  const socialLinks = (page.social_links as unknown as SocialLink[]) || [];
  const links = (page.links as unknown as Link[]) || [];
  const headerImageStyles: HeaderImageStyles = {
    shape: 'rounded',
    size: 50,
    border: {
      enabled: false,
      color: null,
      width: 1
    },
    ...(typeof page.header_image_styles === 'string'
      ? JSON.parse(page.header_image_styles)
      : page.header_image_styles || {})
  };
  const linkGlobalStyles: LinkGlobalStyles =
    (page.link_global_styles as LinkGlobalStyles) || {};
  const socialLinkStyles: SocialLinkStyles =
    (page.social_link_styles as SocialLinkStyles) || {};

  // Parse Muso stats config
  const musoStatsConfig = page.muso_stats_config
    ? typeof page.muso_stats_config === 'string'
      ? JSON.parse(page.muso_stats_config)
      : page.muso_stats_config
    : null;

  // Parse the headline and paragraph styles
  const headlineAndParagraphStyles: HeadlineAndParagraphStyles =
    ((typeof page.headline_and_paragraph_styles === 'string'
      ? JSON.parse(page.headline_and_paragraph_styles)
      : page.headline_and_paragraph_styles) as HeadlineAndParagraphStyles) ||
    {};

  // Resolve styles with fallbacks
  const accentColor =
    resolvedPageColors?.accentColor ||
    page.accent_color_override ||
    player?.accent_color ||
    '#2462EB';
  const pageBackgroundColor = page.page_background_color || '#ffffff';
  const textColor = page.text_color || '#111111';
  const pageFontFamily = page.font_override || player?.font_family; // Use optional chaining and nullish coalescing

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'Spotify':
        return <Spotify />;
      case 'Apple Music':
        return <Apple />;
      case 'YouTube':
        return <Youtube />;
      case 'Twitch':
        return <Twitch />;
      case 'Instagram':
        return <Instagram />;
      case 'Facebook':
        return <Facebook />;
      case 'Twitter':
        return <Twitter />;
      case 'TikTok':
        return <Tiktok />;
      case 'Linkedin':
        return <Linkedin />;
      case 'Bluesky':
        return <BlueSkyIcon />;
      default:
        return null;
    }
  };

  // Helper function to get image size
  const getImageStyles = (size: number) => {
    // Apply a coefficient to sizes below 70% on mobile
    // For example, if size is 50%, it becomes 75% on mobile (coefficient of 1.5)
    const mobileCoefficient = 1.5;
    const mobileSize =
      size < 70 ? Math.min(size * mobileCoefficient, 70) : size;

    return {
      '--desktop-size': `${size}%`,
      '--mobile-size': `${mobileSize}%`
    } as React.CSSProperties;
  };

  //function to decide if the user's background is dark or light and set the text color accordingly
  const isDarkBackground = (backgroundColor: string) => {
    if (!backgroundColor) return false;

    // Normalize the color string (trim and lowercase)
    const color = backgroundColor.trim().toLowerCase();

    // Handle hex colors (#ff8040, #f80, ff8040, f80)
    const hexMatch = color.match(/^#?([a-f0-9]{6}|[a-f0-9]{3})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      // Expand 3-digit hex to 6-digit
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((char) => char + char)
          .join('');
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }

    // Handle rgb() and rgba() colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }

    // Handle named colors by converting to RGB
    const namedColors: { [key: string]: [number, number, number] } = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      red: [255, 0, 0],
      green: [0, 128, 0],
      blue: [0, 0, 255],
      yellow: [255, 255, 0],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      gray: [128, 128, 128],
      grey: [128, 128, 128],
      darkgray: [169, 169, 169],
      darkgrey: [169, 169, 169],
      lightgray: [211, 211, 211],
      lightgrey: [211, 211, 211],
      orange: [255, 165, 0],
      purple: [128, 0, 128],
      brown: [165, 42, 42],
      pink: [255, 192, 203],
      navy: [0, 0, 128],
      maroon: [128, 0, 0],
      olive: [128, 128, 0],
      lime: [0, 255, 0],
      aqua: [0, 255, 255],
      teal: [0, 128, 128],
      silver: [192, 192, 192],
      gold: [255, 215, 0]
    };

    if (namedColors[color]) {
      const [r, g, b] = namedColors[color];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }

    // Fallback: try to extract any numbers (original behavior, but more defensive)
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0], 10);
      const g = parseInt(matches[1], 10);
      const b = parseInt(matches[2], 10);
      // Validate RGB values are in valid range
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
    }

    // Default to light background if we can't parse the color
    return false;
  };

  // Contact form display mode logic
  const displayMode = pageContactForm?.display_mode || 'inline';

  // Helper function to render the contact form
  const renderContactForm = () => {
    if (!pageContactForm || !contactForm) return null;

    return (
      <ContactFormRenderer
        page={page}
        player={player as any}
        pageContactForm={pageContactForm as any}
        contactForm={contactForm as any}
        previewShowSuccess={previewShowSuccess}
      />
    );
  };

  return (
    <OptimizedBackground
      imageUrl={page.background_image || ''}
      backgroundColor={pageBackgroundColor}
    >
      <div className=" flex justify-center w-full min-h-screen px-4 py-10 md:py-12 lg:py-16">
        <div
          className="flex flex-col items-center w-full max-w-2xl gap-8"
          style={{
            color: textColor,
            ...(pageFontFamily && {
              fontFamily: `"${pageFontFamily}", ${
                pageFontFamily.includes(' ') ? 'serif' : 'sans-serif'
              }`
            })
          }}
        >
          {/* Header Image */}
          {page.header_image_url && (
            <div className="flex justify-center w-full">
              {page.header_image_url.startsWith('blob:') ? (
                <img
                  src={page.header_image_url}
                  alt="Header"
                  className={cn(
                    'md:w-[var(--desktop-size)] w-[var(--mobile-size)]',
                    headerImageStyles.shape === 'circle'
                      ? 'rounded-full object-cover aspect-square'
                      : 'rounded-lg object-contain h-auto',
                    headerImageStyles.border?.enabled && 'border'
                  )}
                  style={{
                    ...getImageStyles(headerImageStyles.size),
                    ...(headerImageStyles.border?.enabled && {
                      borderColor: headerImageStyles.border.color || textColor,
                      borderWidth: `${headerImageStyles.border.width || 1}px`
                    })
                  }}
                />
              ) : (
                <Image
                  src={`https://r2.mixflip.io/${page.header_image_url}`}
                  alt="Header"
                  width={600}
                  height={600}
                  quality={85}
                  priority
                  loading="eager"
                  sizes="(max-width: 672px) 60vw, 40vw"
                  className={cn(
                    'md:w-[var(--desktop-size)] w-[var(--mobile-size)]',
                    headerImageStyles.shape === 'circle'
                      ? 'rounded-full object-cover aspect-square'
                      : 'rounded-lg object-contain h-auto',
                    headerImageStyles.border?.enabled && 'border'
                  )}
                  style={{
                    ...getImageStyles(headerImageStyles.size),
                    ...(headerImageStyles.border?.enabled && {
                      borderColor: headerImageStyles.border.color || textColor,
                      borderWidth: `${headerImageStyles.border.width || 1}px`
                    })
                  }}
                />
              )}
            </div>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {[...socialLinks]
                .sort((a, b) => a.order - b.order)
                .map((social) =>
                  social.url ? (
                    <LinkWrapper
                      key={social.id}
                      type="social"
                      id={social.id}
                      text={social.platform}
                      url={social.url}
                      platform={social.platform}
                    >
                      <span
                        className="text-2xl transition-opacity hover:opacity-80"
                        style={{
                          color: socialLinkStyles.color || accentColor
                        }}
                      >
                        {getSocialIcon(social.platform)}
                      </span>
                    </LinkWrapper>
                  ) : null
                )}
            </div>
          )}

          {/* Muso Stats - Above Copy */}
          {musoStatsConfig?.enabled &&
            musoStatsConfig.position === 'above_copy' && (
              <MusoBadges
                config={musoStatsConfig}
                musoData={musoData}
                fallbackColors={{
                  background: accentColor,
                  text: '#ffffff',
                  border: accentColor
                }}
              />
            )}

          {(page.page_headline || page.intro_copy) && (
            <div className="w-full space-y-4">
              {/* Headline */}
              {page.page_headline && (
                <h1
                  className={cn(
                    'text-3xl text-center',
                    (headlineAndParagraphStyles?.headline?.bold ?? true)
                      ? 'font-extrabold'
                      : '',
                    headlineAndParagraphStyles?.headline?.italic && 'italic',
                    headlineAndParagraphStyles?.headline?.underline &&
                      'underline'
                  )}
                  style={{
                    color:
                      headlineAndParagraphStyles?.headline?.color || textColor,
                    textAlign:
                      headlineAndParagraphStyles?.headline?.alignment ||
                      'center'
                  }}
                >
                  {page.page_headline}
                </h1>
              )}
              {/* Intro Copy */}
              {page.intro_copy && (
                <div
                  className="leading-relaxed"
                  style={{
                    color:
                      headlineAndParagraphStyles?.paragraph?.color || textColor,
                    textAlign:
                      headlineAndParagraphStyles?.paragraph?.alignment || 'left'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: page.intro_copy.replace(/\n/g, '<br>')
                  }}
                ></div>
              )}
            </div>
          )}

          {/* Muso Stats - Below Copy */}
          {musoStatsConfig?.enabled &&
            musoStatsConfig.position === 'below_copy' && (
              <MusoBadges
                config={musoStatsConfig}
                musoData={musoData}
                fallbackColors={{
                  background: accentColor,
                  text: '#ffffff',
                  border: accentColor
                }}
              />
            )}

          {/* MixFlip Player */}
          {player && player.id > 0 && (
            <div className="w-full">
              <MixFlipPlayer
                player={player}
                hasActivePlan={hasActivePlan}
                playlistSongs={playlistSongs}
                colors={resolvedColors}
                source=""
              />
            </div>
          )}

          {/* Muso Stats - Above Links */}
          {musoStatsConfig?.enabled &&
            musoStatsConfig.position === 'above_links' && (
              <MusoBadges
                config={musoStatsConfig}
                musoData={musoData}
                className=""
                fallbackColors={{
                  background: accentColor,
                  text: '#ffffff',
                  border: accentColor
                }}
              />
            )}

          {/* Links */}
          {links.length > 0 && (
            <div className="flex flex-col w-full gap-4">
              {links.map((link) => {
                if (!link.url) return null;

                // Check if this is a contact form link
                const isContactLink = link.url === 'contact:modal';

                if (isContactLink && pageContactForm && contactForm) {
                  // Render contact modal trigger (no LinkWrapper - just direct click)
                  return (
                    <ContactFormModal
                      key={link.id}
                      pageContactForm={pageContactForm}
                      contactForm={contactForm}
                      page={page}
                      player={player}
                      previewShowSuccess={previewShowSuccess}
                      trigger={
                        <div
                          className={cn(
                            'w-full px-4 py-3 text-center cursor-pointer flex items-center justify-center gap-2 text-sm',
                            linkGlobalStyles?.bold && 'font-bold',
                            linkGlobalStyles?.italic && 'italic',
                            linkGlobalStyles?.underline && 'underline',
                            linkGlobalStyles?.buttonStyle === 'standard' &&
                              'rounded-lg',
                            linkGlobalStyles?.buttonStyle === 'squared' &&
                              'rounded-none',
                            linkGlobalStyles?.buttonStyle === 'pill' &&
                              'rounded-full',
                            linkGlobalStyles?.buttonStyle ?? 'rounded-lg'
                          )}
                          style={{
                            backgroundColor:
                              link.button_color ||
                              linkGlobalStyles?.backgroundColor ||
                              accentColor,
                            color: linkGlobalStyles?.textColor || '#FFFFFF',
                            boxShadow: linkGlobalStyles?.shadow?.enabled
                              ? `${linkGlobalStyles.shadow.x}px ${linkGlobalStyles.shadow.y}px ${
                                  linkGlobalStyles.shadow.blur
                                }px ${linkGlobalStyles.shadow.spread}px ${
                                  linkGlobalStyles.shadow.color ||
                                  'rgb(0 0 0 / 0.1)'
                                }`
                              : undefined
                          }}
                        >
                          {link.text}
                        </div>
                      }
                    />
                  );
                } else {
                  // Render regular link
                  return (
                    <LinkWrapper
                      key={link.id}
                      type="custom"
                      id={link.id}
                      text={link.text}
                      url={link.url}
                    >
                      <div
                        className={cn(
                          'w-full px-4 py-3 text-center cursor-pointer flex items-center justify-center gap-2 text-sm',
                          linkGlobalStyles?.bold && 'font-bold',
                          linkGlobalStyles?.italic && 'italic',
                          linkGlobalStyles?.underline && 'underline',
                          linkGlobalStyles?.buttonStyle === 'standard' &&
                            'rounded-lg',
                          linkGlobalStyles?.buttonStyle === 'squared' &&
                            'rounded-none',
                          linkGlobalStyles?.buttonStyle === 'pill' &&
                            'rounded-full',
                          linkGlobalStyles?.buttonStyle ?? 'rounded-lg'
                        )}
                        style={{
                          backgroundColor:
                            link.button_color ||
                            linkGlobalStyles?.backgroundColor ||
                            accentColor,
                          color: linkGlobalStyles?.textColor || '#FFFFFF',
                          boxShadow: linkGlobalStyles?.shadow?.enabled
                            ? `${linkGlobalStyles.shadow.x}px ${linkGlobalStyles.shadow.y}px ${
                                linkGlobalStyles.shadow.blur
                              }px ${linkGlobalStyles.shadow.spread}px ${
                                linkGlobalStyles.shadow.color ||
                                'rgb(0 0 0 / 0.1)'
                              }`
                            : undefined
                        }}
                      >
                        {link.text}
                      </div>
                    </LinkWrapper>
                  );
                }
              })}
            </div>
          )}

          {/* Muso Stats - Below Links */}
          {musoStatsConfig?.enabled &&
            musoStatsConfig.position === 'below_links' && (
              <MusoBadges
                config={musoStatsConfig}
                musoData={musoData}
                className=""
                fallbackColors={{
                  background: accentColor,
                  text: '#ffffff',
                  border: accentColor
                }}
              />
            )}

          {/* Contact Form Display Modes */}
          {pageContactForm && contactForm && (
            <>
              {/* Inline Mode - Always visible */}
              {displayMode === 'inline' && (
                <div className="w-full">{renderContactForm()}</div>
              )}
            </>
          )}

          {/* Branding */}
          {/* {page.show_branding && (
            <div className="pb-4 text-sm opacity-70">
              <a
                href={`https://mixflip.io?utm_source=landing-page&utm_medium=footer${userAffiliateData ? `&affiliate=${userAffiliateData}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="plausible-event-name=powered-by-mixflip-link"
                style={{
                  color: isDarkBackground(pageBackgroundColor)
                    ? '#333333'
                    : '#f0f0f0'
                }}
              >
                {page.user_branding_name || 'Powered by MixFlip'}
              </a>
            </div>
          )} */}
        </div>
      </div>
    </OptimizedBackground>
  );
}

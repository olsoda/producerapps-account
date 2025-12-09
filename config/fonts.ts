interface FontDefinition {
  name: string;
  value: string;
  category: 'sans-serif' | 'serif';
  isCustom?: boolean;
  weights?: string[];
  urls?: {
    [weight: string]: string;
  };
}

export const availableFonts = {
  sans: [
    {
      name: 'Albert Sans',
      value: 'Albert Sans',
      category: 'sans-serif',
      isCustom: false
    },

    {
      name: 'DM Sans',
      value: 'DM Sans',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Exo',
      value: 'Exo',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Figtree',
      value: 'Figtree',
      category: 'sans-serif',
      isCustom: false
    },

    {
      name: 'Lato',
      value: 'Lato',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Lexend',
      value: 'Lexend',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Manrope',
      value: 'Manrope',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Montserrat',
      value: 'Montserrat',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Noto Sans',
      value: 'Noto Sans',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Nunito',
      value: 'Nunito',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Open Sans',
      value: 'Open Sans',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Outfit',
      value: 'Outfit',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Plus Jakarta Sans',
      value: 'Plus Jakarta Sans',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Poppins',
      value: 'Poppins',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Quicksand',
      value: 'Quicksand',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Rajdhani',
      value: 'Rajdhani',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Raleway',
      value: 'Raleway',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Roboto',
      value: 'Roboto',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Rubik',
      value: 'Rubik',
      category: 'sans-serif',
      isCustom: false
    },

    {
      name: 'Sora',
      value: 'Sora',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Space Grotesk',
      value: 'Space Grotesk',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Thicccboi',
      value: 'Thicccboi',
      category: 'sans-serif',
      isCustom: true,
      weights: ['400', '700'],
      urls: {
        '400': 'https://r2.mixflip.io/fonts/thicccboi/THICCCBOI-SemiBold.woff2',
        '700': 'https://r2.mixflip.io/fonts/thicccboi/THICCCBOI-Bold.woff2'
      }
    },
    {
      name: 'Trueno',
      value: 'Trueno',
      category: 'sans-serif',
      isCustom: true,
      weights: ['400', '700'],
      urls: {
        '400': 'https://r2.mixflip.io/fonts/trueno/TruenoRg.woff',
        '700': 'https://r2.mixflip.io/fonts/trueno/TruenoBd.woff'
      }
    },
    {
      name: 'Ubuntu',
      value: 'Ubuntu',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Urbanist',
      value: 'Urbanist',
      category: 'sans-serif',
      isCustom: false
    },
    {
      name: 'Work Sans',
      value: 'Work Sans',
      category: 'sans-serif',
      isCustom: false
    }
  ] as FontDefinition[],
  serif: [
    {
      name: 'Courier Prime',
      value: 'Courier Prime',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Crimson Pro',
      value: 'Crimson Pro',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'DM Serif Display',
      value: 'DM Serif Display',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Fraunces',
      value: 'Fraunces',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Libre Baskerville',
      value: 'Libre Baskerville',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Lora',
      value: 'Lora',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Merriweather',
      value: 'Merriweather',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Playfair Display',
      value: 'Playfair Display',
      category: 'serif',
      isCustom: false
    },
    {
      name: 'Source Serif Pro',
      value: 'Source Serif Pro',
      category: 'serif',
      isCustom: false
    }
  ] as FontDefinition[]
} satisfies { sans: FontDefinition[]; serif: FontDefinition[] };

export const getGoogleFontsURL = (fonts: string[]): string => {
  const bunnyFonts = fonts.filter(
    (font) =>
      ![...availableFonts.sans, ...availableFonts.serif].find(
        (f) => f.isCustom && f.value === font
      )
  );

  const uniqueFonts = Array.from(new Set(bunnyFonts));
  return `https://fonts.bunny.net/css?family=${uniqueFonts
    .map((font) => `${font.toLowerCase().replace(' ', '-')}:400,700`)
    .join('|')}`;
};

export const getCustomFontCSS = (): string => {
  const customFonts = [...availableFonts.sans, ...availableFonts.serif].filter(
    (f) => f.isCustom
  );

  return customFonts
    .map(
      (font) => `
        @font-face {
          font-family: '${font.value}';
          src: url('${font.urls?.['400']}') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: '${font.value}';
          src: url('${font.urls?.['700']}') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
      `
    )
    .join('\n');
};

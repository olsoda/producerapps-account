import { Database } from '@/types_db';

type PlayerRow = Database['public']['Tables']['players']['Row'];

export interface HeaderElement {
  type: 'song_name' | 'artist' | 'description';
  visible: boolean;
}

export interface HeaderLayout {
  [key: string]: HeaderElement[];
  line1: HeaderElement[];
  line2: HeaderElement[];
}

export interface Player extends Omit<PlayerRow, 'header_layout'> {
  header_layout: HeaderLayout;
}

// Type guard to check if a value is a HeaderLayout
export function isHeaderLayout(value: unknown): value is HeaderLayout {
  if (!value || typeof value !== 'object') return false;

  const layout = value as HeaderLayout;
  return (
    Array.isArray(layout.line1) &&
    Array.isArray(layout.line2) &&
    layout.line1.every(isHeaderElement) &&
    layout.line2.every(isHeaderElement)
  );
}

// Type guard for HeaderElement
function isHeaderElement(value: unknown): value is HeaderElement {
  if (!value || typeof value !== 'object') return false;

  const element = value as HeaderElement;
  return (
    (element.type === 'song_name' ||
      element.type === 'artist' ||
      element.type === 'description') &&
    typeof element.visible === 'boolean'
  );
}

// Helper function to parse player data from database
export function parsePlayer(playerRow: PlayerRow): Player {
  return {
    ...playerRow,
    header_layout: playerRow.header_layout as unknown as HeaderLayout
  };
}

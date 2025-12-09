'use client';
import { useState, useRef, useEffect } from 'react';
import { Sketch } from '@uiw/react-color';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ColorPickerProps {
  color: string | null;
  onChange: (color: string) => void;
  onReset?: () => void;
  className?: string;
  recentColors?: string[];
  fallbackColor?: string;
}

export function ColorPicker({
  color,
  onChange,
  onReset,
  className,
  recentColors = [],
  fallbackColor
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetColors = Array.from(new Set(recentColors.filter(Boolean))).map(
    (color) => ({
      color,
      title: color
    })
  );

  const showCheckerboard = !color && !fallbackColor;
  const displayColor = color || fallbackColor;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-8 h-8">
            {/* Checkerboard background */}
            <div className="absolute inset-0 rounded border border-input bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]" />
            {/* Color overlay */}
            <button
              className={cn(
                'absolute inset-0 rounded border border-input',
                className
              )}
              style={{ backgroundColor: displayColor || undefined }}
              aria-label="Pick a color"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Sketch
            style={{ width: '200px' }}
            color={color || fallbackColor || '#000000'}
            onChange={(color) => {
              onChange(color.hexa);
            }}
            presetColors={presetColors.length > 0 ? presetColors : undefined}
          />
        </PopoverContent>
      </Popover>
      {onReset && (
        <button onClick={onReset} className="p-0" title="Reset to default">
          <RotateCcw className="text-gray-500 hover:text-primary size-3" />
        </button>
      )}
    </div>
  );
}

'use client';
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/utils/cn';

type ProgressProps = React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> & {
  indicatorColor?: string;
  max?: number;
  fullColor?: string;
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    { className, value, max = 100, indicatorColor = 'bg-primary', fullColor = 'bg-primary', ...props },
    ref
  ) => {
    const isFull = (value || 0) >= max;
    const rootBgClass = isFull ? fullColor : 'bg-secondary';
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          `relative h-2 w-full overflow-hidden rounded-full`,
          rootBgClass,
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn('h-full w-full flex-1 transition-all', indicatorColor)}
          style={{
            transform: `translateX(-${100 - ((value || 0) / max) * 100}%)`
          }}
        />
      </ProgressPrimitive.Root>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

'use client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from './ui/button';

export default function ToastTest() {
  const { toast } = useToast();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6 text-center sm:hidden bg-muted/50">
      <Button
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2023 at 5:57 PM'
          });
        }}
      >
        Show Toast
      </Button>
    </div>
  );
}

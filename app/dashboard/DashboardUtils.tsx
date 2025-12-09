import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Toaster } from '@/components/template_ui/TemplateToasts/toaster';
import SupportFormPopup from '@/components/SupportFormPopup';

// Dynamically import ChatwootWidget with low priority
// const ChatwootWidget = dynamic(() => import('@/components/ChatwootWidget'), {
//   ssr: false
// });

export default function DashboardUtils() {
  return (
    <>
      <Suspense fallback={<div>Loading chat...</div>}>
        {/* <ChatwootWidget /> */}
        <SupportFormPopup />
      </Suspense>
      <Suspense fallback={<div>Loading toaster...</div>}>
        <Toaster />
      </Suspense>
    </>
  );
}

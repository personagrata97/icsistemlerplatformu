import { Suspense } from 'react';
import LoadingState from '@/components/ui/LoadingState';
import FindingsPage from '../findings/page';

function ConciliationPageContent() {
    return <FindingsPage />;
}


export default function ConciliationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingState message="Sayfa Yükleniyor..." /></div>}>
      <ConciliationPageContent />
    </Suspense>
  );
}

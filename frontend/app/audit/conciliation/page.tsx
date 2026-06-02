import { Suspense } from 'react';
import FindingsPage from '../findings/page';

function ConciliationPageContent() {
    return <FindingsPage />;
}


export default function ConciliationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Yükleniyor...</div>}>
      <ConciliationPageContent />
    </Suspense>
  );
}

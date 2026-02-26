'use client';

import PageHeader from '@/components/ui/PageHeader';
import AssistantExperience from './components/AssistantExperience';

export default function AssistantPage() {
  return (
    <main className="container mx-auto p-8 max-w-5xl">
      <PageHeader
        title="Site Assistant"
        description="Deterministic, zero-cost assistant for product discovery and site help"
      />

      <AssistantExperience mode="page" />
    </main>
  );
}

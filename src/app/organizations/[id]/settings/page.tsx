"use client";

import { useParams } from 'next/navigation';
import { OrganizationSettings } from '@/components/organizations/OrganizationSettings';

export default function OrganizationSettingsPage() {
  const params = useParams();
  const organizationId = params.id as string;

  return (
    <div className="container mx-auto py-8">
      <OrganizationSettings organizationId={organizationId} />
    </div>
  );
} 
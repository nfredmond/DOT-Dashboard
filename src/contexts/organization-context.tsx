'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationContextType {
  organization: Organization | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const organization = user?.organizationId ? {
    id: user.organizationId,
    name: user.organizationName || 'Organization'
  } : null;

  return (
    <OrganizationContext.Provider value={{ organization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  return context;
}; 
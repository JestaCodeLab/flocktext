import { useAuthStore } from '@/store/authStore';

export type OrganizationType = 'church' | 'business' | 'institution';

export interface EntityLabels {
  singular: string;
  plural: string;
  singularCap: string;
  pluralCap: string;
}

const ENTITY_LABELS: Record<OrganizationType, EntityLabels> = {
  church: { singular: 'member', plural: 'members', singularCap: 'Member', pluralCap: 'Members' },
  business: { singular: 'customer', plural: 'customers', singularCap: 'Customer', pluralCap: 'Customers' },
  institution: { singular: 'contact', plural: 'contacts', singularCap: 'Contact', pluralCap: 'Contacts' },
};

export function getEntityLabels(organizationType: OrganizationType | undefined): EntityLabels {
  return ENTITY_LABELS[organizationType ?? 'institution'] ?? ENTITY_LABELS.institution;
}

export function useEntityLabels(): EntityLabels {
  const organizationType = useAuthStore((s) => s.session?.organization.organizationType);
  return getEntityLabels(organizationType);
}

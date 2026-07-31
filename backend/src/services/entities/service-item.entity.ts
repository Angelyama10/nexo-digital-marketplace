export type ServiceCategory =
  | 'streaming'
  | 'ai'
  | 'education'
  | 'infrastructure'
  | 'automation'
  | 'commerce';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  priceFrom: number;
  priceLabel: string;
  accent: string;
  featured?: boolean;
}

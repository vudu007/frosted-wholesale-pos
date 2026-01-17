export type CustomerTierType = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

export class Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  tier: CustomerTierType;
  loyaltyPoints: number;
  totalSpent: number;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

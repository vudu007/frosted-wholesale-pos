export class CreateSaleDto {
  storeId: string;
  customerId?: string;
  items: {
    productId: string;
    qty: number;
  }[];
  payments: {
    type: string;
    amount: number;
  }[];
  discount?: {
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
  };
}

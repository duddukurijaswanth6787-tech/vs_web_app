export interface TaxRule {
  id: string;
  name: string;
  code: string;
  type: 'GST' | 'VAT' | 'FLAT' | 'CUSTOM';
  rate: number;
  country?: string;
  state?: string;
  postalCodePattern?: string;
  isInclusive: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRuleDto {
  name: string;
  code: string;
  type: 'GST' | 'VAT' | 'FLAT' | 'CUSTOM';
  rate: number;
  country?: string;
  state?: string;
  postalCodePattern?: string;
  isInclusive?: boolean;
  isActive?: boolean;
}

export interface CalculateTaxDto {
  amount: number;
  country?: string;
  state?: string;
  postalCode?: string;
  categoryId?: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  appliedRules: Array<{
    ruleId: string;
    ruleName: string;
    rate: number;
    amount: number;
  }>;
}

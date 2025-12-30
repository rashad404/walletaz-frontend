import apiClient from './client';

export interface WalletBalance {
  balance: number;
  reserved_balance: number;
  available_balance: number;
  currency: string;
  status: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  type: 'deposit' | 'charge' | 'refund' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Deposit {
  id: number;
  amount: number;
  currency: string;
  payment_method_type: string;
  gateway_name: string;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface DepositRequest {
  amount: number;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

export interface DepositResponse {
  status: string;
  message?: string;
  data?: {
    transaction_id: string;
    amount: number;
    currency: string;
    new_balance: number;
    card_last_four: string;
    card_brand: string;
    is_test: boolean;
  };
}

export interface TestCard {
  number: string;
  description: string;
  brand: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

class WalletService {
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get('/wallet/balance');
    return response.data.data;
  }

  async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get('/wallet/transactions', { params: filters });
    return response.data;
  }

  async getDeposits(filters: { status?: string; method?: string; per_page?: number; page?: number } = {}): Promise<PaginatedResponse<Deposit>> {
    const response = await apiClient.get('/wallet/deposits', { params: filters });
    return response.data;
  }

  async deposit(data: DepositRequest): Promise<DepositResponse> {
    const response = await apiClient.post('/wallet/deposit', data);
    return response.data;
  }

  async getTestCards(): Promise<TestCard[]> {
    const response = await apiClient.get('/wallet/test-cards');
    return response.data.data;
  }

  // Format currency amount
  formatAmount(amount: number, currency: string = 'AZN'): string {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Format card number with spaces
  formatCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  // Get transaction type label
  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      deposit: 'deposit',
      charge: 'charge',
      refund: 'refund',
      adjustment: 'adjustment',
    };
    return labels[type] || type;
  }
}

export default new WalletService();

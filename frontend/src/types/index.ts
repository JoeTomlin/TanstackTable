export interface Contract {
  id: string;
  contractName: string;
  clientName: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  duration?: number;
  daysRemaining?: number;
  monthlyValue?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ToolResult {
  success: boolean;
  action?: string;
  filter?: {
    column: string;
    operator: string;
    value: string | number;
    value2?: string | number;
  };
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  search?: {
    query: string;
    columns?: string[];
    caseSensitive?: boolean;
  };
  filters?: Array<{
    column: string;
    operator: string;
    value: string | number;
    value2?: string | number;
  }>;
  pageSize?: number;
  pageNumber?: number;
  contract?: Contract;
  contracts?: Contract[];
  message?: string;
  error?: string;
}

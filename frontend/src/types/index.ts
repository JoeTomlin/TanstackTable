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
    filter?: any;
    sort?: any;
    search?: any;
    contracts?: Contract[];
    message?: string;
    error?: string;
  }
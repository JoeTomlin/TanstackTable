export interface Contract {
    id: string;
    contractName: string;      // e.g., "AWS Cloud Services Agreement"
    clientName: string;         // e.g., "Acme Corporation"
    value: number;              // Contract value in dollars
    startDate: string;          // ISO date string (YYYY-MM-DD)
    endDate: string;            // ISO date string (YYYY-MM-DD)
    status: 'active' | 'pending' | 'expired' | 'cancelled';
  }
  
  // Extended interface with calculated fields
  export interface ContractWithCalculations extends Contract {
    duration: number;           // days
    daysRemaining: number;      // days until end date
    monthlyValue: number;       // value / (duration in months)
  }
  
  // For grouped results
  export interface ClientGroup {
    clientName: string;
    contractCount: number;
    totalValue: number;
    averageValue: number;
    contracts: Contract[];
  }
  
  export interface StatusGroup {
    status: Contract['status'];
    contractCount: number;
    totalValue: number;
    contracts: Contract[];
  }
// SQL to create contracts table
export const CREATE_CONTRACTS_TABLE = `
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    contractName TEXT NOT NULL,
    clientName TEXT NOT NULL,
    value REAL NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'pending', 'expired', 'cancelled')),
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

// Create indexes for common queries
export const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_contracts_clientName ON contracts(clientName);
  CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  CREATE INDEX IF NOT EXISTS idx_contracts_endDate ON contracts(endDate);
  CREATE INDEX IF NOT EXISTS idx_contracts_value ON contracts(value);
`;
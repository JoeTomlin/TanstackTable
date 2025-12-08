-- Create contracts table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_clientName ON contracts(clientName);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_endDate ON contracts(endDate);
CREATE INDEX IF NOT EXISTS idx_contracts_value ON contracts(value);

-- Insert sample data for testing
INSERT INTO contracts (id, contractName, clientName, value, startDate, endDate, status) VALUES
  ('1', 'Cloud Services Agreement', 'Acme Corporation', 250000, '2024-01-01', '2024-12-31', 'active'),
  ('2', 'Software License', 'TechStart Inc', 150000, '2024-06-01', '2025-05-31', 'active'),
  ('3', 'Consulting Services', 'GlobalTech', 500000, '2023-03-15', '2024-03-14', 'expired'),
  ('4', 'Maintenance Contract', 'Acme Corporation', 75000, '2024-09-01', '2025-08-31', 'active'),
  ('5', 'Development Project', 'StartupXYZ', 300000, '2024-11-01', '2025-10-31', 'pending');
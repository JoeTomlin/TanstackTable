import type { Contract, ContractWithCalculations, ClientGroup, StatusGroup } from '../types/contracts';

// Helper: Add calculated fields to a contract
function addCalculations(contract: Contract): ContractWithCalculations {
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  const now = new Date();
  
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const monthlyValue = contract.value / (duration / 30); // approximate months
  
  return {
    ...contract,
    duration,
    daysRemaining,
    monthlyValue: Math.round(monthlyValue * 100) / 100 // round to 2 decimals
  };
}

// Helper: Apply filters to contracts
function applyFilters(contracts: Contract[], filters?: any[]): Contract[] {
  if (!filters || filters.length === 0) return contracts;
  
  return contracts.filter(contract => {
    return filters.every(filter => {
      const value = (contract as any)[filter.column];
      const filterValue = filter.value;
      
      switch (filter.operator) {
        case 'equals':
          return value === filterValue;
        case 'notEquals':
          return value !== filterValue;
        case 'greaterThan':
          return value > filterValue;
        case 'lessThan':
          return value < filterValue;
        case 'greaterThanOrEqual':
          return value >= filterValue;
        case 'lessThanOrEqual':
          return value <= filterValue;
        case 'contains':
          return typeof value === 'string' && value.toLowerCase().includes(filterValue.toLowerCase());
        case 'startsWith':
          return typeof value === 'string' && value.toLowerCase().startsWith(filterValue.toLowerCase());
        case 'endsWith':
          return typeof value === 'string' && value.toLowerCase().endsWith(filterValue.toLowerCase());
        case 'between':
          return value >= filterValue && value <= filter.value2;
        default:
          return true;
      }
    });
  });
}

// CRUD Operations
export async function getContracts(includeCalculations: boolean, db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts ORDER BY createdAt DESC').all();
    const contracts = result.results as Contract[];
    
    if (includeCalculations) {
      return {
        success: true,
        contracts: contracts.map(addCalculations),
        count: contracts.length
      };
    }
    
    return {
      success: true,
      contracts,
      count: contracts.length
    };
  } catch (error: any) {
    return { error: 'Failed to fetch contracts', details: error.message };
  }
}

export async function getContractById(id: string, includeCalculations: boolean, db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    
    if (!result) {
      return { error: 'Contract not found', id };
    }
    
    const contract = result as Contract;
    
    return {
      success: true,
      contract: includeCalculations ? addCalculations(contract) : contract
    };
  } catch (error: any) {
    return { error: 'Failed to fetch contract', details: error.message };
  }
}

export async function addContract(data: Omit<Contract, 'id'>, db: D1Database): Promise<any> {
  try {
    const id = crypto.randomUUID();
    const contract: Contract = {
      id,
      ...data,
      status: data.status || 'pending'
    };
    
    await db.prepare(
      'INSERT INTO contracts (id, contractName, clientName, value, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      contract.id,
      contract.contractName,
      contract.clientName,
      contract.value,
      contract.startDate,
      contract.endDate,
      contract.status
    ).run();
    
    return {
      success: true,
      contract: addCalculations(contract),
      message: `Added contract: ${contract.contractName}`
    };
  } catch (error: any) {
    return { error: 'Failed to add contract', details: error.message };
  }
}

export async function updateContract(id: string, updates: Partial<Contract>, db: D1Database): Promise<any> {
  try {
    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    await db.prepare(
      `UPDATE contracts SET ${setClause} WHERE id = ?`
    ).bind(...values, id).run();
    
    // Fetch updated contract
    const updated = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(id).first();
    
    return {
      success: true,
      contract: addCalculations(updated as Contract),
      message: `Updated contract ${id}`
    };
  } catch (error: any) {
    return { error: 'Failed to update contract', details: error.message };
  }
}

export async function updateContractByName(contractName: string, updates: Partial<Contract>, db: D1Database): Promise<any> {
  try {
    // Find the contract first
    const contract = await db.prepare(
      'SELECT * FROM contracts WHERE contractName LIKE ? LIMIT 1'
    ).bind(`%${contractName}%`).first();
    
    if (!contract) {
      return { 
        success: false, 
        error: `No contract found matching "${contractName}"` 
      };
    }
    
    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return { success: false, error: 'No updates provided' };
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    await db.prepare(
      `UPDATE contracts SET ${setClause} WHERE id = ?`
    ).bind(...values, contract.id).run();
    
    // Fetch updated contract
    const updated = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(contract.id).first();
    
    return {
      success: true,
      contract: addCalculations(updated as Contract),
      message: `Updated contract: ${(updated as Contract).contractName}`
    };
  } catch (error: any) {
    return { error: 'Failed to update contract', details: error.message };
  }
}

export async function deleteContract(id: string, db: D1Database): Promise<any> {
  try {
    await db.prepare('DELETE FROM contracts WHERE id = ?').bind(id).run();
    
    // Return remaining contracts so frontend can update
    const remaining = await db.prepare('SELECT * FROM contracts ORDER BY createdAt DESC').all();
    const contracts = (remaining.results as Contract[]).map(addCalculations);
    
    return {
      success: true,
      id,
      contracts,
      message: `Deleted contract ${id}`
    };
  } catch (error: any) {
    return { error: 'Failed to delete contract', details: error.message };
  }
}

export async function deleteContractByName(contractName: string, db: D1Database): Promise<any> {
  try {
    // Find the contract first
    const contract = await db.prepare(
      'SELECT * FROM contracts WHERE contractName LIKE ? LIMIT 1'
    ).bind(`%${contractName}%`).first();
    
    if (!contract) {
      return { 
        success: false, 
        error: `No contract found matching "${contractName}"` 
      };
    }
    
    // Delete it
    await db.prepare('DELETE FROM contracts WHERE id = ?').bind(contract.id).run();
    
    // Return remaining contracts
    const remaining = await db.prepare('SELECT * FROM contracts ORDER BY createdAt DESC').all();
    const contracts = (remaining.results as Contract[]).map(addCalculations);
    
    return {
      success: true,
      deletedContract: addCalculations(contract as Contract),
      contracts,
      message: `Deleted contract: ${(contract as Contract).contractName}`
    };
  } catch (error: any) {
    return { error: 'Failed to delete contract', details: error.message };
  }
}

export async function deleteContracts(ids: string[], db: D1Database): Promise<any> {
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.prepare(`DELETE FROM contracts WHERE id IN (${placeholders})`).bind(...ids).run();
    
    return {
      success: true,
      deletedCount: ids.length,
      message: `Deleted ${ids.length} contracts`
    };
  } catch (error: any) {
    return { error: 'Failed to delete contracts', details: error.message };
  }
}

// Calculation Operations
export async function calculateTotalValue(filters: any[] | undefined, db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts').all();
    const contracts = applyFilters(result.results as Contract[], filters);
    
    const total = contracts.reduce((sum, c) => sum + c.value, 0);
    
    return {
      success: true,
      totalValue: total,
      contractCount: contracts.length,
      message: `Total value: $${total.toLocaleString()}`
    };
  } catch (error: any) {
    return { error: 'Failed to calculate total value', details: error.message };
  }
}

export async function calculateAverageValue(filters: any[] | undefined, db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts').all();
    const contracts = applyFilters(result.results as Contract[], filters);
    
    const total = contracts.reduce((sum, c) => sum + c.value, 0);
    const average = contracts.length > 0 ? total / contracts.length : 0;
    
    return {
      success: true,
      averageValue: Math.round(average * 100) / 100,
      contractCount: contracts.length,
      message: `Average value: $${average.toLocaleString()}`
    };
  } catch (error: any) {
    return { error: 'Failed to calculate average value', details: error.message };
  }
}

export async function calculateContractDuration(contractId: string | undefined, db: D1Database): Promise<any> {
  try {
    if (contractId) {
      const contract = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(contractId).first() as Contract;
      if (!contract) return { error: 'Contract not found' };
      
      const withCalcs = addCalculations(contract);
      return {
        success: true,
        contractId,
        duration: withCalcs.duration,
        message: `Duration: ${withCalcs.duration} days`
      };
    } else {
      const result = await db.prepare('SELECT * FROM contracts').all();
      const contracts = (result.results as Contract[]).map(addCalculations);
      
      return {
        success: true,
        durations: contracts.map(c => ({
          id: c.id,
          contractName: c.contractName,
          duration: c.duration
        }))
      };
    }
  } catch (error: any) {
    return { error: 'Failed to calculate duration', details: error.message };
  }
}

export async function calculateMonthlyValue(contractId: string | undefined, db: D1Database): Promise<any> {
  try {
    if (contractId) {
      const contract = await db.prepare('SELECT * FROM contracts WHERE id = ?').bind(contractId).first() as Contract;
      if (!contract) return { error: 'Contract not found' };
      
      const withCalcs = addCalculations(contract);
      return {
        success: true,
        contractId,
        monthlyValue: withCalcs.monthlyValue,
        message: `Monthly value: $${withCalcs.monthlyValue.toLocaleString()}`
      };
    } else {
      const result = await db.prepare('SELECT * FROM contracts').all();
      const contracts = (result.results as Contract[]).map(addCalculations);
      
      return {
        success: true,
        monthlyValues: contracts.map(c => ({
          id: c.id,
          contractName: c.contractName,
          monthlyValue: c.monthlyValue
        }))
      };
    }
  } catch (error: any) {
    return { error: 'Failed to calculate monthly value', details: error.message };
  }
}

export async function getExpiringContracts(daysAhead: number, db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts').all();
    const contracts = (result.results as Contract[]).map(addCalculations);
    
    const expiring = contracts.filter(c => c.daysRemaining > 0 && c.daysRemaining <= daysAhead);
    
    return {
      success: true,
      contracts: expiring,
      count: expiring.length,
      message: `${expiring.length} contracts expiring in the next ${daysAhead} days`
    };
  } catch (error: any) {
    return { error: 'Failed to get expiring contracts', details: error.message };
  }
}

export async function groupByClient(sortBy: string = 'totalValue', sortDirection: string = 'desc', db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts').all();
    const contracts = result.results as Contract[];
    
    const groups = new Map<string, ClientGroup>();
    
    contracts.forEach(contract => {
      if (!groups.has(contract.clientName)) {
        groups.set(contract.clientName, {
          clientName: contract.clientName,
          contractCount: 0,
          totalValue: 0,
          averageValue: 0,
          contracts: []
        });
      }
      
      const group = groups.get(contract.clientName)!;
      group.contractCount++;
      group.totalValue += contract.value;
      group.contracts.push(contract);
    });
    
    // Calculate averages
    groups.forEach(group => {
      group.averageValue = Math.round((group.totalValue / group.contractCount) * 100) / 100;
    });
    
    // Sort
    const sorted = Array.from(groups.values()).sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return {
      success: true,
      groups: sorted,
      clientCount: sorted.length
    };
  } catch (error: any) {
    return { error: 'Failed to group by client', details: error.message };
  }
}

export async function groupByStatus(includeValue: boolean, db: D1Database): Promise<any> {
  try {
    const result = await db.prepare('SELECT * FROM contracts').all();
    const contracts = result.results as Contract[];
    
    const groups = new Map<string, StatusGroup>();
    
    contracts.forEach(contract => {
      if (!groups.has(contract.status)) {
        groups.set(contract.status, {
          status: contract.status,
          contractCount: 0,
          totalValue: 0,
          contracts: []
        });
      }
      
      const group = groups.get(contract.status)!;
      group.contractCount++;
      if (includeValue) group.totalValue += contract.value;
      group.contracts.push(contract);
    });
    
    return {
      success: true,
      groups: Array.from(groups.values())
    };
  } catch (error: any) {
    return { error: 'Failed to group by status', details: error.message };
  }
}
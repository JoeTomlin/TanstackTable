import type { Contract, ContractWithCalculations } from '../types/contracts';
import { ToolCall } from '../types/messages';
import type { Env } from '../types/env';
import * as ops from '../db/operations';

export async function executeToolCall(
  toolCall: ToolCall,
  env: Env
): Promise<any> {
  const { name, arguments: argsStr } = toolCall.function;
  
  let args;
  try {
    args = JSON.parse(argsStr);
  } catch (e) {
    return { error: 'Invalid JSON arguments', details: argsStr };
  }
  
  try {
    switch (name) {
      // Filtering
      case 'filterTable':
        return {
          success: true,
          action: 'filter',
          filter: {
            column: args.column,
            operator: args.operator,
            value: args.value,
            value2: args.value2
          },
          message: `Filtered ${args.column} ${args.operator} ${args.value}`
        };
      
      case 'filterMultipleColumns':
        return {
          success: true,
          action: 'filterMultiple',
          filters: args.filters,
          message: `Applied ${args.filters.length} filters`
        };
      
      case 'clearFilters':
        return {
          success: true,
          action: 'clearFilters',
          message: 'All filters cleared'
        };
      
      // Sorting
      case 'sortTable':
        return {
          success: true,
          action: 'sort',
          sort: {
            column: args.column,
            direction: args.direction
          },
          message: `Sorted by ${args.column} ${args.direction === 'asc' ? 'ascending' : 'descending'}`
        };
      
      case 'clearSorting':
        return {
          success: true,
          action: 'clearSort',
          message: 'Sorting cleared'
        };
      
      // Search
      case 'searchTable':
        return {
          success: true,
          action: 'search',
          search: {
            query: args.query,
            columns: args.columns || ['contractName', 'clientName'],
            caseSensitive: args.caseSensitive || false
          },
          message: `Searching for "${args.query}"`
        };
      
      // CRUD Operations
      case 'addContract':
        return await ops.addContract(args, env.DB);
      
      case 'updateContract':
        return await ops.updateContract(args.id, args.updates, env.DB);
      
      case 'deleteContract':
        return await ops.deleteContract(args.id, env.DB);
      
      case 'deleteContracts':
        return await ops.deleteContracts(args.ids, env.DB);
      
      case 'getContracts':
        return await ops.getContracts(args.includeCalculations !== false, env.DB);
      
      case 'getContractById':
        return await ops.getContractById(args.id, args.includeCalculations !== false, env.DB);
      
      // Calculations
      case 'calculateTotalValue':
        return await ops.calculateTotalValue(args.filters, env.DB);
      
      case 'calculateAverageValue':
        return await ops.calculateAverageValue(args.filters, env.DB);
      
      case 'calculateContractDuration':
        return await ops.calculateContractDuration(args.contractId, env.DB);
      
      case 'calculateMonthlyValue':
        return await ops.calculateMonthlyValue(args.contractId, env.DB);
      
      case 'getExpiringContracts':
        return await ops.getExpiringContracts(args.daysAhead || 30, env.DB);
      
      case 'groupByClient':
        return await ops.groupByClient(args.sortBy, args.sortDirection, env.DB);
      
      case 'groupByStatus':
        return await ops.groupByStatus(args.includeValue !== false, env.DB);
      
      // Pagination
      case 'setPageSize':
        return {
          success: true,
          action: 'setPageSize',
          pageSize: args.pageSize,
          message: `Page size set to ${args.pageSize}`
        };
      
      case 'goToPage':
        return {
          success: true,
          action: 'goToPage',
          pageNumber: args.pageNumber,
          message: `Navigated to page ${args.pageNumber}`
        };
      
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    return { 
      error: `Tool execution failed: ${name}`, 
      details: error.message 
    };
  }
}
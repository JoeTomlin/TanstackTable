import { ToolDefinition } from '../../types/messages';

export const tableTools: ToolDefinition[] = [
  {
    name: 'filterTable',
    description: `Filter contract rows based on a column and condition. 
    Examples: 
    - "show contracts worth more than 100000" → column: "value", operator: "greaterThan", value: 100000
    - "filter by status active" → column: "status", operator: "equals", value: "active"
    - "find contracts for Acme" → column: "clientName", operator: "contains", value: "Acme"
    - "show contracts ending after 2024-12-31" → column: "endDate", operator: "greaterThan", value: "2024-12-31"`,
    parameters: {
      type: 'object',
      properties: {
        column: {
          type: 'string',
          description: 'The column name to filter on',
          enum: ['contractName', 'clientName', 'value', 'startDate', 'endDate', 'status']
        },
        operator: {
          type: 'string',
          description: 'The comparison operator',
          enum: [
            'equals', 
            'notEquals', 
            'greaterThan', 
            'lessThan', 
            'greaterThanOrEqual', 
            'lessThanOrEqual', 
            'contains', 
            'startsWith', 
            'endsWith',
            'between' // for date/value ranges
          ]
        },
        value: {
          type: ['string', 'number'],
          description: 'The value to compare against'
        },
        value2: {
          type: ['string', 'number'],
          description: 'Second value for "between" operator (optional)'
        }
      },
      required: ['column', 'operator', 'value']
    }
  },
  
  {
    name: 'filterMultipleColumns',
    description: `Apply multiple filters at once using AND logic. All conditions must be true.
    Example: "show active contracts worth over 50000 for Acme Corporation"`,
    parameters: {
      type: 'object',
      properties: {
        filters: {
          type: 'array',
          description: 'Array of filter conditions',
          items: {
            type: 'object',
            properties: {
              column: { 
                type: 'string',
                enum: ['contractName', 'clientName', 'value', 'startDate', 'endDate', 'status']
              },
              operator: { 
                type: 'string',
                enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'contains', 'startsWith', 'endsWith', 'between']
              },
              value: { type: ['string', 'number'] },
              value2: { type: ['string', 'number'] }
            },
            required: ['column', 'operator', 'value']
          }
        }
      },
      required: ['filters']
    }
  },
  
  {
    name: 'clearFilters',
    description: 'Remove all active filters from the table to show all contracts',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  {
    name: 'sortTable',
    description: `Sort the contracts table by a specific column.
    Examples:
    - "sort by value descending" → column: "value", direction: "desc"
    - "order by client name alphabetically" → column: "clientName", direction: "asc"
    - "sort by end date soonest first" → column: "endDate", direction: "asc"`,
    parameters: {
      type: 'object',
      properties: {
        column: {
          type: 'string',
          description: 'The column name to sort by',
          enum: ['contractName', 'clientName', 'value', 'startDate', 'endDate', 'status']
        },
        direction: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc']
        }
      },
      required: ['column', 'direction']
    }
  },
  
  {
    name: 'clearSorting',
    description: 'Remove all sorting to return table to default order',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  {
    name: 'searchTable',
    description: `Search across contract name and client name columns for a keyword.
    Example: "search for Microsoft" will look in contractName and clientName
    Example: "find all cloud agreements" searches both name fields`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to look for across text columns'
        },
        columns: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['contractName', 'clientName']
          },
          description: 'Optional: specific columns to search. Defaults to both contractName and clientName'
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Whether search should be case-sensitive',
          default: false
        }
      },
      required: ['query']
    }
  },
  
  {
    name: 'addContract',
    description: `Add a new contract to the table.
    Example: "add a new contract for Acme Corp worth 250000 starting January 1 2024 ending December 31 2024"`,
    parameters: {
      type: 'object',
      properties: {
        contractName: {
          type: 'string',
          description: 'Name/title of the contract'
        },
        clientName: {
          type: 'string',
          description: 'Client or company name'
        },
        value: {
          type: 'number',
          description: 'Total contract value in dollars'
        },
        startDate: {
          type: 'string',
          description: 'Contract start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'Contract end date in YYYY-MM-DD format'
        },
        status: {
          type: 'string',
          description: 'Current status of the contract',
          enum: ['active', 'pending', 'expired', 'cancelled'],
          default: 'pending'
        }
      },
      required: ['contractName', 'clientName', 'value', 'startDate', 'endDate']
    }
  },
  
  {
    name: 'updateContract',
    description: `Update an existing contract's information.
    Example: "change the value of contract abc123 to 300000"
    Example: "update the status of Acme contract to active"`,
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the contract to update'
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            contractName: { type: 'string' },
            clientName: { type: 'string' },
            value: { type: 'number' },
            startDate: { type: 'string', description: 'YYYY-MM-DD format' },
            endDate: { type: 'string', description: 'YYYY-MM-DD format' },
            status: { 
              type: 'string', 
              enum: ['active', 'pending', 'expired', 'cancelled']
            }
          }
        }
      },
      required: ['id', 'updates']
    }
  },
  
  {
    name: 'deleteContract',
    description: `Delete a contract by its ID.
    Example: "remove contract abc123"`,
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the contract to delete'
        }
      },
      required: ['id']
    }
  },
  
  {
    name: 'deleteContracts',
    description: `Delete multiple contracts at once.
    Example: "delete all expired contracts" (use with getContracts first to get IDs)`,
    parameters: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of contract IDs to delete'
        }
      },
      required: ['ids']
    }
  },
  
  {
    name: 'getContracts',
    description: `Get current contract data. Use this before performing operations that need to see existing data.
    Example: "what contracts do we have?" or "show me all contracts"`,
    parameters: {
      type: 'object',
      properties: {
        includeCalculations: {
          type: 'boolean',
          description: 'Include calculated fields like duration, daysRemaining, monthlyValue',
          default: true
        }
      }
    }
  },
  
  {
    name: 'getContractById',
    description: `Get a specific contract's full details by ID.
    Example: "show me details for contract abc123"`,
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The unique ID of the contract'
        },
        includeCalculations: {
          type: 'boolean',
          description: 'Include calculated fields',
          default: true
        }
      },
      required: ['id']
    }
  },
  
  {
    name: 'calculateTotalValue',
    description: `Calculate the sum of contract values, optionally filtered.
    Example: "what's the total value of all active contracts?"
    Example: "calculate total value for Acme Corp contracts"`,
    parameters: {
      type: 'object',
      properties: {
        filters: {
          type: 'array',
          description: 'Optional filters to apply before calculating',
          items: {
            type: 'object',
            properties: {
              column: { type: 'string' },
              operator: { type: 'string' },
              value: { type: ['string', 'number'] }
            }
          }
        }
      }
    }
  },
  
  {
    name: 'calculateAverageValue',
    description: `Calculate the average contract value, optionally filtered.
    Example: "what's the average value of our contracts?"`,
    parameters: {
      type: 'object',
      properties: {
        filters: {
          type: 'array',
          description: 'Optional filters to apply before calculating',
          items: {
            type: 'object',
            properties: {
              column: { type: 'string' },
              operator: { type: 'string' },
              value: { type: ['string', 'number'] }
            }
          }
        }
      }
    }
  },
  
  {
    name: 'calculateContractDuration',
    description: `Calculate duration in days for a specific contract or all contracts.
    Example: "how long is contract abc123?"
    Example: "show me contract durations"`,
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'Optional: specific contract ID. If omitted, calculates for all contracts'
        }
      }
    }
  },
  
  {
    name: 'calculateMonthlyValue',
    description: `Calculate monthly value (total value / duration in months) for contracts.
    Example: "what's the monthly value of contract abc123?"`,
    parameters: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'Optional: specific contract ID. If omitted, calculates for all contracts'
        }
      }
    }
  },
  
  {
    name: 'getExpiringContracts',
    description: `Get contracts expiring within a specified number of days.
    Example: "show me contracts expiring in the next 30 days"
    Example: "which contracts are expiring soon?"`,
    parameters: {
      type: 'object',
      properties: {
        daysAhead: {
          type: 'number',
          description: 'Number of days to look ahead',
          default: 30
        }
      }
    }
  },
  
  {
    name: 'groupByClient',
    description: `Group contracts by client and show aggregated data (count, total value, avg value).
    Example: "show me contracts grouped by client"
    Example: "which client has the most contract value?"`,
    parameters: {
      type: 'object',
      properties: {
        sortBy: {
          type: 'string',
          description: 'How to sort the grouped results',
          enum: ['totalValue', 'averageValue', 'contractCount', 'clientName'],
          default: 'totalValue'
        },
        sortDirection: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc'
        }
      }
    }
  },
  
  {
    name: 'groupByStatus',
    description: `Group contracts by status and show aggregated data.
    Example: "show me contract breakdown by status"`,
    parameters: {
      type: 'object',
      properties: {
        includeValue: {
          type: 'boolean',
          description: 'Include total value per status',
          default: true
        }
      }
    }
  },
  
  {
    name: 'setPageSize',
    description: `Change how many contracts are displayed per page.
    Example: "show 50 contracts per page"`,
    parameters: {
      type: 'object',
      properties: {
        pageSize: {
          type: 'number',
          description: 'Number of rows per page',
          enum: [10, 20, 50, 100]
        }
      },
      required: ['pageSize']
    }
  },
  
  {
    name: 'goToPage',
    description: `Navigate to a specific page number.
    Example: "go to page 3"`,
    parameters: {
      type: 'object',
      properties: {
        pageNumber: {
          type: 'number',
          description: 'Page number (1-indexed)',
          minimum: 1
        }
      },
      required: ['pageNumber']
    }
  }
];
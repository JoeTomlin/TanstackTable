import { useState, useEffect, useCallback } from 'react';
import DataTable from './components/DataTable';
import ChatInterface from './components/ChatInterface';
import { useChat } from './hooks/useChat';
import type { Contract, ToolResult } from './types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

const API_BASE = 'http://localhost:8787';

// Neumorphism shadow styles
const neumorph = {
  raised: {
    boxShadow: '8px 8px 16px #d4cfc6, -8px -8px 16px #ffffff',
    borderRadius: '24px',
  },
  pressed: {
    boxShadow: 'inset 4px 4px 8px #d4cfc6, inset -4px -4px 8px #ffffff',
    borderRadius: '16px',
  },
  subtle: {
    boxShadow: '4px 4px 10px #d4cfc6, -4px -4px 10px #ffffff',
    borderRadius: '16px',
  }
};

function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // Load initial contracts
  useEffect(() => {
    fetch(`${API_BASE}/tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'getContracts',
        args: { includeCalculations: true }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.contracts) {
          setContracts(data.contracts);
        }
      })
      .catch(console.error);
  }, []);

  // Handle tool results from AI
  const handleToolResult = useCallback((result: ToolResult) => {
    console.log('Tool result:', result);

    if (result.action === 'filter' && result.filter) {
      const { column, operator, value } = result.filter;
      setColumnFilters([{ id: column, value: { operator, value } }]);
    }

    if (result.action === 'clearFilters') {
      setColumnFilters([]);
      setGlobalFilter('');
    }

    if (result.action === 'sort' && result.sort) {
      setSorting([{ id: result.sort.column, desc: result.sort.direction === 'desc' }]);
    }

    if (result.action === 'clearSort') {
      setSorting([]);
    }

    if (result.action === 'search' && result.search) {
      setGlobalFilter(result.search.query);
    }

    if (result.action === 'setPageSize') {
      setPageSize(result.message?.match(/\d+/)?.[0] ? parseInt(result.message.match(/\d+/)![0]) : 10);
    }

    if (result.action === 'goToPage') {
      const pageNum = result.message?.match(/\d+/)?.[0];
      if (pageNum) setPageIndex(parseInt(pageNum) - 1);
    }

    // Refresh data if contracts were modified
    if (result.contracts) {
      setContracts(result.contracts);
    } else if (result.contract || result.success) {
      fetch(`${API_BASE}/tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'getContracts',
          args: { includeCalculations: true }
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.contracts) {
            setContracts(data.contracts);
          }
        })
        .catch(console.error);
    }
  }, []);

  const { messages, isLoading, sendMessage } = useChat(handleToolResult);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#e8e0d5', padding: '24px', gap: '24px' }}>
      {/* Table Section - 2/3 width */}
      <div style={{ width: '66.666%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          ...neumorph.raised, 
          backgroundColor: '#e8e0d5',
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
            borderRadius: '24px 24px 0 0',
          }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              color: 'white',
              fontFamily: "'Inter', system-ui, sans-serif",
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Contracts Dashboard
            </h1>
            <p style={{ color: '#e9d5ff', marginTop: '6px', fontSize: '0.875rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
              {contracts.length} total contracts • Powered by AI
            </p>
          </div>
          
          {/* Table Container */}
          <div style={{ flex: 1, padding: '20px', overflow: 'hidden', backgroundColor: '#e8e0d5' }}>
            <DataTable
              data={contracts}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              pageSize={pageSize}
              setPageSize={setPageSize}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
            />
          </div>
        </div>
      </div>

      {/* Chat Section - 1/3 width */}
      <div style={{ width: '33.333%' }}>
        <div style={{ 
          ...neumorph.raised, 
          backgroundColor: '#e8e0d5',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect, useCallback } from 'react';
import DataTable from './components/DataTable';
import ChatInterface from './components/ChatInterface';
import { useChat } from './hooks/useChat';
import type { Contract, ToolResult } from './types';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

const API_BASE = 'http://localhost:8787';

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
      // Refresh from backend when a contract was added/modified
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
    <div className="flex h-screen bg-gray-50">
      {/* Table Section */}
      <div className="w-2/3 p-6">
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">Contracts Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              {contracts.length} total contracts
            </p>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
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

      {/* Chat Section */}
      <div className="w-1/3 border-l">
        <div className="h-full bg-white shadow-lg">
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

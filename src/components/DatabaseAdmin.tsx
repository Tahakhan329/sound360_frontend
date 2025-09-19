import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Table, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  RefreshCw,
  Eye,
  Filter,
  Settings,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Users,
  MessageSquare,
  Activity
} from 'lucide-react';

interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  engine: string;
  collation: string;
}

interface TableData {
  columns: string[];
  rows: any[][];
  total_rows: number;
  page: number;
  per_page: number;
}

const DatabaseAdmin: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  const queryClient = useQueryClient();

  // Fetch database tables
  const { data: tables, isLoading: tablesLoading } = useQuery<DatabaseTable[]>({
    queryKey: ['database-tables'],
    queryFn: async () => {
      const response = await fetch('/api/admin/database/tables');
      return response.json();
    },
  });

  // Fetch table data
  const { data: tableData, isLoading: dataLoading } = useQuery<TableData>({
    queryKey: ['table-data', selectedTable, currentPage, searchTerm],
    queryFn: async () => {
      if (!selectedTable) return null;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '50',
        search: searchTerm
      });
      const response = await fetch(`/api/admin/database/tables/${selectedTable}/data?${params}`);
      return response.json();
    },
    enabled: !!selectedTable,
  });

  // Execute SQL query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResults(data);
      queryClient.invalidateQueries({ queryKey: ['database-tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-data'] });
    },
  });

  // Delete row mutation
  const deleteRowMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: any }) => {
      const response = await fetch(`/api/admin/database/tables/${table}/rows/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-data'] });
    },
  });

  const handleExecuteQuery = () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingQuery(true);
    executeQueryMutation.mutate(sqlQuery);
    setTimeout(() => setIsExecutingQuery(false), 1000);
  };

  const handleDeleteRow = (id: any) => {
    if (confirm('Are you sure you want to delete this row?')) {
      deleteRowMutation.mutate({ table: selectedTable, id });
    }
  };

  const getTableIcon = (tableName: string) => {
    if (tableName.includes('user')) return Users;
    if (tableName.includes('conversation')) return MessageSquare;
    if (tableName.includes('metric')) return Activity;
    return Table;
  };

  const formatCellValue = (value: any) => {
    if (value === null) return <span className="text-gray-500 italic">NULL</span>;
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Database Administration</h1>
          <p className="text-gray-400 mt-1">Manage MySQL database tables and data</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Tables</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{tables?.length || 0}</p>
            </div>
            <Database className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {tables?.reduce((sum, table) => sum + table.rows, 0) || 0}
              </p>
            </div>
            <Table className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Database Size</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {tables?.reduce((sum, table) => sum + parseFloat(table.size), 0).toFixed(1) || 0} MB
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Connection</p>
              <p className="text-2xl font-bold text-green-400 mt-1">MySQL</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* SQL Query Interface */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
          <Play className="w-6 h-6 text-green-400 mr-2" />
          SQL Query Interface
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SQL Query
            </label>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
              placeholder="SELECT * FROM users LIMIT 10;"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExecuteQuery}
              disabled={!sqlQuery.trim() || isExecutingQuery}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isExecutingQuery ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>Execute Query</span>
            </button>
            
            <button
              onClick={() => setSqlQuery('')}
              className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Clear
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Be careful with DELETE and UPDATE queries</span>
            </div>
          </div>
        </div>

        {/* Query Results */}
        {queryResults && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-100 mb-3">Query Results</h4>
            {queryResults.error ? (
              <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 font-medium">Error:</p>
                <p className="text-red-300 text-sm mt-1">{queryResults.error}</p>
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="p-3 bg-gray-600 border-b border-gray-500">
                  <p className="text-sm text-gray-300">
                    {queryResults.rows?.length || 0} rows returned
                    {queryResults.execution_time && ` in ${queryResults.execution_time}ms`}
                  </p>
                </div>
                {queryResults.rows && queryResults.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-600">
                        <tr>
                          {queryResults.columns?.map((col: string, index: number) => (
                            <th key={index} className="px-4 py-2 text-left text-gray-300 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {queryResults.rows.slice(0, 100).map((row: any[], rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-600">
                            {row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="px-4 py-2 text-gray-300">
                                {formatCellValue(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tables and Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100">Database Tables</h3>
          </div>
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
            {tablesLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading tables...</p>
              </div>
            ) : tables?.length === 0 ? (
              <div className="p-6 text-center">
                <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No tables found</p>
              </div>
            ) : (
              tables?.map((table) => {
                const TableIcon = getTableIcon(table.name);
                return (
                  <motion.div
                    key={table.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTable === table.name 
                        ? 'bg-blue-600 bg-opacity-20 border-r-4 border-blue-500' 
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TableIcon className="w-5 h-5 text-blue-400" />
                        <div>
                          <h4 className="font-medium text-gray-100">{table.name}</h4>
                          <p className="text-sm text-gray-400">{table.rows} rows</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-300">{table.size}</p>
                        <p className="text-xs text-gray-500">{table.engine}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Table Data */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">
                {selectedTable ? `Table: ${selectedTable}` : 'Select a table'}
              </h3>
              {selectedTable && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedTable ? (
            <div className="p-6">
              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading data...</p>
                </div>
              ) : tableData?.rows?.length === 0 ? (
                <div className="text-center py-8">
                  <Table className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No data found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Data */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-700">
                        <tr>
                          {tableData?.columns?.map((column, index) => (
                            <th key={index} className="px-4 py-3 text-left text-gray-300 font-medium">
                              {column}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right text-gray-300 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {tableData?.rows?.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-700">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-gray-300">
                                {formatCellValue(cell)}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingRow(row);
                                    setShowEditModal(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(row[0])}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {tableData && tableData.total_rows > tableData.per_page && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        Showing {((currentPage - 1) * tableData.per_page) + 1} to {Math.min(currentPage * tableData.per_page, tableData.total_rows)} of {tableData.total_rows} records
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-gray-300">Page {currentPage}</span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage * tableData.per_page >= tableData.total_rows}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Database className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-100 mb-2">Select a Table</h3>
              <p className="text-gray-400">Choose a table from the left to view and manage its data</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSqlQuery('SELECT * FROM users ORDER BY created_at DESC LIMIT 10;')}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
          >
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <h4 className="font-medium text-gray-100">Recent Users</h4>
            <p className="text-sm text-gray-400">View latest registered users</p>
          </button>
          
          <button
            onClick={() => setSqlQuery('SELECT * FROM conversations ORDER BY timestamp DESC LIMIT 10;')}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
          >
            <MessageSquare className="w-6 h-6 text-green-400 mb-2" />
            <h4 className="font-medium text-gray-100">Recent Conversations</h4>
            <p className="text-sm text-gray-400">View latest conversations</p>
          </button>
          
          <button
            onClick={() => setSqlQuery('SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT 10;')}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
          >
            <Activity className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="font-medium text-gray-100">System Metrics</h4>
            <p className="text-sm text-gray-400">View system performance data</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAdmin;
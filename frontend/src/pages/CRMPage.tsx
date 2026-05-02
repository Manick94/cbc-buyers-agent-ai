import { useState, useEffect } from 'react'
import { Search, Filter, RefreshCw, Users } from 'lucide-react'
import CustomerTable from '../components/crm/CustomerTable'
import CustomerDetail from '../components/crm/CustomerDetail'
import AIQueryPanel from '../components/crm/AIQueryPanel'
import { customersApi } from '../services/api'
import type { Customer } from '../types'

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [selected, setSelected] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadCustomers() }, [])

  useEffect(() => {
    let results = customers
    if (search) {
      const q = search.toLowerCase()
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      )
    }
    if (statusFilter) results = results.filter(c => c.status === statusFilter)
    setFiltered(results)
  }, [customers, search, statusFilter])

  async function loadCustomers() {
    setIsLoading(true)
    try {
      const result = await customersApi.list()
      setCustomers(result.data)
      setFiltered(result.data)
    } finally {
      setIsLoading(false)
    }
  }

  function handleQueryResults(queryCustomers: Customer[]) {
    setFiltered(queryCustomers)
  }

  const statuses = ['active', 'qualified', 'converted', 'lost']

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Customer Insights</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{filtered.length} customers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30 transition-all">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-44"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <Filter size={13} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>

          <button
            onClick={loadCustomers}
            disabled={isLoading}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-500 hover:border-indigo-200 transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content — always two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: table + query */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
            ) : (
              <CustomerTable customers={filtered} selectedId={selected?.customer_id} onSelect={setSelected} />
            )}
          </div>
          <AIQueryPanel onResults={handleQueryResults} />
        </div>

        {/* Right: detail panel — always present */}
        <div className="w-80 shrink-0 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
          {selected ? (
            <CustomerDetail customer={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Users size={22} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No customer selected</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click a row to view profile and AI insights</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

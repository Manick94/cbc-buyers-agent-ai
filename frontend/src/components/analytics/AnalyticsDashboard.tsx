import { useEffect, useState } from 'react'
import { Users, MessageSquare, TrendingUp, DollarSign, Bot } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsApi } from '../../services/api'
import type { AnalyticsSummary } from '../../types'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<{ date: string; count: number }[]>([])
  const [budgetDist, setBudgetDist] = useState<{ label: string; count: number }[]>([])
  const [locationData, setLocationData] = useState<{ location: string; count: number; avg_budget: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.trends(),
      analyticsApi.budgetDistribution(),
      analyticsApi.locationBreakdown(),
    ]).then(([s, t, b, l]) => {
      setSummary(s)
      setTrends(t)
      setBudgetDist(b)
      setLocationData(l)
    }).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading analytics...</div>
      </div>
    )
  }

  const funnelData = summary ? [
    { name: 'Total', value: summary.totalCustomers, fill: '#6366f1' },
    { name: 'Active', value: summary.statusBreakdown['active'] ?? 0, fill: '#8b5cf6' },
    { name: 'Qualified', value: summary.statusBreakdown['qualified'] ?? 0, fill: '#06b6d4' },
    { name: 'Converted', value: summary.statusBreakdown['converted'] ?? 0, fill: '#10b981' },
  ] : []

  const llmPieData = summary ? Object.entries(summary.llmUsage).map(([name, value]) => ({
    name: name.replace('cloud_', '').replace('_', ' '),
    value,
  })) : []

  const intentData = [
    { name: 'Personal', value: 60 },
    { name: 'Investment', value: 40 },
  ]

  const aiInsights = [
    'Most buyers prefer apartments in Sydney CBD and Inner West',
    'Peak inquiry time: weekday evenings (6–9 PM)',
    'Top converting segment: $750K–$1M budget range',
    'Gemini-assisted conversations show 15% higher conversion rate',
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics & Performance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time insights across all customer interactions</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={16} className="text-indigo-500" />}
            label="Total Customers"
            value={String(summary?.totalCustomers ?? 0)}
            color="bg-indigo-50"
          />
          <StatCard
            icon={<MessageSquare size={16} className="text-blue-500" />}
            label="Active Conversations"
            value={String(summary?.activeConversations ?? 0)}
            color="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-emerald-500" />}
            label="Conversion Rate"
            value={`${summary?.conversionRate ?? 0}%`}
            color="bg-emerald-50"
          />
          <StatCard
            icon={<DollarSign size={16} className="text-amber-500" />}
            label="Avg Deal Value"
            value={summary?.avgBudget ? `$${(summary.avgBudget / 1000).toFixed(0)}K` : '—'}
            color="bg-amber-50"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Interactions Over Time (30 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Interactions" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">LLM Usage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={llmPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {llmPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Budget Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={budgetDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={70} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Buyers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Funnel</h3>
            <ResponsiveContainer width="100%" height={180}>
              <FunnelChart>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Buyer Intent</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={intentData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                  <Cell fill="#6366f1" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-2 space-y-1">
              {locationData.slice(0, 3).map(l => (
                <div key={l.location} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{l.location}</span>
                  <span className="font-medium text-gray-700">{l.count} buyers</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-indigo-800">AI Insights Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {aiInsights.map(insight => (
              <div key={insight} className="flex items-start gap-2 bg-white/60 rounded-xl px-3 py-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <p className="text-xs text-indigo-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

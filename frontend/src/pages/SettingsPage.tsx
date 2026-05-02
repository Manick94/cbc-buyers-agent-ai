import APIKeyManager from '../components/settings/APIKeyManager'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-400">Configure AI providers and preferences</p>
          </div>
        </div>
        <APIKeyManager />
      </div>
    </div>
  )
}

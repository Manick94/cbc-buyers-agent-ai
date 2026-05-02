import { Mic, X } from 'lucide-react'

interface Props {
  isActive: boolean
  transcript: string
  onClose: () => void
}

export default function VoiceMode({ isActive, transcript, onClose }: Props) {
  if (!isActive) return null

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
          <Mic size={36} className="text-white" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-300 animate-ping opacity-60" />
        <div className="absolute -inset-3 rounded-full border-2 border-indigo-200 animate-pulse opacity-40" />
      </div>

      <p className="mt-6 text-lg font-medium text-gray-700">Listening...</p>

      {transcript && (
        <div className="mt-3 px-6 py-3 bg-gray-50 rounded-xl max-w-sm text-center">
          <p className="text-sm text-gray-600 italic">"{transcript}"</p>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm"
      >
        <X size={14} />
        Cancel
      </button>
    </div>
  )
}

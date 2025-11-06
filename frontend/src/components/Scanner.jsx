import { useState } from 'react'
import { useStore } from '../store/useStore'

function Scanner({ onClose }) {
  const { scanDirectory, fetchMedia } = useStore()
  const [directory, setDirectory] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!directory.trim()) return

    setIsScanning(true)
    try {
      await scanDirectory(directory.trim())
      // Wait a bit for the scan to process
      setTimeout(async () => {
        await fetchMedia()
        setIsScanning(false)
        onClose()
      }, 2000)
    } catch (error) {
      alert('Failed to scan directory: ' + error.message)
      setIsScanning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-white mb-4">Scan Directory</h2>

        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Directory Path
            </label>
            <input
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="/path/to/your/media"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isScanning}
            />
            <p className="mt-2 text-xs text-gray-400">
              Enter the full path to the directory containing your media files.
              The scanner will search recursively.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isScanning}
              className="flex-1 py-3 bg-gray-700 rounded-lg font-medium active:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScanning || !directory.trim()}
              className="flex-1 py-3 bg-blue-600 rounded-lg font-medium active:bg-blue-700 disabled:opacity-50"
            >
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Scanner

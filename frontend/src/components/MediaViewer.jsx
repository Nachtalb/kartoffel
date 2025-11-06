import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import CategorySelector from './CategorySelector'

function MediaViewer({ item, onClose }) {
  const { categorizeMedia, fetchMedia } = useStore()
  const [showCategorySelector, setShowCategorySelector] = useState(false)

  const handleCategorize = async (categoryIds) => {
    try {
      await categorizeMedia(item.id, categoryIds)
      setShowCategorySelector(false)
      await fetchMedia()
    } catch (error) {
      console.error('Failed to categorize:', error)
    }
  }

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur p-4 flex items-center justify-between">
        <div className="flex-1 truncate">
          <p className="text-white text-sm truncate">{item.filename}</p>
          <p className="text-gray-400 text-xs">
            {item.width && item.height && `${item.width} × ${item.height}`}
            {item.size && ` • ${(item.size / 1024 / 1024).toFixed(2)} MB`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-2 text-white hover:bg-gray-800 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {item.type === 'video' ? (
          <video
            src={`/media/${item.path}`}
            className="max-w-full max-h-full"
            controls
            autoPlay
          />
        ) : (
          <img
            src={`/media/${item.path}`}
            alt={item.filename}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-900/80 backdrop-blur p-4">
        <button
          onClick={() => setShowCategorySelector(true)}
          className="w-full py-3 bg-blue-600 rounded-lg font-medium active:bg-blue-700"
        >
          Categorize
        </button>
      </div>

      {showCategorySelector && (
        <CategorySelector
          onSelect={handleCategorize}
          onClose={() => setShowCategorySelector(false)}
        />
      )}
    </div>
  )
}

export default MediaViewer

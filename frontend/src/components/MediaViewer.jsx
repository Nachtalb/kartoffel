import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import CategorySelector from './CategorySelector'

function MediaViewer({ item, onClose, onNext, onPrevious }) {
  const { categorizeMedia, fetchMedia, deleteMedia } = useStore()
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleCategorize = async (categoryIds) => {
    try {
      await categorizeMedia(item.id, categoryIds)
      setShowCategorySelector(false)
      await fetchMedia()
    } catch (error) {
      console.error('Failed to categorize:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMedia(item.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Failed to delete media:', error)
      alert('Failed to delete file')
    }
  }

  // Prevent body scroll when viewer is open and handle keyboard shortcuts
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext()
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, onNext, onPrevious])

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
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
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

        {/* Navigation Buttons */}
        {onPrevious && (
          <button
            onClick={onPrevious}
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-900/80 hover:bg-gray-800/90 text-white rounded-full transition-all backdrop-blur"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {onNext && (
          <button
            onClick={onNext}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-900/80 hover:bg-gray-800/90 text-white rounded-full transition-all backdrop-blur"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-900/80 backdrop-blur p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategorySelector(true)}
            className="flex-1 py-3 bg-blue-600 rounded-lg font-medium active:bg-blue-700"
          >
            Categorize
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-3 bg-red-600 rounded-lg font-medium active:bg-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {showCategorySelector && (
        <CategorySelector
          onSelect={handleCategorize}
          onClose={() => setShowCategorySelector(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete File?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete this file? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-700 rounded-lg font-medium active:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 rounded-lg font-medium active:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaViewer

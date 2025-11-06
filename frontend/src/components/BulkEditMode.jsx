import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import MediaItem from './MediaItem'
import CategorySelector from './CategorySelector'

function BulkEditMode() {
  const { media, selectedMedia, setSelection, clearSelection, bulkCategorize, fetchMedia } = useStore()
  const [isSelecting, setIsSelecting] = useState(false)
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [autoScrollInterval, setAutoScrollInterval] = useState(null)
  const [startIndex, setStartIndex] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(null)
  const containerRef = useRef(null)

  // Handle click/tap to start selection
  const handleItemClick = (item, index) => {
    if (!isSelecting) {
      // First click - start selection
      setIsSelecting(true)
      setStartIndex(index)
      setCurrentIndex(index)
      setSelection([item.id])
    }
  }

  const selectRange = (start, end) => {
    const minIndex = Math.min(start, end)
    const maxIndex = Math.max(start, end)
    const selectedIds = media.slice(minIndex, maxIndex + 1).map(m => m.id)
    setSelection(selectedIds)
  }

  const handleTouchMove = (e) => {
    if (isSelecting) {
      e.preventDefault()
      const touch = e.touches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)

      if (element) {
        const mediaElement = element.closest('[data-media-index]')
        if (mediaElement) {
          const index = parseInt(mediaElement.dataset.mediaIndex)
          if (index !== currentIndex) {
            setCurrentIndex(index)
            selectRange(startIndex, index)
          }
        }
      }

      // Auto-scroll logic
      const scrollThreshold = 100
      const scrollSpeed = 5

      if (touch.clientY < scrollThreshold && containerRef.current) {
        // Scroll up
        if (!autoScrollInterval) {
          const interval = setInterval(() => {
            containerRef.current.scrollTop -= scrollSpeed
          }, 16)
          setAutoScrollInterval(interval)
        }
      } else if (touch.clientY > window.innerHeight - scrollThreshold && containerRef.current) {
        // Scroll down
        if (!autoScrollInterval) {
          const interval = setInterval(() => {
            containerRef.current.scrollTop += scrollSpeed
          }, 16)
          setAutoScrollInterval(interval)
        }
      } else {
        // Stop auto-scroll
        if (autoScrollInterval) {
          clearInterval(autoScrollInterval)
          setAutoScrollInterval(null)
        }
      }
    }
  }

  const handleTouchEnd = () => {
    setIsSelecting(false)

    if (autoScrollInterval) {
      clearInterval(autoScrollInterval)
      setAutoScrollInterval(null)
    }
  }

  const handleCategorize = async (categoryIds) => {
    if (selectedMedia.size === 0) return

    try {
      await bulkCategorize(Array.from(selectedMedia), categoryIds)
      clearSelection()
      setShowCategorySelector(false)
      // Refresh media
      await fetchMedia()
    } catch (error) {
      console.error('Failed to categorize:', error)
    }
  }

  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval)
      }
    }
  }, [autoScrollInterval])

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
          {media.map((item, index) => (
            <div
              key={item.id}
              data-media-id={item.id}
              data-media-index={index}
              onClick={() => handleItemClick(item, index)}
              onTouchStart={() => handleItemClick(item, index)}
            >
              <MediaItem
                item={item}
                isSelected={selectedMedia.has(item.id)}
                showCheckbox
              />
            </div>
          ))}
        </div>

        {media.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">No media found</p>
              <p className="text-sm">Click "Scan" to index your media files</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedMedia.size > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex gap-2">
          <div className="flex-1 flex items-center text-sm">
            {selectedMedia.size} selected
          </div>
          <button
            onClick={() => setShowCategorySelector(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg font-medium active:bg-blue-700"
          >
            Categorize
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 bg-gray-700 rounded-lg font-medium active:bg-gray-600"
          >
            Clear
          </button>
        </div>
      )}

      {showCategorySelector && (
        <CategorySelector
          onSelect={handleCategorize}
          onClose={() => setShowCategorySelector(false)}
        />
      )}
    </div>
  )
}

export default BulkEditMode

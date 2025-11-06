import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import MediaItem from './MediaItem'
import CategorySelector from './CategorySelector'

function BulkEditMode() {
  const { media, selectedMedia, toggleSelection, clearSelection, bulkCategorize, fetchMedia } = useStore()
  const [isSelecting, setIsSelecting] = useState(false)
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [autoScrollInterval, setAutoScrollInterval] = useState(null)
  const containerRef = useRef(null)
  const longPressTimer = useRef(null)
  const lastSelectedIndex = useRef(null)

  const handleTouchStart = (e, item, index) => {
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsSelecting(true)
      toggleSelection(item.id)
      lastSelectedIndex.current = index
    }, 300) // 300ms for long press
  }

  const handleTouchMove = (e) => {
    // Cancel long press if moved too much
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (isSelecting) {
      e.preventDefault()
      const touch = e.touches[0]
      const element = document.elementFromPoint(touch.clientX, touch.clientY)

      if (element) {
        const mediaElement = element.closest('[data-media-id]')
        if (mediaElement) {
          const mediaId = parseInt(mediaElement.dataset.mediaId)
          if (!selectedMedia.has(mediaId)) {
            toggleSelection(mediaId)
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
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

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
              onTouchStart={(e) => handleTouchStart(e, item, index)}
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

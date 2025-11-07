import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import MediaItem from './MediaItem'
import CategorySelector from './CategorySelector'

function BulkEditMode() {
  const { media, selectedMedia, toggleSelection, setSelection, clearSelection, bulkCategorize, fetchMedia, categories } = useStore()
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [autoScrollInterval, setAutoScrollInterval] = useState(null)
  const [lastClickedIndex, setLastClickedIndex] = useState(null)
  const [touchStartPos, setTouchStartPos] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  // Handle click with modifier keys
  const handleItemClick = (e, item, index) => {
    e.preventDefault()

    if (e.shiftKey && lastClickedIndex !== null) {
      // Shift+click: select range
      const minIndex = Math.min(lastClickedIndex, index)
      const maxIndex = Math.max(lastClickedIndex, index)
      const rangeIds = media.slice(minIndex, maxIndex + 1).map(m => m.id)

      // Add to existing selection
      const newSelection = new Set(selectedMedia)
      rangeIds.forEach(id => newSelection.add(id))
      setSelection(Array.from(newSelection))
    } else {
      // Regular click: toggle selection
      toggleSelection(item.id)
      setLastClickedIndex(index)
    }
  }

  // Touch handlers for mobile
  const handleTouchStart = (e, item, index) => {
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY, time: Date.now() })
    setIsDragging(false)
  }

  const handleTouchMove = (e) => {
    if (!touchStartPos) return

    const touch = e.touches[0]
    const dx = touch.clientX - touchStartPos.x
    const dy = touch.clientY - touchStartPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const timeSinceStart = Date.now() - touchStartPos.time

    // Only start dragging if moved more than 20px within first 300ms
    if (distance > 20 && timeSinceStart < 300) {
      setIsDragging(true)
    }

    if (isDragging) {
      e.preventDefault()
      const element = document.elementFromPoint(touch.clientX, touch.clientY)

      if (element) {
        const mediaElement = element.closest('[data-media-index]')
        if (mediaElement) {
          const index = parseInt(mediaElement.dataset.mediaIndex)
          const mediaId = parseInt(mediaElement.dataset.mediaId)

          // Add to selection if not already selected
          if (!selectedMedia.has(mediaId)) {
            toggleSelection(mediaId)
          }
        }
      }

      // Auto-scroll logic
      const scrollThreshold = 100
      const scrollSpeed = 5

      if (touch.clientY < scrollThreshold && containerRef.current) {
        if (!autoScrollInterval) {
          const interval = setInterval(() => {
            containerRef.current.scrollTop -= scrollSpeed
          }, 16)
          setAutoScrollInterval(interval)
        }
      } else if (touch.clientY > window.innerHeight - scrollThreshold && containerRef.current) {
        if (!autoScrollInterval) {
          const interval = setInterval(() => {
            containerRef.current.scrollTop += scrollSpeed
          }, 16)
          setAutoScrollInterval(interval)
        }
      } else {
        if (autoScrollInterval) {
          clearInterval(autoScrollInterval)
          setAutoScrollInterval(null)
        }
      }
    }
  }

  const handleTouchEnd = (e, item, index) => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval)
      setAutoScrollInterval(null)
    }

    // If not dragging and tap was quick, toggle selection
    if (!isDragging && touchStartPos) {
      const timeSinceStart = Date.now() - touchStartPos.time
      if (timeSinceStart < 300) {
        toggleSelection(item.id)
        setLastClickedIndex(index)
      }
    }

    setTouchStartPos(null)
    setIsDragging(false)
  }

  const handleCategorize = async (categoryIds) => {
    if (selectedMedia.size === 0) return

    try {
      await bulkCategorize(Array.from(selectedMedia), categoryIds)
      clearSelection()
      setShowCategorySelector(false)
      await fetchMedia()
    } catch (error) {
      console.error('Failed to categorize:', error)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const key = parseInt(e.key)
      if (key >= 1 && key <= 9 && categories[key - 1]) {
        e.preventDefault()
        const category = categories[key - 1]
        handleCategorize([category.id])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval)
      }
    }
  }, [categories, selectedMedia, autoScrollInterval])

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        onTouchMove={handleTouchMove}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
          {media.map((item, index) => (
            <div
              key={item.id}
              data-media-id={item.id}
              data-media-index={index}
              onClick={(e) => handleItemClick(e, item, index)}
              onTouchStart={(e) => handleTouchStart(e, item, index)}
              onTouchEnd={(e) => handleTouchEnd(e, item, index)}
            >
              <MediaItem
                item={item}
                isSelected={selectedMedia.has(item.id)}
                showCheckbox
                showCategories
              />
            </div>
          ))}
        </div>

        {media.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">No media found</p>
              <p className="text-sm">Click "Refresh" to index your media files</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedMedia.size > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex gap-2 mb-2">
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

          {/* Quick category buttons with keyboard shortcuts */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 9).map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorize([category.id])}
                  className="px-3 py-1 rounded text-white text-sm font-medium active:opacity-80"
                  style={{ backgroundColor: category.color }}
                  title={`Press ${index + 1} to categorize`}
                >
                  <span className="hidden sm:inline">{index + 1}. </span>
                  {category.name}
                </button>
              ))}
            </div>
          )}
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

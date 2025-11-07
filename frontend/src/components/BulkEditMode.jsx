import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import MediaItem from './MediaItem'
import CategorySelector from './CategorySelector'
import CategoryLegend from './CategoryLegend'

function BulkEditMode({ onRefresh }) {
  const { media, selectedMedia, toggleSelection, setSelection, clearSelection, bulkCategorize, categories, deleteMedia } = useStore()
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [autoScrollInterval, setAutoScrollInterval] = useState(null)
  const [lastClickedIndex, setLastClickedIndex] = useState(null)
  const [lastShiftRange, setLastShiftRange] = useState(null)
  const [touchStartPos, setTouchStartPos] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [lastTouchTime, setLastTouchTime] = useState(0)
  const containerRef = useRef(null)

  // Handle click with modifier keys
  const handleItemClick = (e, item, index) => {
    e.preventDefault()

    // Ignore click events that come immediately after touch events (ghost clicks)
    if (Date.now() - lastTouchTime < 500) {
      return
    }

    if (e.shiftKey && lastClickedIndex !== null) {
      // Shift+click: select range from last clicked index to current
      const minIndex = Math.min(lastClickedIndex, index)
      const maxIndex = Math.max(lastClickedIndex, index)
      const rangeIds = media.slice(minIndex, maxIndex + 1).map(m => m.id)

      // Start with current selection
      const newSelection = new Set(selectedMedia)

      // Remove previous shift-range if it exists
      if (lastShiftRange) {
        lastShiftRange.forEach(id => newSelection.delete(id))
      }

      // Add new shift-range
      rangeIds.forEach(id => newSelection.add(id))
      setSelection(Array.from(newSelection))

      // Track this shift-range for next shift-click
      setLastShiftRange(rangeIds)
    } else {
      // Regular click: toggle selection and clear shift-range
      toggleSelection(item.id)
      setLastClickedIndex(index)
      setLastShiftRange(null)
    }
  }

  // Touch handlers for mobile - long press selection like Android gallery
  const handleTouchStart = (e, item, index) => {
    const touch = e.touches[0]
    setTouchStartPos({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      item,
      index
    })
    setIsDragging(false)
    setIsLongPressing(false)

    // Start long-press timer (400ms)
    const timer = setTimeout(() => {
      if (!touchStartPos) return // Check if touch was cancelled

      setIsLongPressing(true)
      setIsDragging(true)
      // Select the item on long press
      if (!selectedMedia.has(item.id)) {
        toggleSelection(item.id)
      }
      // Vibrate on long press (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 400)
    setLongPressTimer(timer)
  }

  const handleTouchMove = (e) => {
    if (!touchStartPos) return

    const touch = e.touches[0]
    const dx = touch.clientX - touchStartPos.x
    const dy = touch.clientY - touchStartPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Cancel long press if moved too much before timer completes (30px threshold)
    if (distance > 30 && !isLongPressing) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      setTouchStartPos(null)
      return
    }

    // If long press activated, enable dragging selection
    if (isLongPressing) {
      e.preventDefault()
      const element = document.elementFromPoint(touch.clientX, touch.clientY)

      if (element) {
        const mediaElement = element.closest('[data-media-index]')
        if (mediaElement) {
          const mediaId = parseInt(mediaElement.dataset.mediaId)

          // Add to selection if not already selected
          if (!selectedMedia.has(mediaId)) {
            toggleSelection(mediaId)
          }
        }
      }

      // Auto-scroll logic
      const scrollThreshold = 100
      const scrollSpeed = 8

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
    // Clear timers
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval)
      setAutoScrollInterval(null)
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    // If not long pressing and tap was quick, toggle selection
    if (!isLongPressing && !isDragging && touchStartPos) {
      const timeSinceStart = Date.now() - touchStartPos.time
      if (timeSinceStart < 400) {
        e.preventDefault() // Prevent click event from firing
        setLastTouchTime(Date.now()) // Track touch time to ignore ghost clicks
        toggleSelection(item.id)
        setLastClickedIndex(index)
        setLastShiftRange(null)
      }
    }

    // If was long pressing, prevent click
    if (isLongPressing) {
      e.preventDefault()
      setLastTouchTime(Date.now())
    }

    setTouchStartPos(null)
    setIsDragging(false)
    setIsLongPressing(false)
  }

  const handleCategorize = async (categoryIds) => {
    if (selectedMedia.size === 0) return

    try {
      await bulkCategorize(Array.from(selectedMedia), categoryIds)
      clearSelection()
      setShowCategorySelector(false)
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Failed to categorize:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMedia.size === 0) return

    try {
      const selectedIds = Array.from(selectedMedia)

      // Delete each file
      for (const mediaId of selectedIds) {
        await deleteMedia(mediaId)
      }

      clearSelection()
      setShowDeleteConfirm(false)
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete media:', error)
      alert('Failed to delete some files')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // ESC to clear selection
      if (e.key === 'Escape') {
        e.preventDefault()
        clearSelection()
        setLastShiftRange(null)
        return
      }

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
  }, [categories, selectedMedia, autoScrollInterval, clearSelection])

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
              onContextMenu={(e) => e.preventDefault()}
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
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

      {/* Action Bar - Fixed at bottom */}
      {selectedMedia.size > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 p-3 sm:p-4 flex-shrink-0">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center text-sm font-medium">
              {selectedMedia.size} selected
            </div>
            <button
              onClick={() => setShowCategorySelector(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium active:bg-blue-700 whitespace-nowrap"
            >
              Categorize
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 sm:px-4 py-2 bg-red-600 rounded-lg text-sm font-medium active:bg-red-700 whitespace-nowrap"
            >
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="px-3 sm:px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium active:bg-gray-600 whitespace-nowrap"
            >
              Clear
            </button>
          </div>

          {/* Quick category buttons with keyboard shortcuts */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.slice(0, 9).map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorize([category.id])}
                  className="px-3 py-1.5 rounded text-white text-sm font-medium active:opacity-80 whitespace-nowrap flex-shrink-0"
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete {selectedMedia.size} file(s)?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete {selectedMedia.size} file(s)? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-700 rounded-lg font-medium active:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-2 bg-red-600 rounded-lg font-medium active:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMedia.size === 0 && <CategoryLegend />}
    </div>
  )
}

export default BulkEditMode

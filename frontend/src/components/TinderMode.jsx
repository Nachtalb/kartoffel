import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

function TinderMode() {
  const { media, currentTinderIndex, nextTinderCard, resetTinder, categories, categorizeMedia, fetchMedia } = useStore()
  const [dragStart, setDragStart] = useState(null)
  const [dragCurrent, setDragCurrent] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const cardRef = useRef(null)

  const currentMedia = media[currentTinderIndex]

  // Calculate which category triangle the point is in
  const getCategoryFromAngle = (x, y) => {
    if (!categories.length) return null

    const angle = Math.atan2(y, x)
    const degrees = ((angle * 180) / Math.PI + 360) % 360
    const sliceAngle = 360 / categories.length

    // Adjust for -90 degree offset (pie starts at top, not right)
    const adjustedDegrees = (degrees + 90) % 360
    const sliceIndex = Math.floor(adjustedDegrees / sliceAngle)
    return categories[sliceIndex]
  }

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    setDragStart({
      startX: clientX,
      startY: clientY,
    })
  }

  const handleDragMove = (e) => {
    if (!dragStart) return

    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    // Calculate drag offset for card movement
    const cardDx = clientX - dragStart.startX
    const cardDy = clientY - dragStart.startY

    setDragCurrent({ x: cardDx, y: cardDy })

    // Calculate position relative to screen center for category selection
    const screenCenterX = window.innerWidth / 2
    const screenCenterY = window.innerHeight / 2

    const dx = clientX - screenCenterX
    const dy = clientY - screenCenterY

    // Calculate distance from screen center
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Only select category if dragged far enough (80px threshold)
    if (distance > 80) {
      const category = getCategoryFromAngle(dx, dy)
      setSelectedCategory(category)
    } else {
      setSelectedCategory(null)
    }
  }

  const handleDragEnd = async () => {
    if (!dragCurrent || !selectedCategory || !currentMedia) {
      setDragStart(null)
      setDragCurrent(null)
      setSelectedCategory(null)
      return
    }

    // Calculate final distance
    const distance = Math.sqrt(dragCurrent.x ** 2 + dragCurrent.y ** 2)

    // If dragged far enough, categorize
    if (distance > 80) {
      try {
        await categorizeMedia(currentMedia.id, [selectedCategory.id])
        nextTinderCard()
      } catch (error) {
        console.error('Failed to categorize:', error)
      }
    }

    setDragStart(null)
    setDragCurrent(null)
    setSelectedCategory(null)
  }

  const handleSkip = () => {
    nextTinderCard()
  }

  const handleReset = async () => {
    resetTinder()
    await fetchMedia()
  }

  const handleCategoryClick = async (categoryId) => {
    if (!currentMedia) return

    try {
      await categorizeMedia(currentMedia.id, [categoryId])
      nextTinderCard()
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
        handleCategoryClick(categories[key - 1].id)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [categories, currentMedia])

  // Calculate transform for card
  const getCardTransform = () => {
    if (!dragCurrent) return 'translate(0, 0) rotate(0deg)'

    const rotation = (dragCurrent.x / 10) // Subtle rotation based on horizontal drag
    return `translate(${dragCurrent.x}px, ${dragCurrent.y}px) rotate(${rotation}deg)`
  }

  if (categories.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center p-4">
          <p className="text-xl mb-2">No categories found</p>
          <p className="text-sm">Create categories to start using Tinder mode</p>
        </div>
      </div>
    )
  }

  if (!currentMedia) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center p-4">
          <p className="text-xl mb-4">No more items!</p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 rounded-lg font-medium active:bg-blue-700"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Card */}
      <div className="relative w-full max-w-md aspect-[3/4] z-10">
        <div
          ref={cardRef}
          className="absolute inset-0 bg-gray-800 rounded-2xl shadow-2xl overflow-hidden tinder-card cursor-grab active:cursor-grabbing"
          style={{
            transform: getCardTransform(),
            transition: dragCurrent ? 'none' : 'transform 0.3s ease-out',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={dragStart ? handleDragMove : null}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {currentMedia.type === 'video' ? (
            <video
              src={`/media/${currentMedia.path}`}
              className="w-full h-full object-contain pointer-events-none"
              controls={!dragStart}
            />
          ) : (
            <img
              src={currentMedia.thumbnail_path ? `/thumbnails/${currentMedia.thumbnail_path.split('/').pop()}` : `/media/${currentMedia.path}`}
              alt={currentMedia.filename}
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          )}

          {/* Filename overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
            <p className="text-white text-sm truncate">{currentMedia.filename}</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute -bottom-8 left-0 right-0 text-center text-gray-400 text-sm">
          {currentTinderIndex + 1} / {media.length}
        </div>
      </div>

      {/* Pie Chart Overlay - using simple triangle collision */}
      {dragCurrent && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <svg className="w-full h-full">
            {categories.map((category, index) => {
              const sliceAngle = 360 / categories.length
              const startAngle = (index * sliceAngle - 90) * (Math.PI / 180)
              const endAngle = ((index + 1) * sliceAngle - 90) * (Math.PI / 180)

              const centerX = window.innerWidth / 2
              const centerY = window.innerHeight / 2
              const radius = Math.max(window.innerWidth, window.innerHeight) * 1.5

              const startX = centerX + radius * Math.cos(startAngle)
              const startY = centerY + radius * Math.sin(startAngle)
              const endX = centerX + radius * Math.cos(endAngle)
              const endY = centerY + radius * Math.sin(endAngle)

              const largeArc = sliceAngle > 180 ? 1 : 0

              return (
                <path
                  key={category.id}
                  d={`M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`}
                  fill={category.color}
                  opacity={selectedCategory?.id === category.id ? 0.5 : 0.2}
                />
              )
            })}
          </svg>

          {/* Category Labels */}
          <div className="absolute inset-0 flex items-center justify-center">
            {categories.map((category, index) => {
              const sliceAngle = 360 / categories.length
              const angle = (index * sliceAngle + sliceAngle / 2 - 90) * (Math.PI / 180)
              const radius = 180

              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius

              return (
                <div
                  key={category.id}
                  className="absolute font-bold text-white text-2xl drop-shadow-lg pointer-events-none"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    opacity: selectedCategory?.id === category.id ? 1 : 0.85,
                    textShadow: '0 0 15px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.7)',
                  }}
                >
                  {category.name}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Desktop Category Buttons */}
      <div className="mt-8 hidden sm:flex flex-wrap gap-2 justify-center max-w-2xl">
        {categories.slice(0, 9).map((category, index) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className="px-4 py-2 rounded-lg text-white font-medium active:opacity-80 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: category.color }}
            title={`Press ${index + 1} to categorize`}
          >
            <span className="mr-1 opacity-75">{index + 1}.</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Skip button */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSkip}
          className="px-6 py-3 bg-gray-700 rounded-full font-medium active:bg-gray-600 hover:bg-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Instructions */}
      {!dragCurrent && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
          <span className="hidden sm:inline">Drag to categorize • Press 1-9 • </span>
          <span className="sm:hidden">Drag to categorize • </span>
          Click buttons below
        </div>
      )}
    </div>
  )
}

export default TinderMode

import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

function TinderMode() {
  const { media, currentTinderIndex, nextTinderCard, resetTinder, categories, categorizeMedia, fetchMedia } = useStore()
  const [dragStart, setDragStart] = useState(null)
  const [dragCurrent, setDragCurrent] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const cardRef = useRef(null)

  const currentMedia = media[currentTinderIndex]

  // Calculate pie chart sectors
  const getPieSlice = (x, y) => {
    if (!categories.length) return null

    const angle = Math.atan2(y, x)
    const degrees = ((angle * 180) / Math.PI + 360) % 360
    const sliceAngle = 360 / categories.length

    const sliceIndex = Math.floor(degrees / sliceAngle)
    return categories[sliceIndex]
  }

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    setDragStart({
      x: touch.clientX - centerX,
      y: touch.clientY - centerY,
      centerX,
      centerY,
    })
  }

  const handleTouchMove = (e) => {
    if (!dragStart) return

    e.preventDefault()
    const touch = e.touches[0]

    const dx = touch.clientX - dragStart.centerX
    const dy = touch.clientY - dragStart.centerY

    setDragCurrent({ x: dx, y: dy })

    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Only select category if dragged far enough (50px threshold)
    if (distance > 50) {
      const category = getPieSlice(dx, dy)
      setSelectedCategory(category)
    } else {
      setSelectedCategory(null)
    }
  }

  const handleTouchEnd = async () => {
    if (!dragCurrent || !selectedCategory || !currentMedia) {
      setDragStart(null)
      setDragCurrent(null)
      setSelectedCategory(null)
      return
    }

    // Calculate distance
    const distance = Math.sqrt(dragCurrent.x ** 2 + dragCurrent.y ** 2)

    // If dragged far enough, categorize
    if (distance > 50) {
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
      {/* Pie Chart Overlay */}
      {dragCurrent && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg className="w-full h-full">
            <defs>
              {categories.map((category, index) => {
                const sliceAngle = 360 / categories.length
                const startAngle = index * sliceAngle - 90
                const endAngle = (index + 1) * sliceAngle - 90

                const centerX = window.innerWidth / 2
                const centerY = window.innerHeight / 2
                const radius = Math.min(window.innerWidth, window.innerHeight)

                const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
                const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
                const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
                const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

                const largeArc = sliceAngle > 180 ? 1 : 0

                return (
                  <path
                    key={category.id}
                    d={`M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`}
                    fill={category.color}
                    opacity={selectedCategory?.id === category.id ? 0.6 : 0.2}
                  />
                )
              })}
            </defs>
            {categories.map((category, index) => {
              const sliceAngle = 360 / categories.length
              const startAngle = index * sliceAngle - 90
              const endAngle = (index + 1) * sliceAngle - 90

              const centerX = window.innerWidth / 2
              const centerY = window.innerHeight / 2
              const radius = Math.min(window.innerWidth, window.innerHeight)

              const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
              const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
              const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)

              const largeArc = sliceAngle > 180 ? 1 : 0

              return (
                <path
                  key={category.id}
                  d={`M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`}
                  fill={category.color}
                  opacity={selectedCategory?.id === category.id ? 0.6 : 0.2}
                />
              )
            })}
          </svg>

          {/* Category Labels */}
          <div className="absolute inset-0 flex items-center justify-center">
            {categories.map((category, index) => {
              const sliceAngle = 360 / categories.length
              const angle = (index * sliceAngle + sliceAngle / 2 - 90) * (Math.PI / 180)
              const radius = 150

              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius

              return (
                <div
                  key={category.id}
                  className="absolute font-bold text-white text-lg drop-shadow-lg"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    opacity: selectedCategory?.id === category.id ? 1 : 0.7,
                  }}
                >
                  {category.name}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Card */}
      <div className="relative w-full max-w-md aspect-[3/4] z-20">
        <div
          ref={cardRef}
          className="absolute inset-0 bg-gray-800 rounded-2xl shadow-2xl overflow-hidden tinder-card"
          style={{
            transform: getCardTransform(),
            transition: dragCurrent ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentMedia.type === 'video' ? (
            <video
              src={`/media/${currentMedia.path}`}
              className="w-full h-full object-contain"
              controls
            />
          ) : (
            <img
              src={currentMedia.thumbnail_path ? `/thumbnails/${currentMedia.thumbnail_path.split('/').pop()}` : `/media/${currentMedia.path}`}
              alt={currentMedia.filename}
              className="w-full h-full object-contain"
              draggable={false}
            />
          )}

          {/* Filename overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm truncate">{currentMedia.filename}</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute -bottom-8 left-0 right-0 text-center text-gray-400 text-sm">
          {currentTinderIndex + 1} / {media.length}
        </div>
      </div>

      {/* Skip button */}
      <div className="mt-16 flex gap-4">
        <button
          onClick={handleSkip}
          className="px-6 py-3 bg-gray-700 rounded-full font-medium active:bg-gray-600"
        >
          Skip
        </button>
      </div>

      {/* Instructions */}
      {!dragCurrent && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
          Drag to categorize
        </div>
      )}
    </div>
  )
}

export default TinderMode

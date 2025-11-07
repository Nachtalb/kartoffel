function MediaItem({ item, onClick, isSelected, showCheckbox, showCategories = false }) {
  const getThumbnailUrl = () => {
    if (item.thumbnail_path) {
      return `/thumbnails/${item.thumbnail_path.split('/').pop()}`
    }
    return `/media/${item.path}`
  }

  const handleClick = (e) => {
    if (onClick && !showCheckbox) {
      onClick(e)
    }
  }

  return (
    <div
      className={`relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer selectable ${
        isSelected ? 'selected' : ''
      }`}
      onClick={handleClick}
    >
      {item.type === 'video' ? (
        <div className="relative w-full h-full">
          <video
            src={`/media/${item.path}`}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      ) : (
        <img
          src={getThumbnailUrl()}
          alt={item.filename}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      )}

      {showCheckbox && (
        <div className="absolute top-2 left-2">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'bg-transparent border-white'
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {item.type === 'gif' && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          GIF
        </div>
      )}

      {/* Category badges */}
      {item.categories && item.categories.length > 0 && (!showCheckbox || showCategories) && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex flex-wrap gap-1">
            {item.categories.slice(0, 3).map((category) => (
              <span
                key={category.id}
                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            ))}
            {item.categories.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-white font-medium">
                +{item.categories.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaItem

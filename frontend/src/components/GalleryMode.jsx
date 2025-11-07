import { useState } from 'react'
import { useStore } from '../store/useStore'
import MediaItem from './MediaItem'
import MediaViewer from './MediaViewer'
import CategoryLegend from './CategoryLegend'

function GalleryMode() {
  const { media } = useStore()
  const [selectedIndex, setSelectedIndex] = useState(null)

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
        {media.map((item, index) => (
          <MediaItem
            key={item.id}
            item={item}
            onClick={() => setSelectedIndex(index)}
          />
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

      {selectedIndex !== null && media[selectedIndex] && (
        <MediaViewer
          item={media[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onNext={selectedIndex < media.length - 1 ? handleNext : null}
          onPrevious={selectedIndex > 0 ? handlePrevious : null}
        />
      )}

      <CategoryLegend />
    </div>
  )
}

export default GalleryMode

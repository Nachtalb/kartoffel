import { useState } from 'react'
import { useStore } from '../store/useStore'
import MediaItem from './MediaItem'
import MediaViewer from './MediaViewer'

function GalleryMode() {
  const { media } = useStore()
  const [selectedItem, setSelectedItem] = useState(null)

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
        {media.map((item) => (
          <MediaItem
            key={item.id}
            item={item}
            onClick={() => setSelectedItem(item)}
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

      {selectedItem && (
        <MediaViewer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

export default GalleryMode

import { useStore } from '../store/useStore'

function CategoryLegend() {
  const { categories } = useStore()

  if (categories.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur border-t border-gray-700 p-2 z-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap hidden sm:inline">
            Shortcuts:
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 9).map((category, index) => (
              <div
                key={category.id}
                className="flex items-center gap-1.5 text-xs whitespace-nowrap"
              >
                <span className="px-1.5 py-0.5 bg-gray-700 rounded font-mono text-gray-300">
                  {index + 1}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryLegend

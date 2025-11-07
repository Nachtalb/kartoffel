import { useStore } from '../store/useStore'

function FilterBar({ showCategorized, onToggleCategorized, selectedCategoryId, onCategoryChange }) {
  const { categories } = useStore()

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Show/Hide Categorized Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCategorized}
            onChange={(e) => onToggleCategorized(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
          />
          <span className="text-sm text-gray-300">Show categorized</span>
        </label>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Filter:</span>
          <select
            value={selectedCategoryId || ''}
            onChange={(e) => onCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(selectedCategoryId || showCategorized) && (
          <button
            onClick={() => {
              onToggleCategorized(false)
              onCategoryChange(null)
            }}
            className="text-xs px-2 py-1 text-gray-400 hover:text-white border border-gray-600 rounded"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterBar

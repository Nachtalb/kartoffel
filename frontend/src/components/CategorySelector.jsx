import { useState } from 'react'
import { useStore } from '../store/useStore'

function CategorySelector({ onSelect, onClose }) {
  const { categories } = useStore()
  const [selectedCategories, setSelectedCategories] = useState(new Set())

  const toggleCategory = (categoryId) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const handleSubmit = () => {
    onSelect(Array.from(selectedCategories))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
      <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Select Categories</h2>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-4">
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No categories found. Create one first!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategories.has(category.id)
                      ? 'border-white'
                      : 'border-gray-700'
                  }`}
                  style={{
                    backgroundColor: selectedCategories.has(category.id)
                      ? category.color
                      : `${category.color}20`,
                  }}
                >
                  <div className="font-medium text-white">{category.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 rounded-lg font-medium active:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedCategories.size === 0}
            className="flex-1 py-3 bg-blue-600 rounded-lg font-medium active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategorySelector

import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

const PRESET_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
]

function CategoryManager({ onClose }) {
  const { categories, createCategory, updateCategory, deleteCategory } = useStore()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      await createCategory(newCategoryName.trim(), newCategoryColor)
      setNewCategoryName('')
      setNewCategoryColor(PRESET_COLORS[0])
    } catch (error) {
      alert('Failed to create category. Name might already exist.')
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingColor(category.color)
  }

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, {
        name: editingName.trim(),
        color: editingColor,
      })
      setEditingId(null)
    } catch (error) {
      alert('Failed to update category')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await deleteCategory(id)
    } catch (error) {
      alert('Failed to delete category')
    }
  }

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Manage Categories</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create Form */}
        <div className="p-4 border-b border-gray-700">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-10 h-10 rounded-lg ${
                    newCategoryColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 rounded-lg font-medium active:bg-blue-700"
            >
              Create Category
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4">
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  {editingId === category.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditingColor(color)}
                            className={`w-8 h-8 rounded ${
                              editingColor === color ? 'ring-2 ring-white' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(category.id)}
                          className="flex-1 py-2 bg-green-600 rounded font-medium active:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-2 bg-gray-600 rounded font-medium active:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 font-medium text-white">
                        {category.name}
                      </div>
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm bg-gray-600 rounded active:bg-gray-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 text-sm bg-red-600 rounded active:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryManager

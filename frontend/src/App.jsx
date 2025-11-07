import { useState, useEffect, useCallback } from 'react'
import { useStore } from './store/useStore'
import GalleryMode from './components/GalleryMode'
import BulkEditMode from './components/BulkEditMode'
import TinderMode from './components/TinderMode'
import CategoryManager from './components/CategoryManager'
import FilterBar from './components/FilterBar'
import UploadModal from './components/UploadModal'

function App() {
  // Initialize mode from URL hash
  const getInitialMode = () => {
    const hash = window.location.hash.slice(1) // Remove the #
    if (hash === 'gallery' || hash === 'bulk' || hash === 'tinder') {
      return hash
    }
    return 'gallery'
  }

  const [mode, setMode] = useState(getInitialMode)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCategorized, setShowCategorized] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const { fetchMedia, fetchCategories, media, refreshScan } = useStore()

  // Apply current filters
  const applyFilters = useCallback(() => {
    if (selectedCategoryId) {
      // Show specific category
      fetchMedia(selectedCategoryId, false)
    } else if (showCategorized) {
      // Show all items
      fetchMedia(null, false)
    } else {
      // Show only uncategorized (default)
      fetchMedia(null, true)
    }
  }, [selectedCategoryId, showCategorized, fetchMedia])

  // Update URL hash when mode changes
  const changeMode = (newMode) => {
    setMode(newMode)
    window.location.hash = newMode
    applyFilters()
  }

  // Handle filter changes
  const handleToggleCategorized = (value) => {
    setShowCategorized(value)
    if (value) {
      setSelectedCategoryId(null) // Clear category filter when showing all
    }
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId)
    if (categoryId) {
      setShowCategorized(true) // Auto-enable show categorized when filtering by category
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshScan()
      // Wait a bit for the scan to start
      setTimeout(async () => {
        applyFilters()
        setIsRefreshing(false)
      }, 2000)
    } catch (error) {
      alert('Failed to refresh: ' + error.message)
      setIsRefreshing(false)
    }
  }

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [showCategorized, selectedCategoryId])

  useEffect(() => {
    fetchCategories()
    applyFilters()

    // Listen for hash changes (browser back/forward)
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'gallery' || hash === 'bulk' || hash === 'tinder') {
        setMode(hash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [fetchCategories, applyFilters])

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Media Categorizer</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-2 bg-blue-600 rounded-lg text-sm font-medium active:bg-blue-700"
            >
              Upload
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-green-600 rounded-lg text-sm font-medium active:bg-green-700 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="px-3 py-2 bg-purple-600 rounded-lg text-sm font-medium active:bg-purple-700"
            >
              Categories
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => changeMode('gallery')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              mode === 'gallery'
                ? 'bg-blue-600'
                : 'bg-gray-700 active:bg-gray-600'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => changeMode('bulk')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              mode === 'bulk'
                ? 'bg-blue-600'
                : 'bg-gray-700 active:bg-gray-600'
            }`}
          >
            Bulk Edit
          </button>
          <button
            onClick={() => changeMode('tinder')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              mode === 'tinder'
                ? 'bg-blue-600'
                : 'bg-gray-700 active:bg-gray-600'
            }`}
          >
            Tinder
          </button>
        </div>

        {/* Stats */}
        <div className="mt-2 text-sm text-gray-400">
          {media.length} items
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar
        showCategorized={showCategorized}
        onToggleCategorized={handleToggleCategorized}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={handleCategoryChange}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {mode === 'gallery' && <GalleryMode onRefresh={applyFilters} />}
        {mode === 'bulk' && <BulkEditMode onRefresh={applyFilters} />}
        {mode === 'tinder' && <TinderMode onRefresh={applyFilters} />}
      </main>

      {/* Modals */}
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            applyFilters()
          }}
        />
      )}
    </div>
  )
}

export default App

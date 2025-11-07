import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api'

export const useStore = create((set, get) => ({
  // State
  media: [],
  categories: [],
  selectedMedia: new Set(),
  currentTinderIndex: 0,

  // Actions
  fetchMedia: async (categoryId = null, uncategorized = false) => {
    try {
      const params = {}
      if (categoryId) params.category_id = categoryId
      if (uncategorized) params.uncategorized = true

      const response = await axios.get(`${API_URL}/media`, { params })
      set({ media: response.data, currentTinderIndex: 0 })
    } catch (error) {
      console.error('Failed to fetch media:', error)
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      set({ categories: response.data })
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  },

  createCategory: async (name, color) => {
    try {
      const response = await axios.post(`${API_URL}/categories`, { name, color })
      const categories = [...get().categories, response.data]
      set({ categories })
      return response.data
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const response = await axios.put(`${API_URL}/categories/${id}`, updates)
      const categories = get().categories.map(c =>
        c.id === id ? { ...c, ...response.data } : c
      )
      set({ categories })
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  },

  deleteCategory: async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`)
      const categories = get().categories.filter(c => c.id !== id)
      set({ categories })
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  },

  categorizeMedia: async (mediaId, categoryIds) => {
    try {
      await axios.post(`${API_URL}/media/categorize`, {
        media_id: mediaId,
        category_ids: categoryIds,
      })
    } catch (error) {
      console.error('Failed to categorize media:', error)
      throw error
    }
  },

  bulkCategorize: async (mediaIds, categoryIds) => {
    try {
      await axios.post(`${API_URL}/media/bulk-categorize`, {
        media_ids: mediaIds,
        category_ids: categoryIds,
      })
    } catch (error) {
      console.error('Failed to bulk categorize:', error)
      throw error
    }
  },

  deleteMedia: async (mediaId) => {
    try {
      await axios.delete(`${API_URL}/media/${mediaId}`)
      // Remove from local state
      const media = get().media.filter(m => m.id !== mediaId)
      set({ media })
    } catch (error) {
      console.error('Failed to delete media:', error)
      throw error
    }
  },

  refreshScan: async () => {
    try {
      const response = await axios.post(`${API_URL}/scan/refresh`)
      return response.data
    } catch (error) {
      console.error('Failed to refresh scan:', error)
      throw error
    }
  },

  getScanStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/scan/status`)
      return response.data
    } catch (error) {
      console.error('Failed to get scan status:', error)
      throw error
    }
  },

  // Selection management
  toggleSelection: (mediaId) => {
    const selectedMedia = new Set(get().selectedMedia)
    if (selectedMedia.has(mediaId)) {
      selectedMedia.delete(mediaId)
    } else {
      selectedMedia.add(mediaId)
    }
    set({ selectedMedia })
  },

  clearSelection: () => {
    set({ selectedMedia: new Set() })
  },

  setSelection: (mediaIds) => {
    set({ selectedMedia: new Set(mediaIds) })
  },

  // Tinder mode
  nextTinderCard: () => {
    const { currentTinderIndex, media } = get()
    if (currentTinderIndex < media.length - 1) {
      set({ currentTinderIndex: currentTinderIndex + 1 })
    }
  },

  resetTinder: () => {
    set({ currentTinderIndex: 0 })
  },
}))

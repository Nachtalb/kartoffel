import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function UploadModal({ onClose, onUploadComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileProgress, setFileProgress] = useState({})
  const [fileStatuses, setFileStatuses] = useState({}) // 'pending', 'uploading', 'done', 'duplicate', 'error'
  const [uploadStatus, setUploadStatus] = useState(null)
  const fileInputRef = useRef(null)

  // ESC key to close and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !uploading) {
        onClose()
      }
    }

    // Prevent body scroll on mobile
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, uploading])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
    setUploadStatus(null)
    setFileStatuses({})
    setFileProgress({})
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      setUploading(true)
      setProgress(0)
      setFileProgress({})
      setFileStatuses({})
      setUploadStatus(null)

      let uploaded = 0
      let duplicates = 0
      let errors = 0
      const duplicateMessages = []
      const errorMessages = []

      // Upload files in batches of 3 to show immediate feedback
      const uploadFile = async (file, index) => {
        try {
          setFileStatuses(prev => ({ ...prev, [index]: 'uploading' }))

          const formData = new FormData()
          formData.append('files', file)

          const response = await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 300000,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setFileProgress(prev => ({ ...prev, [index]: percentCompleted }))
            },
          })

          // Check response
          if (response.data.duplicates && response.data.duplicates.length > 0) {
            setFileStatuses(prev => ({ ...prev, [index]: 'duplicate' }))
            duplicates++
            duplicateMessages.push(...response.data.duplicates)
          } else if (response.data.errors && response.data.errors.length > 0) {
            setFileStatuses(prev => ({ ...prev, [index]: 'error' }))
            errors++
            errorMessages.push(...response.data.errors)
          } else {
            setFileStatuses(prev => ({ ...prev, [index]: 'done' }))
            uploaded++
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          setFileStatuses(prev => ({ ...prev, [index]: 'error' }))
          errors++
          errorMessages.push(`${file.name}: ${error.response?.data?.detail || error.message || 'Upload failed'}`)
        }
      }

      // Process files in batches of 3
      const batchSize = 3
      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, i + batchSize)
        const promises = batch.map((file, batchIndex) =>
          uploadFile(file, i + batchIndex)
        )
        await Promise.all(promises)

        // Update overall progress
        setProgress(Math.round((Math.min(i + batchSize, selectedFiles.length) / selectedFiles.length) * 100))
      }

      // Final status
      let message = `Uploaded ${uploaded} file(s)`
      if (duplicates > 0) message += `, ${duplicates} duplicate(s) skipped`
      if (errors > 0) message += `, ${errors} error(s)`

      setUploadStatus({
        success: errors === 0,
        message,
        errors: errorMessages,
        duplicates: duplicateMessages,
      })

      // Notify parent to refresh media list
      if (onUploadComplete && uploaded > 0) {
        onUploadComplete()
      }

      // Auto close if all successful
      if (uploaded > 0 && duplicates === 0 && errors === 0) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus({
        success: false,
        message: 'Upload failed',
        errors: [error.message || 'Unknown error occurred'],
        duplicates: [],
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop and not uploading
        if (e.target === e.currentTarget && !uploading) {
          onClose()
        }
      }}
    >
      <div
        className="bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upload Files</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            type="button"
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.gif,.webp,.webm"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              type="button"
              className="w-full py-12 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium">Click to select files</span>
                <span className="text-sm">or drag and drop</span>
              </div>
            </button>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => {
                  const status = fileStatuses[index]
                  const getStatusBadge = () => {
                    if (status === 'uploading') {
                      return <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Uploading</span>
                    } else if (status === 'done') {
                      return <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">✓ Done</span>
                    } else if (status === 'duplicate') {
                      return <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded">Duplicate</span>
                    } else if (status === 'error') {
                      return <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded">Error</span>
                    }
                    return null
                  }

                  return (
                    <div
                      key={index}
                      className="relative bg-gray-700 rounded text-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="truncate flex-1 text-white">{file.name}</span>
                        {getStatusBadge()}
                        <span className="text-gray-400 ml-2">{formatFileSize(file.size)}</span>
                      </div>
                      {/* Per-file progress bar */}
                      {uploading && fileProgress[index] !== undefined && status === 'uploading' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${fileProgress[index]}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Uploading...</span>
                <span className="text-white font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div
              className={`p-4 rounded-lg ${
                uploadStatus.success ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}
            >
              <p className="font-medium">{uploadStatus.message}</p>
              {uploadStatus.duplicates && uploadStatus.duplicates.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-400">Duplicates skipped:</p>
                  <ul className="mt-1 text-sm space-y-1 text-yellow-300">
                    {uploadStatus.duplicates.map((duplicate, index) => (
                      <li key={index}>• {duplicate}</li>
                    ))}
                  </ul>
                </div>
              )}
              {uploadStatus.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Errors:</p>
                  <ul className="mt-1 text-sm space-y-1">
                    {uploadStatus.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            disabled={uploading}
            type="button"
            className="flex-1 py-2 bg-gray-700 rounded-lg font-medium active:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            type="button"
            className="flex-1 py-2 bg-blue-600 rounded-lg font-medium active:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadModal

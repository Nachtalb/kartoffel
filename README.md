# Media Categorizer

A touch-first web application for organizing and categorizing media files (images, videos, GIFs). Perfect for mobile devices with three distinct modes for different workflows.

## Features

### 🖼️ Three Viewing Modes

1. **Gallery Mode**: Browse your media in a grid layout
2. **Bulk Edit Mode**: Select multiple items with long-press and swipe gestures
3. **Tinder Mode**: Swipe to categorize with an intuitive pie-chart interface

### 📱 Touch-First Design

- Optimized for mobile and tablet devices
- Long-press multiselect with auto-scroll in Bulk Edit mode
- Gesture-based categorization in Tinder mode
- Smooth animations and transitions

### 🎨 Category Management

- Create custom categories with colors
- Assign multiple categories to media
- Filter by category or view uncategorized items

### 🔍 Media Support

- **Images**: JPG, PNG, GIF, WebP, BMP, TIFF, SVG
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V
- Automatic thumbnail generation
- Recursive directory scanning

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Usage

### 1. Start the Backend

```bash
# From the project root
python -m uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`

### 2. Start the Frontend

```bash
# In a new terminal, from the frontend directory
cd frontend
npm run dev
```

The web app will be available at `http://localhost:5173`

### 3. Scan Your Media

1. Click the "Scan" button
2. Enter the full path to your media directory (e.g., `/home/user/Pictures`)
3. Click "Start Scan"
4. Wait for the indexing to complete

### 4. Create Categories

1. Click the "Categories" button
2. Enter a name and pick a color
3. Click "Create Category"

### 5. Categorize Your Media

Choose your preferred mode:

- **Gallery Mode**: Click on items to view and categorize individually
- **Bulk Edit Mode**: Long-press and swipe to select multiple items, then categorize all at once
- **Tinder Mode**: Drag items in different directions to categorize quickly

## How the Modes Work

### Gallery Mode

Simple grid view of all your media. Click any item to view it full-screen and add categories.

### Bulk Edit Mode

Perfect for categorizing many similar items:

1. **Long-press** on an item to start selection
2. **Swipe** across other items while holding to select them
3. **Auto-scroll** works when you drag near screen edges
4. Click "Categorize" to assign categories to all selected items

### Tinder Mode

Fast categorization with swipe gestures:

1. A **pie chart overlay** appears when you drag
2. Each slice represents a category
3. **Drag** toward a category and release to categorize
4. The item automatically moves to the next one
5. Use "Skip" to move forward without categorizing

## Architecture

### Backend (FastAPI)

- **`backend/main.py`**: API endpoints and server setup
- **`backend/models.py`**: Database models (Media, Category, MediaCategory)
- **`backend/database.py`**: SQLAlchemy configuration
- **`backend/scanner.py`**: Recursive media file scanner with thumbnail generation

### Frontend (React + Vite)

- **`src/App.jsx`**: Main application component
- **`src/store/useStore.js`**: Zustand state management
- **`src/components/`**: React components for each mode and UI element

### Database

SQLite database storing:
- Media files metadata (path, type, dimensions, thumbnails)
- Categories (name, color)
- Media-Category relationships (many-to-many)

## API Endpoints

- `POST /api/scan` - Scan a directory for media
- `GET /api/media` - Get all media (with filtering)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `PUT /api/categories/{id}` - Update a category
- `DELETE /api/categories/{id}` - Delete a category
- `POST /api/media/categorize` - Categorize a single media item
- `POST /api/media/bulk-categorize` - Categorize multiple items

## Development

### Backend Development

```bash
# Run with auto-reload
python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Tips

- Use **Gallery Mode** for browsing and reviewing
- Use **Bulk Edit Mode** when you need to categorize many similar items
- Use **Tinder Mode** for quick, efficient categorization
- Create descriptive category names and distinct colors for easy recognition
- The scanner runs in the background, so you can continue using the app while it processes

## Troubleshooting

**Media not appearing?**
- Check that the directory path is correct and accessible
- Ensure files have supported extensions
- Check the backend console for errors

**Thumbnails not loading?**
- Thumbnails are generated during scanning
- Large images may take time to process
- Check the `thumbnails/` directory exists

**Touch gestures not working?**
- Ensure you're using a touch-enabled device or browser
- Try refreshing the page
- Check browser console for JavaScript errors

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

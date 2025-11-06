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
- (Optional) [uv](https://github.com/astral-sh/uv) for faster Python package installation

### Backend Setup

```bash
# Create .env file and configure media directory
cp .env.example .env
# Edit .env and set MEDIA_DIRECTORY=/path/to/your/media

# Install Python dependencies
# Using uv (recommended, faster):
uv pip install -r requirements.txt

# Or using pip:
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

### Quick Start

The easiest way to start the application:

```bash
./start.sh
```

This will:
- Check for `.env` configuration
- Install all dependencies (using uv if available)
- Start both backend and frontend servers
- Automatically scan your media directory on startup

### Manual Start

#### 1. Configure Media Directory

Create a `.env` file in the project root:

```bash
MEDIA_DIRECTORY=/path/to/your/media
```

#### 2. Start the Backend

```bash
# From the project root
python -m uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`

The backend will automatically scan your configured media directory on startup.

#### 3. Start the Frontend

```bash
# In a new terminal, from the frontend directory
cd frontend
npm run dev
```

The web app will be available at `http://localhost:5173`

### Refreshing Media

Click the "Refresh" button in the web interface to:
- Rescan the configured media directory for new files
- Remove deleted files from the database
- Update the media list

### Create Categories

1. Click the "Categories" button
2. Enter a name and pick a color
3. Click "Create Category"

### Categorize Your Media

Choose your preferred mode:

- **Gallery Mode**: Click on items to view and categorize individually
- **Bulk Edit Mode**: Long-press and swipe to select multiple items, then categorize all at once
- **Tinder Mode**: Drag items in different directions to categorize quickly

## How the Modes Work

### Gallery Mode

Simple grid view of all your media. Click any item to view it full-screen and add categories.

### Bulk Edit Mode

Perfect for categorizing many similar items:

1. **Click/tap** on an item to start selection
2. **Swipe/drag** across items to select a range (all items between start and current)
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

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the project root:

```bash
# Required: Path to your media directory
MEDIA_DIRECTORY=/path/to/your/media
```

The backend will:
- Automatically scan this directory on startup
- Monitor for deleted files during refresh
- Index all supported media formats recursively

## API Endpoints

- `POST /api/scan/refresh` - Refresh scan and clean up deleted files
- `GET /api/scan/status` - Get current scan status
- `GET /api/media` - Get all media (with filtering and categories)
- `GET /api/media/{id}` - Get specific media item with categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `PUT /api/categories/{id}` - Update a category
- `DELETE /api/categories/{id}` - Delete a category
- `POST /api/media/categorize` - Categorize a single media item
- `POST /api/media/bulk-categorize` - Categorize multiple items

## Development

### Backend Development

```bash
# Install dependencies with uv (faster)
uv pip install -r requirements.txt

# Or with pip
pip install -r requirements.txt

# Run with auto-reload
python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Building for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### Using uv

[uv](https://github.com/astral-sh/uv) is a fast Python package installer. Install it with:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

The startup script will automatically use uv if it's available.

## Tips

- Use **Gallery Mode** for browsing and reviewing
- Use **Bulk Edit Mode** when you need to categorize many similar items
- Use **Tinder Mode** for quick, efficient categorization
- Create descriptive category names and distinct colors for easy recognition
- The scanner runs in the background, so you can continue using the app while it processes

## Troubleshooting

**Media not appearing?**
- Check that `MEDIA_DIRECTORY` is set correctly in `.env`
- Ensure the directory exists and is accessible
- Check the backend console for errors during startup scan
- Click "Refresh" to trigger a manual rescan

**Thumbnails not loading?**
- Thumbnails are generated during scanning
- Large images may take time to process
- Check the `thumbnails/` directory exists

**Changes not reflected?**
- Click the "Refresh" button to rescan and update
- This will also remove deleted files from the database

**Touch gestures not working?**
- Ensure you're using a touch-enabled device or browser
- Try refreshing the page
- Check browser console for JavaScript errors

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

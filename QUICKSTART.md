# Quick Start Guide

Get up and running in 3 simple steps!

## Step 1: Configure Media Directory

Create a `.env` file and set your media directory:

```bash
cp .env.example .env
# Edit .env and set: MEDIA_DIRECTORY=/path/to/your/media
```

## Step 2: Start the Application

### Option 1: Automated Start (Recommended)

```bash
./start.sh
```

This script will:
- Check for `.env` configuration
- Create a virtual environment
- Install all dependencies (using uv if available)
- Start both backend and frontend servers
- Automatically scan your media directory

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
# Install dependencies
uv pip install -r requirements.txt  # or: pip install -r requirements.txt

# Start server
python -m uvicorn backend.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Step 3: Open in Browser

Navigate to `http://localhost:5173`

The backend will automatically scan your configured media directory on startup.

## Next Steps

1. **Click "Categories"** to create your first category
2. **Wait for initial scan** to complete (watch backend console)
3. **Click "Refresh"** if you add new files or need to rescan
4. **Choose a mode** and start organizing!

## Mode Guide

### 🖼️ Gallery Mode
- Browse media in a grid
- Click items to view full-screen
- Good for: Reviewing content

### ✏️ Bulk Edit Mode
- Click/tap to start selecting
- Swipe to select a range (all items between start and current)
- Auto-scrolls at screen edges
- Good for: Categorizing many similar items

### 💝 Tinder Mode
- Drag toward a category to categorize
- Pie chart shows all categories
- Auto-advances to next item
- Good for: Fast, efficient categorization

## Need Help?

Check the [README.md](README.md) for detailed documentation.

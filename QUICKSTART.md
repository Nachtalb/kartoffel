# Quick Start Guide

Get up and running in 3 simple steps!

## Option 1: Automated Start (Recommended)

```bash
./start.sh
```

This script will:
- Create a virtual environment
- Install all dependencies
- Start both backend and frontend servers

## Option 2: Manual Start

### Step 1: Install Dependencies

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Step 2: Start Servers

**Terminal 1 - Backend:**
```bash
python -m uvicorn backend.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Open in Browser

Navigate to `http://localhost:5173`

## First Time Setup

1. **Click "Scan"** in the top-right corner
2. **Enter your media directory path** (e.g., `/home/user/Pictures`)
3. **Click "Start Scan"** and wait for indexing
4. **Click "Categories"** to create your first category
5. **Choose a mode** and start organizing!

## Mode Guide

### 🖼️ Gallery Mode
- Browse media in a grid
- Click items to view full-screen
- Good for: Reviewing content

### ✏️ Bulk Edit Mode
- Long-press to start selecting
- Swipe to select multiple items
- Auto-scrolls at screen edges
- Good for: Categorizing many similar items

### 💝 Tinder Mode
- Drag toward a category to categorize
- Pie chart shows all categories
- Auto-advances to next item
- Good for: Fast, efficient categorization

## Need Help?

Check the [README.md](README.md) for detailed documentation.

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
from dotenv import load_dotenv

from .database import init_db, get_db
from .scanner import MediaScanner
from .models import Media, Category, MediaCategory
from sqlalchemy import select
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Get media directory from environment
MEDIA_DIRECTORY = os.getenv("MEDIA_DIRECTORY")
if not MEDIA_DIRECTORY:
    print("WARNING: MEDIA_DIRECTORY not set in environment. Auto-scanning disabled.")
    print("Set MEDIA_DIRECTORY in .env file to enable automatic scanning.")

app = FastAPI(title="Media Categorizer")

# Global scanner instance for background tasks
_scanner_instance = None
_is_scanning = False

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Helper function to make paths relative
def make_relative_path(absolute_path: str) -> str:
    """Convert absolute path to relative path from MEDIA_DIRECTORY"""
    if not MEDIA_DIRECTORY:
        return absolute_path

    try:
        abs_path = Path(absolute_path).resolve()
        media_dir = Path(MEDIA_DIRECTORY).resolve()
        return str(abs_path.relative_to(media_dir))
    except ValueError:
        # Path is not relative to MEDIA_DIRECTORY
        return absolute_path

# Pydantic models for API
class ScanRequest(BaseModel):
    directory: str

class CategoryCreate(BaseModel):
    name: str
    color: str = "#3B82F6"

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class MediaCategorize(BaseModel):
    media_id: int
    category_ids: List[int]

class BulkCategorize(BaseModel):
    media_ids: List[int]
    category_ids: List[int]

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    global _scanner_instance, _is_scanning

    # Create thumbnails directory
    os.makedirs("thumbnails", exist_ok=True)

    # Auto-scan media directory on startup if configured
    if MEDIA_DIRECTORY and os.path.exists(MEDIA_DIRECTORY):
        print(f"Starting automatic scan of {MEDIA_DIRECTORY}...")
        _scanner_instance = MediaScanner(MEDIA_DIRECTORY)
        _is_scanning = True

        # Run scan in background
        import threading
        def scan_wrapper():
            global _is_scanning
            try:
                _scanner_instance.scan()
            finally:
                _is_scanning = False

        thread = threading.Thread(target=scan_wrapper)
        thread.daemon = True
        thread.start()

@app.get("/")
async def root():
    return {"message": "Media Categorizer API"}

@app.post("/api/scan")
async def scan_directory(request: ScanRequest, background_tasks: BackgroundTasks):
    """Scan a directory for media files"""
    if not os.path.exists(request.directory):
        raise HTTPException(status_code=404, detail="Directory not found")

    scanner = MediaScanner(request.directory)
    background_tasks.add_task(scanner.scan)

    return {"status": "scanning", "directory": request.directory}

@app.post("/api/scan/refresh")
async def refresh_scan(db: Session = Depends(get_db)):
    """Refresh the scan - rescan configured directory and clean up deleted files"""
    global _scanner_instance, _is_scanning

    if not MEDIA_DIRECTORY:
        raise HTTPException(status_code=400, detail="MEDIA_DIRECTORY not configured")

    if not os.path.exists(MEDIA_DIRECTORY):
        raise HTTPException(status_code=404, detail="Media directory not found")

    if _is_scanning:
        return {"status": "already_scanning"}

    # Clean up deleted files first
    media_items = db.execute(select(Media)).scalars().all()
    deleted_count = 0

    for media in media_items:
        if not os.path.exists(media.path):
            print(f"Removing deleted file from database: {media.path}")
            db.delete(media)
            deleted_count += 1

    db.commit()

    # Start new scan
    _scanner_instance = MediaScanner(MEDIA_DIRECTORY)
    _is_scanning = True

    import threading
    def scan_wrapper():
        global _is_scanning
        try:
            _scanner_instance.scan()
        finally:
            _is_scanning = False

    thread = threading.Thread(target=scan_wrapper)
    thread.daemon = True
    thread.start()

    return {
        "status": "scanning",
        "directory": MEDIA_DIRECTORY,
        "deleted_files": deleted_count
    }

@app.get("/api/scan/status")
async def scan_status():
    """Get the current scan status"""
    global _is_scanning

    return {
        "status": "scanning" if _is_scanning else "idle",
        "directory": MEDIA_DIRECTORY
    }

@app.get("/api/media")
async def get_media(
    skip: int = 0,
    limit: int = 50,
    category_id: Optional[int] = None,
    uncategorized: bool = False,
    db: Session = Depends(get_db)
):
    """Get all media files"""

    query = select(Media)

    if category_id:
        # Filter by category
        query = query.join(MediaCategory).where(MediaCategory.category_id == category_id)
    elif uncategorized:
        # Get uncategorized media
        query = query.outerjoin(MediaCategory).where(MediaCategory.id == None)

    query = query.offset(skip).limit(limit)
    result = db.execute(query)
    media_items = result.scalars().all()

    # Get categories for each media item and make paths relative
    return [
        {
            "id": m.id,
            "path": make_relative_path(m.path),
            "filename": m.filename,
            "type": m.type,
            "size": m.size,
            "width": m.width,
            "height": m.height,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "thumbnail_path": m.thumbnail_path,
            "categories": [
                {"id": c.id, "name": c.name, "color": c.color}
                for mc in m.categories
                for c in [db.execute(select(Category).where(Category.id == mc.category_id)).scalar_one_or_none()]
                if c
            ]
        }
        for m in media_items
    ]

@app.get("/api/media/{media_id}")
async def get_media_item(media_id: int, db: Session = Depends(get_db)):
    """Get a specific media file with its categories"""

    media = db.execute(select(Media).where(Media.id == media_id)).scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Get categories
    categories = db.execute(
        select(Category)
        .join(MediaCategory)
        .where(MediaCategory.media_id == media_id)
    ).scalars().all()

    return {
        "id": media.id,
        "path": media.path,
        "filename": media.filename,
        "type": media.type,
        "size": media.size,
        "width": media.width,
        "height": media.height,
        "created_at": media.created_at.isoformat() if media.created_at else None,
        "thumbnail_path": media.thumbnail_path,
        "categories": [
            {"id": c.id, "name": c.name, "color": c.color}
            for c in categories
        ]
    }

@app.get("/api/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    categories = db.execute(select(Category)).scalars().all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "color": c.color,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in categories
    ]

@app.post("/api/categories")
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""

    new_category = Category(
        name=category.name,
        color=category.color
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {
        "id": new_category.id,
        "name": new_category.name,
        "color": new_category.color,
        "created_at": new_category.created_at.isoformat() if new_category.created_at else None,
    }

@app.put("/api/categories/{category_id}")
async def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    """Update a category"""

    db_category = db.execute(
        select(Category).where(Category.id == category_id)
    ).scalar_one_or_none()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    if category.name is not None:
        db_category.name = category.name
    if category.color is not None:
        db_category.color = category.color

    db.commit()
    db.refresh(db_category)

    return {
        "id": db_category.id,
        "name": db_category.name,
        "color": db_category.color,
    }

@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""

    category = db.execute(
        select(Category).where(Category.id == category_id)
    ).scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()

    return {"status": "deleted"}

@app.post("/api/media/categorize")
async def categorize_media(request: MediaCategorize, db: Session = Depends(get_db)):
    """Categorize a media file"""

    # Check if media exists
    media = db.execute(
        select(Media).where(Media.id == request.media_id)
    ).scalar_one_or_none()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Remove existing categories
    db.execute(
        select(MediaCategory).where(MediaCategory.media_id == request.media_id)
    )
    existing = db.execute(
        select(MediaCategory).where(MediaCategory.media_id == request.media_id)
    ).scalars().all()

    for mc in existing:
        db.delete(mc)

    # Add new categories
    for category_id in request.category_ids:
        mc = MediaCategory(
            media_id=request.media_id,
            category_id=category_id
        )
        db.add(mc)

    db.commit()

    return {"status": "categorized"}

@app.post("/api/media/bulk-categorize")
async def bulk_categorize(request: BulkCategorize, db: Session = Depends(get_db)):
    """Categorize multiple media files"""

    for media_id in request.media_ids:
        # Remove existing categories
        existing = db.execute(
            select(MediaCategory).where(MediaCategory.media_id == media_id)
        ).scalars().all()

        for mc in existing:
            db.delete(mc)

        # Add new categories
        for category_id in request.category_ids:
            mc = MediaCategory(
                media_id=media_id,
                category_id=category_id
            )
            db.add(mc)

    db.commit()

    return {"status": "categorized", "count": len(request.media_ids)}

@app.get("/media/{path:path}")
async def serve_media(path: str):
    """Serve media files - path is relative to MEDIA_DIRECTORY"""
    if not MEDIA_DIRECTORY:
        # If no media directory configured, try absolute path
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(path)

    # Convert relative path back to absolute
    media_dir = Path(MEDIA_DIRECTORY).resolve()
    absolute_path = (media_dir / path).resolve()

    # Security check: ensure the resolved path is still within MEDIA_DIRECTORY
    if not str(absolute_path).startswith(str(media_dir)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not absolute_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(str(absolute_path))

@app.get("/thumbnails/{filename}")
async def serve_thumbnail(filename: str):
    """Serve thumbnail files"""
    thumb_path = f"thumbnails/{filename}"
    if not os.path.exists(thumb_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(thumb_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

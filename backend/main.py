from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path

from .database import init_db, get_db
from .scanner import MediaScanner
from .models import Media, Category, MediaCategory
from sqlalchemy import select
from sqlalchemy.orm import Session

app = FastAPI(title="Media Categorizer")

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
    # Create thumbnails directory
    os.makedirs("thumbnails", exist_ok=True)

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

@app.get("/api/scan/status")
async def scan_status():
    """Get the current scan status"""
    # This would be implemented with a proper task queue in production
    return {"status": "idle"}

@app.get("/api/media")
async def get_media(
    skip: int = 0,
    limit: int = 50,
    category_id: Optional[int] = None,
    uncategorized: bool = False
):
    """Get all media files"""
    db = next(get_db())

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

    return [
        {
            "id": m.id,
            "path": m.path,
            "filename": m.filename,
            "type": m.type,
            "size": m.size,
            "width": m.width,
            "height": m.height,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "thumbnail_path": m.thumbnail_path,
        }
        for m in media_items
    ]

@app.get("/api/media/{media_id}")
async def get_media_item(media_id: int):
    """Get a specific media file with its categories"""
    db = next(get_db())

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
async def get_categories():
    """Get all categories"""
    db = next(get_db())
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
async def create_category(category: CategoryCreate):
    """Create a new category"""
    db = next(get_db())

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
async def update_category(category_id: int, category: CategoryUpdate):
    """Update a category"""
    db = next(get_db())

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
async def delete_category(category_id: int):
    """Delete a category"""
    db = next(get_db())

    category = db.execute(
        select(Category).where(Category.id == category_id)
    ).scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()

    return {"status": "deleted"}

@app.post("/api/media/categorize")
async def categorize_media(request: MediaCategorize):
    """Categorize a media file"""
    db = next(get_db())

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
async def bulk_categorize(request: BulkCategorize):
    """Categorize multiple media files"""
    db = next(get_db())

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
    """Serve media files"""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)

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

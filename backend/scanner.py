import os
from pathlib import Path
from typing import List, Set
from PIL import Image
import hashlib
import gxhash
from .database import SessionLocal
from .models import Media
from sqlalchemy import select

# Supported media extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'}
VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'}
GIF_EXTENSIONS = {'.gif'}

ALL_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

class MediaScanner:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir).resolve()
        self.db = SessionLocal()
        self.thumbnails_dir = Path("thumbnails")
        self.thumbnails_dir.mkdir(exist_ok=True)

    def scan(self):
        """Scan directory recursively for media files"""
        print(f"Scanning directory: {self.root_dir}")
        media_files = self._find_media_files()
        print(f"Found {len(media_files)} media files")

        for file_path in media_files:
            self._process_media_file(file_path)

        self.db.close()
        print("Scan complete")

    def process_file(self, file_path: Path):
        """Public method to process a single file"""
        return self._process_media_file(file_path)

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate gxhash of a file"""
        hasher = gxhash.GxHash128(seed=0)
        with open(file_path, 'rb') as f:
            file_hash = hasher.hash_file(f)
        return str(file_hash)

    def _find_media_files(self) -> List[Path]:
        """Find all media files in directory recursively"""
        media_files = []

        for root, dirs, files in os.walk(self.root_dir):
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in ALL_EXTENSIONS:
                    media_files.append(file_path)

        return media_files

    def _process_media_file(self, file_path: Path):
        """Process a single media file"""
        try:
            # Check if file still exists (might have been deleted as duplicate)
            if not file_path.exists():
                return

            # Calculate file hash first
            file_hash = self._calculate_file_hash(file_path)

            # Check if file with same hash already exists (duplicate)
            existing_hash = self.db.execute(
                select(Media).where(Media.file_hash == file_hash)
            ).scalar_one_or_none()

            if existing_hash:
                print(f"Duplicate file (same content): {file_path.name} -> {existing_hash.filename}")

                # Check if existing file has categories
                has_categories = len(existing_hash.categories) > 0

                if has_categories:
                    # Keep the existing file (has categories), delete the new duplicate
                    try:
                        if file_path.exists():
                            file_path.unlink()
                            # Verify deletion
                            if not file_path.exists():
                                print(f"✓ Deleted duplicate file (keeping categorized original): {file_path.name}")
                            else:
                                print(f"✗ Failed to delete duplicate file: {file_path.name}")
                        else:
                            print(f"⚠ Duplicate file already deleted: {file_path.name}")
                    except Exception as e:
                        print(f"✗ Error deleting duplicate file {file_path.name}: {e}")
                    return
                else:
                    # Existing has no categories, delete it and process the new one
                    # This allows the new file location to be indexed instead
                    try:
                        existing_path = Path(existing_hash.path)
                        if existing_path.exists() and existing_path != file_path:
                            existing_path.unlink()
                            if not existing_path.exists():
                                print(f"✓ Deleted uncategorized duplicate: {existing_hash.filename}")
                            else:
                                print(f"✗ Failed to delete uncategorized duplicate: {existing_hash.filename}")

                        # Delete thumbnail if exists
                        if existing_hash.thumbnail_path:
                            thumb_path = Path(existing_hash.thumbnail_path)
                            if thumb_path.exists():
                                thumb_path.unlink()

                        # Remove from database
                        self.db.delete(existing_hash)
                        self.db.commit()
                        print(f"✓ Removed DB entry for {existing_hash.filename}, processing new file {file_path.name}")
                    except Exception as e:
                        print(f"✗ Error removing uncategorized duplicate {existing_hash.filename}: {e}")
                        self.db.rollback()
                        # If we can't delete the existing, delete the new one instead
                        try:
                            if file_path.exists():
                                file_path.unlink()
                                if not file_path.exists():
                                    print(f"✓ Deleted new duplicate file instead: {file_path.name}")
                                else:
                                    print(f"✗ Failed to delete new file: {file_path.name}")
                        except Exception as e2:
                            print(f"✗ Error deleting new file {file_path.name}: {e2}")
                        return
                    # Continue processing the new file below

            # Check if already in database by path
            existing = self.db.execute(
                select(Media).where(Media.path == str(file_path))
            ).scalar_one_or_none()

            if existing:
                print(f"Already indexed: {file_path.name}")
                return

            # Get file info
            stat = file_path.stat()
            file_size = stat.st_size

            # Determine type
            ext = file_path.suffix.lower()
            if ext in VIDEO_EXTENSIONS:
                media_type = "video"
            elif ext == '.gif':
                media_type = "gif"
            else:
                media_type = "image"

            # Get dimensions and create thumbnail for images
            width, height = None, None
            thumbnail_path = None

            if media_type in ["image", "gif"]:
                try:
                    with Image.open(file_path) as img:
                        width, height = img.size

                        # Create thumbnail
                        thumbnail_path = self._create_thumbnail(file_path, img)
                except Exception as e:
                    print(f"Error processing image {file_path}: {e}")

            # Add to database
            media = Media(
                path=str(file_path),
                filename=file_path.name,
                type=media_type,
                size=file_size,
                width=width,
                height=height,
                thumbnail_path=thumbnail_path,
                file_hash=file_hash
            )
            self.db.add(media)
            self.db.commit()

            print(f"Indexed: {file_path.name}")

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            self.db.rollback()

    def _create_thumbnail(self, file_path: Path, img: Image.Image) -> str:
        """Create a thumbnail for an image"""
        # Create unique thumbnail filename
        file_hash = hashlib.md5(str(file_path).encode()).hexdigest()
        thumbnail_name = f"{file_hash}.jpg"
        thumbnail_path = self.thumbnails_dir / thumbnail_name

        # Create thumbnail
        img_copy = img.copy()
        img_copy.thumbnail((300, 300), Image.Resampling.LANCZOS)

        # Convert to RGB if necessary (for PNGs with transparency)
        if img_copy.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img_copy.size, (255, 255, 255))
            if img_copy.mode == 'P':
                img_copy = img_copy.convert('RGBA')
            background.paste(img_copy, mask=img_copy.split()[-1] if img_copy.mode in ('RGBA', 'LA') else None)
            img_copy = background

        img_copy.save(thumbnail_path, "JPEG", quality=85)

        return str(thumbnail_path)

    def __del__(self):
        """Clean up database connection"""
        if hasattr(self, 'db'):
            self.db.close()

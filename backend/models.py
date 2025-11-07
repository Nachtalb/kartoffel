from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, unique=True, nullable=False, index=True)
    filename = Column(String, nullable=False)
    type = Column(String, nullable=False)  # image, video, gif
    size = Column(BigInteger)
    width = Column(Integer)
    height = Column(Integer)
    thumbnail_path = Column(String)
    file_hash = Column(String, index=True)  # gxhash hash for duplicate detection
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    categories = relationship("MediaCategory", back_populates="media", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#3B82F6")
    created_at = Column(DateTime, default=datetime.utcnow)

    media = relationship("MediaCategory", back_populates="category", cascade="all, delete-orphan")

class MediaCategory(Base):
    __tablename__ = "media_categories"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"))
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.utcnow)

    media = relationship("Media", back_populates="categories")
    category = relationship("Category", back_populates="media")

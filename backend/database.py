from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./media_categorizer.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def migrate_db():
    """Run database migrations"""
    inspector = inspect(engine)

    # Check if media table exists
    if 'media' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('media')]

        # Add file_hash column if it doesn't exist
        if 'file_hash' not in columns:
            print("Running migration: Adding file_hash column to media table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE media ADD COLUMN file_hash VARCHAR"))
                conn.execute(text("CREATE INDEX ix_media_file_hash ON media (file_hash)"))
                conn.commit()
            print("Migration complete: file_hash column added")

def init_db():
    """Initialize the database"""
    from .models import Media, Category, MediaCategory
    Base.metadata.create_all(bind=engine)

    # Run migrations for existing databases
    migrate_db()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

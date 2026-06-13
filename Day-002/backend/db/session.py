from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from backend.core.config import settings
from backend.db.models import Base

# Setup connection arguments for SQLite if needed
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Setup SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """
    Initializes the database.
    If PostgreSQL is used, creates the pgvector extension first.
    Creates all tables.
    """
    # Enable SQLite foreign keys if it is SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys = ON;"))
    
    # Enable pgvector extension on PostgreSQL
    elif settings.DATABASE_URL.startswith("postgresql"):
        with engine.connect() as conn:
            # PostgreSQL requires autocommit block for CREATE EXTENSION
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            
    # Create all tables defined in models.py
    Base.metadata.create_all(bind=engine)

def get_db():
    """
    FastAPI dependency to yield a database session and close it after request completion.
    """
    db = SessionLocal()
    # Enable foreign keys for SQLite sessions
    if settings.DATABASE_URL.startswith("sqlite"):
         db.execute(text("PRAGMA foreign_keys = ON;"))
    try:
        yield db
    finally:
        db.close()

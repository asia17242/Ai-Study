import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, Text, Date, DateTime, ForeignKey, TypeDecorator
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class VectorType(TypeDecorator):
    """
    Custom SQLAlchemy type to support PostgreSQL pgvector (Vector(3072))
    and SQLite fallback (stored as JSON text) seamlessly.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(3072))
            except ImportError:
                return dialect.type_descriptor(Text())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            # pgvector accepts a list of floats
            return value
        else:
            # SQLite stores as JSON string
            return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            # pgvector returns a numpy array or list of floats
            # If pgvector returns list or array, we keep it as is
            return list(value) if not isinstance(value, list) else value
        else:
            # SQLite returns JSON string, load it back to list of floats
            return json.loads(value)

# Database Tables Mapping

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(20), unique=True, index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    reports = relationship("Report", back_populates="stock", cascade="all, delete-orphan")


class Broker(Base):
    __tablename__ = "brokers"

    id = Column(Integer, primary_key=True, index=True)
    broker_name = Column(String(255), unique=True, index=True, nullable=False)

    # Relationships
    reports = relationship("Report", back_populates="broker", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    broker_id = Column(Integer, ForeignKey("brokers.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(Date, nullable=False)
    analyst_name = Column(String(255), nullable=True)
    rating = Column(String(20), nullable=False)  # BUY, HOLD, SELL
    target_price = Column(Numeric(precision=12, scale=2), nullable=True)
    pdf_path = Column(Text, nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="reports")
    broker = relationship("Broker", back_populates="reports")
    bull_points = relationship("BullPoint", back_populates="report", cascade="all, delete-orphan")
    bear_points = relationship("BearPoint", back_populates="report", cascade="all, delete-orphan")
    financial_forecasts = relationship("FinancialForecast", back_populates="report", cascade="all, delete-orphan")
    embeddings = relationship("Embedding", back_populates="report", cascade="all, delete-orphan")


class BullPoint(Base):
    __tablename__ = "bull_points"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="bull_points")


class BearPoint(Base):
    __tablename__ = "bear_points"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="bear_points")


class FinancialForecast(Base):
    __tablename__ = "financial_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    revenue_growth = Column(Numeric(precision=8, scale=2), nullable=True)  # in percentage (e.g. 25.0)
    eps = Column(Numeric(precision=12, scale=2), nullable=True)

    # Relationships
    report = relationship("Report", back_populates="financial_forecasts")


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(VectorType, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="embeddings")

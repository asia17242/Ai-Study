import hashlib
import numpy as np
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from openai import OpenAI
from backend.core.config import settings
from backend.db.models import Embedding, Report

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("OPENAI_API_KEY 未設定，Vector Service 將使用確定性模擬向量。")

    def chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        """
        Splits text into chunks of chunk_size with overlap characters.
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += chunk_size - overlap
            
        return chunks

    def generate_embedding(self, chunk_text: str) -> List[float]:
        """
        Generates a 3072-dimensional embedding using OpenAI (text-embedding-3-large).
        Falls back to a deterministic, pseudo-random vector based on SHA-256 if offline.
        """
        if self.client:
            try:
                response = self.client.embeddings.create(
                    model=settings.EMBEDDING_MODEL,
                    input=chunk_text
                )
                return response.data[0].embedding
            except Exception as e:
                logger.error(f"OpenAI embedding generation failed: {str(e)}. Using mock embedding.")
        
        # Deterministic mock embedding based on SHA256 of text
        return self._generate_mock_embedding(chunk_text)

    def _generate_mock_embedding(self, chunk_text: str, dimensions: int = 3072) -> List[float]:
        """
        Generates a deterministic 3072-dimensional float vector between -1 and 1
        based on the SHA-256 hash of the input text.
        """
        hasher = hashlib.sha256(chunk_text.encode("utf-8"))
        seed = int(hasher.hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        
        # Generate random values and normalize
        vec = rng.uniform(-1.0, 1.0, dimensions)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def search_similar_chunks(
        self, db: Session, query_text: str, limit: int = 5, stock_id: int = None
    ) -> List[Dict[str, Any]]:
        """
        Searches for similar text chunks.
        Supports PostgreSQL pgvector native search or SQLite in-memory cosine similarity search.
        """
        query_vector = self.generate_embedding(query_text)
        
        # Check database dialect
        dialect_name = db.bind.dialect.name
        
        if dialect_name == "postgresql":
            # Native pgvector search using RAW SQL for robustness across extensions
            sql = """
                SELECT e.id, e.chunk_text, e.report_id, (e.embedding <=> :query_vector) as distance,
                       r.pdf_path, s.ticker, s.company_name, b.broker_name
                FROM embeddings e
                JOIN reports r ON e.report_id = r.id
                JOIN stocks s ON r.stock_id = s.id
                JOIN brokers b ON r.broker_id = b.id
            """
            
            params = {"query_vector": str(query_vector), "limit": limit}
            
            if stock_id:
                sql += " WHERE s.id = :stock_id"
                params["stock_id"] = stock_id
                
            sql += " ORDER BY e.embedding <=> :query_vector LIMIT :limit"
            
            results = db.execute(text(sql), params).fetchall()
            
            return [
                {
                    "chunk_text": r.chunk_text,
                    "report_id": r.report_id,
                    "score": 1.0 - float(r.distance), # Cosine similarity score
                    "pdf_path": r.pdf_path,
                    "ticker": r.ticker,
                    "company_name": r.company_name,
                    "broker": r.broker_name
                }
                for r in results
            ]
            
        else:
            # SQLite / Fallback database mode: retrieve all and perform in-memory Cosine Similarity
            # First, fetch records
            query = db.query(Embedding).join(Report)
            if stock_id:
                query = query.filter(Report.stock_id == stock_id)
                
            embeddings = query.all()
            
            if not embeddings:
                return []
                
            # Compute similarities
            q_vec = np.array(query_vector, dtype=np.float32)
            scored_chunks = []
            
            for emb in embeddings:
                # emb.embedding is deserialized from JSON by our custom VectorType TypeDecorator
                db_vec = np.array(emb.embedding, dtype=np.float32)
                
                # Cosine Similarity = dot(A, B) / (norm(A) * norm(B))
                dot_val = np.dot(q_vec, db_vec)
                norm_q = np.linalg.norm(q_vec)
                norm_db = np.linalg.norm(db_vec)
                
                if norm_q == 0 or norm_db == 0:
                    similarity = 0.0
                else:
                    similarity = float(dot_val / (norm_q * norm_db))
                    
                # Fetch related meta-data
                scored_chunks.append({
                    "chunk_text": emb.chunk_text,
                    "report_id": emb.report_id,
                    "score": similarity,
                    "pdf_path": emb.report.pdf_path,
                    "ticker": emb.report.stock.ticker,
                    "company_name": emb.report.stock.company_name,
                    "broker": emb.report.broker.broker_name
                })
                
            # Sort by similarity score descending and apply limit
            scored_chunks.sort(key=lambda x: x["score"], reverse=True)
            return scored_chunks[:limit]

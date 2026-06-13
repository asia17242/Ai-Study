import json
import hashlib
from typing import Optional

import chromadb
from chromadb.config import Settings

from config.settings import EMBEDDINGS_DIR, CHUNK_SIZE, CHUNK_OVERLAP


class VectorStore:
    def __init__(self, collection_name: str = "report_chunks"):
        self.client = chromadb.PersistentClient(
            path=str(EMBEDDINGS_DIR),
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_document(self, doc_id: str, text: str, metadata: dict):
        chunks = self._chunk_text(text)
        for i, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}_{i}"
            chunk_hash = hashlib.sha256(chunk.encode()).hexdigest()[:16]
            existing = self.collection.get(ids=[chunk_id])
            if existing and existing["ids"]:
                continue
            chunk_meta = {**metadata, "chunk_index": i, "chunk_hash": chunk_hash}
            self.collection.add(
                ids=[chunk_id],
                documents=[chunk],
                metadatas=[chunk_meta]
            )

    def search(self, query: str, top_k: int = 5, filter_dict: Optional[dict] = None):
        params = {
            "query_texts": [query],
            "n_results": top_k
        }
        if filter_dict:
            params["where"] = filter_dict
        results = self.collection.query(**params)
        return results

    def get_document_chunks(self, doc_id: str):
        results = self.collection.get(
            where={"doc_id": doc_id}
        )
        return results

    def delete_document(self, doc_id: str):
        results = self.collection.get(
            where={"doc_id": doc_id}
        )
        if results and results["ids"]:
            self.collection.delete(ids=results["ids"])

    def _chunk_text(self, text: str) -> list[str]:
        if len(text) <= CHUNK_SIZE:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + CHUNK_SIZE
            if end >= len(text):
                chunks.append(text[start:])
                break
            split_pos = text.rfind(".", start, end)
            if split_pos == -1 or split_pos < start + CHUNK_SIZE // 2:
                split_pos = text.rfind("\n", start, end)
            if split_pos == -1 or split_pos < start + CHUNK_SIZE // 2:
                split_pos = end
            else:
                split_pos += 1
            chunks.append(text[start:split_pos])
            start = split_pos
            if len(chunks) > 1:
                overlap_start = max(0, start - CHUNK_OVERLAP)
                chunks[-1] = text[overlap_start:split_pos]
        return chunks

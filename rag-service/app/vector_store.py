from __future__ import annotations

import hashlib
import math
import re
from typing import Any

import chromadb

from .config import RAG_CHROMA_DIR, RAG_GLOBAL_COLLECTION, RAG_PATIENT_COLLECTION


_client = chromadb.PersistentClient(path=RAG_CHROMA_DIR)

_EMBEDDING_DIM = 384
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall((text or "").lower())


def _embed_text(text: str) -> list[float]:
    # Deterministic local embedding: hash each token into a fixed-size vector.
    # This avoids network downloads and keeps ingestion fully offline.
    vec = [0.0] * _EMBEDDING_DIM
    for tok in _tokenize(text):
        digest = hashlib.sha256(tok.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:4], "big") % _EMBEDDING_DIM
        sign = -1.0 if (digest[4] & 1) else 1.0
        vec[bucket] += sign

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def _embed_texts(texts: list[str]) -> list[list[float]]:
    return [_embed_text(text) for text in texts]


def get_collection(source_type: str):
    if source_type == "patient_report":
        return _client.get_or_create_collection(
            name=RAG_PATIENT_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )

    return _client.get_or_create_collection(
        name=RAG_GLOBAL_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []

    chunks: list[str] = []
    cursor = 0
    n = len(text)

    while cursor < n:
        end = min(cursor + chunk_size, n)
        chunk = text[cursor:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        cursor = max(0, end - overlap)

    return chunks


def build_chunk_id(source_id: str, index: int, content: str) -> str:
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]
    return f"{source_id}:{index}:{digest}"


def upsert_document(
    source_id: str,
    source_name: str,
    text: str,
    source_type: str,
    patient_id: str | None,
    response_id: int | None,
    metadata: dict[str, Any] | None = None,
) -> int:
    metadata = metadata or {}
    collection = get_collection(source_type)
    chunks = chunk_text(text)

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []

    for i, chunk in enumerate(chunks):
        ids.append(build_chunk_id(source_id, i, chunk))
        documents.append(chunk)
        metadatas.append(
            {
                "source_id": source_id,
                "source_name": source_name,
                "source_type": source_type,
                "chunk_index": i,
                "patient_id": patient_id or "",
                "response_id": str(response_id) if response_id is not None else "",
                **metadata,
            }
        )

    if ids:
        embeddings = _embed_texts(documents)
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    return len(ids)


def retrieve_evidence(
    query: str,
    patient_id: str | None,
    response_id: int | None,
    top_k: int,
):
    patient_collection = get_collection("patient_report")
    global_collection = get_collection("guideline")

    patient_where = None
    if patient_id:
        patient_where = {"patient_id": patient_id}
    elif response_id is not None:
        patient_where = {"response_id": str(response_id)}

    patient_res = patient_collection.query(
        query_embeddings=[_embed_text(query)],
        n_results=max(1, top_k),
        where=patient_where,
    )

    global_res = global_collection.query(
        query_embeddings=[_embed_text(query)],
        n_results=max(1, top_k),
    )

    return patient_res, global_res

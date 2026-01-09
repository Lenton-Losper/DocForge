"""Normalized document structure model."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class Section(BaseModel):
    """Document section with hierarchical structure."""
    title: str
    level: int  # Heading level (1-6)
    content: str
    page: Optional[int] = None


class Image(BaseModel):
    """Image reference in document."""
    caption: Optional[str] = None
    page: Optional[int] = None
    alt_text: Optional[str] = None


class DocumentMetadata(BaseModel):
    """Document metadata."""
    page_count: int
    word_count: int
    file_type: str  # "docx" or "pdf"
    file_name: str


class Document(BaseModel):
    """Normalized document structure."""
    sections: List[Section]
    images: List[Image]
    metadata: DocumentMetadata

    def get_section_titles(self) -> List[str]:
        """Get all section titles for rule checking."""
        return [s.title.lower() for s in self.sections]

    def get_heading_levels(self) -> List[int]:
        """Get all heading levels for sequence validation."""
        return [s.level for s in self.sections if s.level > 0]

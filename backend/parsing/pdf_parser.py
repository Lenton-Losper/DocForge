"""PDF file parser."""
from typing import List
import pdfplumber
import re

from models.document_model import Document, Section, Image, DocumentMetadata


def parse_pdf(file_path: str, file_name: str) -> Document:
    """
    Parse a PDF file into normalized Document structure.
    
    Args:
        file_path: Path to the PDF file
        file_name: Original filename
        
    Returns:
        Normalized Document object
    """
    sections: List[Section] = []
    images: List[Image] = []
    word_count = 0
    
    with pdfplumber.open(file_path) as pdf:
        page_count = len(pdf.pages)
        
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if not text:
                continue
            
            # Extract images on this page
            if page.images:
                for img in page.images:
                    images.append(Image(
                        caption=None,  # Would need OCR/caption detection
                        page=page_num,
                        alt_text=None
                    ))
            
            # Split text into lines and identify headings
            lines = text.split('\n')
            current_section_title = None
            current_section_level = 0
            current_section_content: List[str] = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                word_count += len(line.split())
                
                # Heuristic: headings are usually short, bold-like, or all caps
                # Check if line looks like a heading
                is_heading = (
                    len(line) < 100 and
                    (line.isupper() or 
                     line[0].isupper() and not line.endswith('.') and
                     not any(char.isdigit() for char in line[-3:]))
                )
                
                if is_heading and len(line) < 80:
                    # Save previous section
                    if current_section_title is not None:
                        sections.append(Section(
                            title=current_section_title,
                            level=current_section_level,
                            content='\n'.join(current_section_content),
                            page=page_num
                        ))
                    
                    # Determine heading level (heuristic: font size would be better)
                    # For now, use position and formatting clues
                    if line.isupper() and len(line) < 50:
                        level = 1
                    elif line[0].isupper() and not line.endswith('.'):
                        level = 2
                    else:
                        level = 3
                    
                    current_section_title = line
                    current_section_level = level
                    current_section_content = []
                else:
                    # Regular content
                    if current_section_title is None:
                        current_section_title = "Introduction"
                        current_section_level = 1
                    current_section_content.append(line)
            
            # Save last section from this page
            if current_section_title is not None:
                sections.append(Section(
                    title=current_section_title,
                    level=current_section_level,
                    content='\n'.join(current_section_content),
                    page=page_num
                ))
    
    metadata = DocumentMetadata(
        page_count=page_count,
        word_count=word_count,
        file_type="pdf",
        file_name=file_name
    )
    
    return Document(
        sections=sections,
        images=images,
        metadata=metadata
    )

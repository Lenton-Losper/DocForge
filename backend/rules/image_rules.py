"""Rules for checking image documentation."""
from typing import List
from models.document_model import Document
from models.issue_model import Issue, IssueSeverity


def check_image_captions(document: Document) -> List[Issue]:
    """
    Check if images have captions or alt text.
    
    Args:
        document: Normalized document to check
        
    Returns:
        List of issues for images without captions
    """
    issues: List[Issue] = []
    
    for idx, image in enumerate(document.images):
        if not image.caption and not image.alt_text:
            issues.append(Issue(
                id=f"MISSING_IMAGE_CAPTION_{idx}",
                severity=IssueSeverity.WARN,
                message=f"Image on page {image.page or 'unknown'} missing caption or alt text",
                page=image.page,
                penalty=5
            ))
    
    return issues

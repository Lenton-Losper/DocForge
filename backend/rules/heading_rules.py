"""Rules for checking heading structure and hierarchy."""
from typing import List
from models.document_model import Document
from models.issue_model import Issue, IssueSeverity


def check_heading_sequence(document: Document) -> List[Issue]:
    """
    Check for broken heading sequences (e.g., H1 -> H3 skipping H2).
    
    Args:
        document: Normalized document to check
        
    Returns:
        List of issues for heading sequence problems
    """
    issues: List[Issue] = []
    heading_levels = document.get_heading_levels()
    
    if not heading_levels:
        return issues
    
    prev_level = heading_levels[0]
    
    for idx, level in enumerate(heading_levels[1:], start=1):
        # Check for skipped levels (e.g., H1 -> H3)
        if level > prev_level + 1:
            issues.append(Issue(
                id=f"BROKEN_HEADING_SEQUENCE_{idx}",
                severity=IssueSeverity.WARN,
                message=f"Heading level jumps from H{prev_level} to H{level} (skipped levels)",
                page=document.sections[idx].page if idx < len(document.sections) else None,
                penalty=10
            ))
        prev_level = level
    
    return issues


def check_excessive_depth(document: Document) -> List[Issue]:
    """
    Check for excessive heading depth (beyond H4 is usually too deep).
    
    Args:
        document: Normalized document to check
        
    Returns:
        List of issues for excessive depth
    """
    issues: List[Issue] = []
    heading_levels = document.get_heading_levels()
    
    for idx, level in enumerate(heading_levels):
        if level > 4:
            issues.append(Issue(
                id=f"EXCESSIVE_HEADING_DEPTH_{idx}",
                severity=IssueSeverity.WARN,
                message=f"Heading H{level} is too deep (recommend max H4)",
                page=document.sections[idx].page if idx < len(document.sections) else None,
                penalty=5
            ))
    
    return issues

"""Documentation quality scoring system."""
from typing import List
from models.document_model import Document
from models.issue_model import Issue, IssueSeverity
from rules.required_sections import check_required_sections
from rules.image_rules import check_image_captions
from rules.heading_rules import check_heading_sequence, check_excessive_depth


def analyze_document(document: Document) -> tuple[int, List[Issue]]:
    """
    Analyze document and compute quality score with issues.
    
    Starts at 100 and subtracts penalties for each issue.
    
    Args:
        document: Normalized document to analyze
        
    Returns:
        Tuple of (score, issues_list)
    """
    issues: List[Issue] = []
    
    # Run all rule checks
    issues.extend(check_required_sections(document))
    issues.extend(check_image_captions(document))
    issues.extend(check_heading_sequence(document))
    issues.extend(check_excessive_depth(document))
    
    # Calculate score
    score = 100
    for issue in issues:
        score -= issue.penalty
    
    # Ensure score doesn't go below 0
    score = max(0, score)
    
    return score, issues

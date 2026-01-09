"""Rules for checking required documentation sections."""
from typing import List
from models.document_model import Document
from models.issue_model import Issue, IssueSeverity


# Common required sections for technical documentation
REQUIRED_SECTIONS = {
    "introduction": ["introduction", "intro", "overview", "getting started"],
    "installation": ["installation", "install", "setup", "getting started"],
    "safety": ["safety", "warning", "caution", "important"],
    "troubleshooting": ["troubleshooting", "troubleshoot", "faq", "problems", "issues"]
}


def check_required_sections(document: Document) -> List[Issue]:
    """
    Check if document contains required sections.
    
    Args:
        document: Normalized document to check
        
    Returns:
        List of issues for missing sections
    """
    issues: List[Issue] = []
    section_titles = document.get_section_titles()
    
    for required_name, keywords in REQUIRED_SECTIONS.items():
        found = False
        for title in section_titles:
            if any(keyword in title for keyword in keywords):
                found = True
                break
        
        if not found:
            issues.append(Issue(
                id=f"MISSING_SECTION_{required_name.upper()}",
                severity=IssueSeverity.ERROR,
                message=f"Missing required section: {required_name.title()}",
                page=None,
                penalty=15
            ))
    
    return issues

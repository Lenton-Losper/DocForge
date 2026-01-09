"""Issue and lint report models."""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel


class IssueSeverity(str, Enum):
    """Issue severity levels."""
    ERROR = "ERROR"
    WARN = "WARN"


class Issue(BaseModel):
    """A single documentation issue."""
    id: str
    severity: IssueSeverity
    message: str
    page: Optional[int] = None
    penalty: int  # Points deducted from score


class LintSummary(BaseModel):
    """Summary of lint results."""
    errors: int
    warnings: int


class LintReport(BaseModel):
    """Complete lint analysis report."""
    score: int
    summary: LintSummary
    issues: List[Issue]

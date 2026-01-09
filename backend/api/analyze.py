"""Document analysis API endpoint."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import os
import tempfile

from models.document_model import Document
from models.issue_model import LintReport, LintSummary, Issue
from parsing.docx_parser import parse_docx
from parsing.pdf_parser import parse_pdf
from rules.scoring import analyze_document

router = APIRouter()


@router.post("/analyze", response_model=LintReport)
async def analyze_document_endpoint(
    file: UploadFile = File(...)
):
    """
    Upload and analyze a documentation file.
    
    Accepts .docx, .pdf, .doc, .md files.
    Returns lint report with score and issues.
    """
    # Validate file type
    allowed_extensions = {'.docx', '.pdf', '.doc', '.md'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Parse document based on file type
        if file_ext == '.docx' or file_ext == '.doc':
            document = parse_docx(tmp_path, file.filename)
        elif file_ext == '.pdf':
            document = parse_pdf(tmp_path, file.filename)
        else:
            # .md files - for now, treat as text (could add markdown parser)
            raise HTTPException(
                status_code=501,
                detail="Markdown parsing not yet implemented"
            )
        
        # Analyze document
        score, issues = analyze_document(document)
        
        # Build summary
        errors = sum(1 for issue in issues if issue.severity.value == "ERROR")
        warnings = sum(1 for issue in issues if issue.severity.value == "WARN")
        
        summary = LintSummary(errors=errors, warnings=warnings)
        
        return LintReport(
            score=score,
            summary=summary,
            issues=issues
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

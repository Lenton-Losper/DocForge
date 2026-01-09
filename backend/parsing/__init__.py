"""Parsing package."""
from parsing.docx_parser import parse_docx
from parsing.pdf_parser import parse_pdf

__all__ = ["parse_docx", "parse_pdf"]

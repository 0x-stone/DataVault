from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class ComplianceStatus(Enum):
    COMPLIANT = "compliant"
    PARTIAL = "partial"
    NON_COMPLIANT = "non_compliant"


class URLSchema(BaseModel):
    url:str


class ValidationFinding(BaseModel):
    ndpa_section: str = Field(..., description="NDPA section identifier (e.g. '24(1)(a)')")
    requirement_title: str = Field(..., description="Short human-readable title of the requirement")
    status: ComplianceStatus = Field(..., description="compliant | partial | non_compliant")
    evidence: Optional[str] = Field("", description="Exact quote or excerpt from the privacy policy as evidence")
    gap: Optional[str] = Field("", description="What's missing or incorrect (if any)")
    recommendation: Optional[str] = Field("", description="Suggested remediation text")
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="LLM-assigned confidence: float between 0.0 and 1.0"
    )

class ValidationFindings(BaseModel):
    findings: list[ValidationFinding]

class FindingDetail(BaseModel):
    ndpa_section: str
    requirement_title: str
    status: str
    evidence: str
    confidence: float
    gap: str = ""
    recommendation: str
    severity: str = "medium"


class RiskBreakdown(BaseModel):
    missing: int=0
    compliant: int=0
    high_failures: int = 0
    medium_failures: int = 0
    low_failures: int = 0
    high_partials: int = 0
    medium_partials: int = 0
    low_partials: int = 0

class QASchema(BaseModel):
    question: str

class QARagResposneSchema(BaseModel):
    message: str= Field(description="response to user's query")
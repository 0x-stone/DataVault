from typing import List, Any
import os
import asyncio
import logging
from itertools import cycle
from dotenv import load_dotenv
import nest_asyncio

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PlaywrightURLLoader
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from .schemas import *
from .utils import *


load_dotenv()
nest_asyncio.apply()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


EMBEDDING_MODEL = "models/gemini-embedding-001"
NDPA_QA_VECTORSTORE_PATH="/app/ndpa_qa_vectorstore"
PLAYWRIGHT_HEADLESS = True
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
BATCH_SIZE = 5
LLM_TEMPERATURE = 0.0 
MAX_CONCURRENT_LLM = 4           
LLM_RETRY_SECONDS = 1.0
LLM_RETRY_ATTEMPTS = 3

GOOGLE_API_KEYS = os.getenv("GOOGLE_API_KEYS", "")
if GOOGLE_API_KEYS:
    GOOGLE_API_KEYS = eval(GOOGLE_API_KEYS)
else:
    GOOGLE_API_KEYS = []

if not GOOGLE_API_KEYS:
    raise RuntimeError("No GOOGLE_API_KEYS found in env")



embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)

vector_store = FAISS.load_local(
    NDPA_QA_VECTORSTORE_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)



llm_clients = [
    ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=LLM_TEMPERATURE,
        google_api_key=key
    )
    for key in GOOGLE_API_KEYS
]

llm_cycle = cycle(llm_clients)
_llm_semaphore = asyncio.Semaphore(MAX_CONCURRENT_LLM)


def get_llm():
    """Round-robin LLM getter (synchronous)."""
    return next(llm_cycle)




def privacy_analyzer_batch_node(llm):
    system_prompt = """
You are an expert NDPA (Nigeria Data Protection Act 2023) compliance auditor.

TASK: Analyze the provided privacy policy CHUNK and identify clear evidence of compliance with NDPA requirements.

GUIDELINES:
- Analyze ONLY the given chunk; do not assume content exists outside this chunk.
- Only return NDPA sections that have clear, verifiable evidence in this chunk.
- Do NOT mark any section as 'non_compliant' if it is missing; simply omit it if not found.
- Be highly conservative: mark 'compliant' only when evidence fully satisfies the requirement, 'partial' only if evidence partially satisfies it.
- Include exact quotes from the text as evidence, and provide a short justification if evidence is paraphrased.
- Avoid speculation: if you cannot confirm compliance from this chunk, omit the section entirely.

Return strict JSON matching this schema for each NDPA section found in this chunk:
[
  {{
    "ndpa_section": "24(1)(a)",
    "requirement_title": "Fair, lawful and transparent processing",
    "status": "compliant | partial",
    "evidence": "exact quote",
    "gap": "what's missing if partial",
    "recommendation": "short, precise remediation step",
    "confidence": 0.0-1.0
  }}
]
IMPORTANT:
- Output ONLY JSON; do NOT include explanations, commentary, or extra text.
- Be precise, accurate, and allow paraphrased evidence that clearly satisfies the requirement.

ADDITIONAL INSTRUCTION:
- Pay special attention to rights related to data subject actions (withdrawal of consent, objection to processing, marketing opt-outs, data access). Even if phrased differently than the requirement title, mark as compliant if the policy clearly grants the right.
"""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", """
PRIVACY POLICY CHUNK:
{batch_text}

NDPA CONTEXT:
NDPA_PUBLIC_POLICY_MANDATORY_SECTIONS = [
    # ──────────────────────────────────────────────
    # SECTION 24 — Principles and Lawful Basis for Processing
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Provide Confirmation of Data Processing and Purposes",
        "ndpa_section": "Section 24(1)(a–b)",
        "rationale": "Must state what personal data is collected, purposes of processing, and that it is lawful and transparent."
    }},
    {{
        "requirement_title": "Disclose Categories of Personal Data and Recipients",
        "ndpa_section": "Section 24(1)(b, c)",
        "rationale": "Privacy policy must describe categories of data collected and who receives it."
    }},
    {{
        "requirement_title": "Provide Data Retention Period or Criteria",
        "ndpa_section": "Section 24(1)(d)",
        "rationale": "Retention periods or criteria must be disclosed to ensure accountability and transparency."
    }},

    # ──────────────────────────────────────────────
    # SECTION 34 — Rights of a Data Subject
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Inform Data Subjects of Rights and Complaint Options",
        "ndpa_section": "Section 34(1)(a–e)",
        "rationale": "Policy must outline available data subject rights and how to exercise them, including right to complain to NDPC."
    }},
    {{
        "requirement_title": "Provide Copy of Personal Data in Common Format",
        "ndpa_section": "Section 34(2)",
        "rationale": "Policy should mention right of access and how users can request their data."
    }},
    {{
        "requirement_title": "Correct or Erase Inaccurate or Outdated Data",
        "ndpa_section": "Section 34(3)",
        "rationale": "Must describe procedure for requesting correction or deletion."
    }},
    {{
        "requirement_title": "Restrict Processing Pending Resolution or Objection",
        "ndpa_section": "Section 34(4)",
        "rationale": "Policy should explain right to restrict processing when disputes exist."
    }},
    {{
        "requirement_title": "Erase Personal Data When No Longer Necessary",
        "ndpa_section": "Section 34(5)",
        "rationale": "Must commit to deleting data when purpose is fulfilled."
    }},

    # ──────────────────────────────────────────────
    # SECTION 35 — Withdrawal of Consent
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Allow Data Subjects to Withdraw Consent Easily",
        "ndpa_section": "Section 35(1–2)",
        "rationale": "Privacy policy must explain how consent can be withdrawn at any time and its effects."
    }},

    # ──────────────────────────────────────────────
    # SECTION 36 — Right to Object
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Enable Data Subjects to Object to Processing",
        "ndpa_section": "Section 36(1)",
        "rationale": "Policy must explain right to object to processing on legitimate grounds."
    }},
    {{
        "requirement_title": "Cease Direct Marketing Upon Objection",
        "ndpa_section": "Section 36(2)",
        "rationale": "Must clearly state right to opt out of marketing communications."
    }},

    # ──────────────────────────────────────────────
    # SECTION 30 — Sensitive Personal Data
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Obtain Explicit Consent Before Processing Sensitive Data",
        "ndpa_section": "Section 30(1–2)",
        "rationale": "Policy must mention that explicit consent is required for sensitive data categories (health, biometrics, etc.)."
    }},

    # ──────────────────────────────────────────────
    # SECTION 39 — Data Security
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Implement Technical and Organisational Security Measures",
        "ndpa_section": "Section 24(1)(f) & Section 39(1–3)",
        "rationale": "Policy must state that appropriate safeguards exist to prevent loss, misuse, or unauthorised access."
    }},
    {{
        "requirement_title": "Inform Data Subjects of High-Risk Breaches Promptly",
        "ndpa_section": "Section 40(2)",
        "rationale": "Must explain how individuals will be notified in the event of a serious data breach."
    }},

    # ──────────────────────────────────────────────
    # SECTION 32 — Data Protection Officer
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Provide DPO as Contact Point for the Commission",
        "ndpa_section": "Section 32(2–3)",
        "rationale": "Privacy policy must include DPO or designated contact information for data protection inquiries."
    }},

    # ──────────────────────────────────────────────
    # SECTION 31 — Children or Persons Lacking Legal Capacity
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Obtain Parental or Guardian Consent for Children",
        "ndpa_section": "Section 31(1–3)",
        "rationale": "If processing children’s data, policy must explain need for parental consent."
    }},
    {{
        "requirement_title": "Verify Age and Consent Mechanisms Appropriately",
        "ndpa_section": "Section 31(2)",
        "rationale": "Policy should mention age verification and guardian validation for minors."
    }},

    # ──────────────────────────────────────────────
    # SECTIONS 41–43 — Cross-Border Data Transfers
    # ──────────────────────────────────────────────
    {{
        "requirement_title": "Ensure Adequate Protection for Cross-Border Data Transfers",
        "ndpa_section": "Section 41(1)(a) & Section 42(1–2)",
        "rationale": "Policy must state that data is only transferred to countries with adequate protection or safeguards."
    }},
    {{
        "requirement_title": "Obtain Consent for Transfers Without Adequate Protection",
        "ndpa_section": "Section 43(1)(a)",
        "rationale": "If transferring to a country without adequate safeguards, explicit informed consent is required."
    }}
]

""")
    ])

    return prompt | llm.with_structured_output(ValidationFindings)





async def _llm_invoke_with_retry(llm, payload, method_name = "ainvoke"):
    attempt = 0
    last_exc = None
    async with _llm_semaphore:
        while attempt < LLM_RETRY_ATTEMPTS:
            try:
                invoke = getattr(llm, method_name)
                result = await invoke(payload)
                return result
            except Exception as exc:
                last_exc = exc
                attempt += 1
                wait = LLM_RETRY_SECONDS * (2 ** (attempt - 1))
                logger.warning("LLM call failed (attempt %s/%s): %s. Retrying in %.1fs", attempt, LLM_RETRY_ATTEMPTS, exc, wait)
                await asyncio.sleep(wait)
        logger.error("LLM call failed after %s attempts: %s", LLM_RETRY_ATTEMPTS, last_exc)
        raise last_exc


NDPA_SEVERITY_MAP = {
    "high": [
        "Provide Confirmation of Data Processing and Purposes",
        "Inform Data Subjects of Rights and Complaint Options",
        "Allow Data Subjects to Withdraw Consent Easily",
        "Enable Data Subjects to Object to Processing",
        "Cease Direct Marketing Upon Objection",
        "Obtain Explicit Consent Before Processing Sensitive Data",
        "Implement Technical and Organisational Security Measures",
        "Inform Data Subjects of High-Risk Breaches Promptly",
        "Erase Personal Data When No Longer Necessary",
        "Ensure Adequate Protection for Cross-Border Data Transfers",
        "Obtain Consent for Transfers Without Adequate Protection",
    ],

    "medium": [
        "Disclose Categories of Personal Data and Recipients",
        "Provide Data Retention Period or Criteria",
        "Provide Copy of Personal Data in Common Format",
        "Correct or Erase Inaccurate or Outdated Data",
        "Restrict Processing Pending Resolution or Objection",
        "Provide DPO as Contact Point for the Commission",
        "Obtain Parental or Guardian Consent for Children",
        "Verify Age and Consent Mechanisms Appropriately",
    ],

    "low": [
    ]
}

NDPA_REQUIREMENT_METADATA = {
    # ──────────────────────────────────────────────
    # HIGH SEVERITY REQUIREMENTS
    # ──────────────────────────────────────────────

    "Provide Confirmation of Data Processing and Purposes": {
        "section": "24(1)(a–b)",
        "severity": "high",
        "description": "State what personal data you collect and why.",
        "recommendation": "Add a clear list of data types and the purposes for processing."
    },

    "Inform Data Subjects of Rights and Complaint Options": {
        "section": "34(1)(a–e)",
        "severity": "high",
        "description": "Explain users’ rights and how to complain to the NDPC.",
        "recommendation": "Include a short section describing each right and NDPC complaint channels."
    },

    "Allow Data Subjects to Withdraw Consent Easily": {
        "section": "35(1–2)",
        "severity": "high",
        "description": "Explain how users can withdraw consent at any time.",
        "recommendation": "Provide an email, form, or in-app setting for withdrawing consent."
    },

    "Enable Data Subjects to Object to Processing": {
        "section": "36(1)",
        "severity": "high",
        "description": "Tell users they can object to certain types of processing.",
        "recommendation": "Add instructions on how objections can be submitted."
    },

    "Cease Direct Marketing Upon Objection": {
        "section": "36(2)",
        "severity": "high",
        "description": "Users must be allowed to opt out of marketing.",
        "recommendation": "Provide an unsubscribe link or opt-out email for marketing messages."
    },

    "Obtain Explicit Consent Before Processing Sensitive Data": {
        "section": "30(1–2)",
        "severity": "high",
        "description": "Sensitive personal data requires explicit, informed consent.",
        "recommendation": "Add a clause stating explicit consent is needed for sensitive data like health or biometrics."
    },

    "Implement Technical and Organisational Security Measures": {
        "section": "24(1)(f), 39(1–3)",
        "severity": "high",
        "description": "You must safeguard personal data from misuse or unauthorised access.",
        "recommendation": "Briefly list key security measures such as encryption or access controls."
    },

    "Inform Data Subjects of High-Risk Breaches Promptly": {
        "section": "40(2)",
        "severity": "high",
        "description": "Users must be notified if a breach creates high risk to them.",
        "recommendation": "Add a statement on how and when users will be notified of serious breaches."
    },

    "Erase Personal Data When No Longer Necessary": {
        "section": "34(5)",
        "severity": "high",
        "description": "Data must be deleted when it is no longer needed.",
        "recommendation": "Include your data deletion schedule or criteria."
    },

    "Ensure Adequate Protection for Cross-Border Data Transfers": {
        "section": "41(1)(a), 42(1–2)",
        "severity": "high",
        "description": "Transfers must only go to countries with adequate protection or safeguards.",
        "recommendation": "State the safeguards used for international transfers (e.g., adequacy decisions, contracts)."
    },

    "Obtain Consent for Transfers Without Adequate Protection": {
        "section": "43(1)(a)",
        "severity": "high",
        "description": "Explicit informed consent is required if a transfer lacks adequate safeguards.",
        "recommendation": "Add a clause explaining that users will be asked before such transfers occur."
    },

    # ──────────────────────────────────────────────
    # MEDIUM SEVERITY REQUIREMENTS
    # ──────────────────────────────────────────────

    "Disclose Categories of Personal Data and Recipients": {
        "section": "24(1)(b, c)",
        "severity": "medium",
        "description": "Explain what data you collect and who you share it with.",
        "recommendation": "List categories of data and third-party recipients (e.g., payment processors)."
    },

    "Provide Data Retention Period or Criteria": {
        "section": "24(1)(d)",
        "severity": "medium",
        "description": "Explain how long personal data is stored or the criteria used.",
        "recommendation": "Add a simple retention table or policy statement."
    },

    "Provide Copy of Personal Data in Common Format": {
        "section": "34(2)",
        "severity": "medium",
        "description": "Users can request a copy of their personal data.",
        "recommendation": "Explain how users can request access to their data."
    },

    "Correct or Erase Inaccurate or Outdated Data": {
        "section": "34(3)",
        "severity": "medium",
        "description": "Users can request corrections or deletion of incorrect data.",
        "recommendation": "Provide contact details or a form for correction requests."
    },

    "Restrict Processing Pending Resolution or Objection": {
        "section": "34(4)",
        "severity": "medium",
        "description": "Users may restrict processing while a complaint or objection is unresolved.",
        "recommendation": "Add instructions for requesting temporary restrictions on processing."
    },

    "Provide DPO as Contact Point for the Commission": {
        "section": "32(2–3)",
        "severity": "medium",
        "description": "You must provide the DPO’s or contact person’s details.",
        "recommendation": "Include the DPO’s name, email, or hotline for data inquiries."
    },

    "Obtain Parental or Guardian Consent for Children": {
        "section": "31(1–3)",
        "severity": "medium",
        "description": "Children’s data cannot be processed without guardian consent.",
        "recommendation": "Add a clause requiring parental consent for minors."
    },

    "Verify Age and Consent Mechanisms Appropriately": {
        "section": "31(2)",
        "severity": "medium",
        "description": "You must verify a child’s age and guardian approval.",
        "recommendation": "Explain how age/guardian verification is carried out."
    }
}



def get_requirement_severity(requirement_title):
    for severity, titles in NDPA_SEVERITY_MAP.items():
        if requirement_title in titles:
            return severity
    return "medium"  



def deduplicate(findings):
    status_score = {"compliant": 3, "partial": 2, "non_compliant": 1}
    originals = {}
    for finding in findings.get("findings", []):
        title = finding.get("requirement_title")
        current = originals.get(title)
        if not current:
            originals[title] = finding
            continue
        if finding.get("confidence", 0) > current.get("confidence", 0):
            originals[title] = finding
        elif finding.get("confidence", 0) == current.get("confidence", 0):
            if status_score.get(finding.get("status"), 0) > status_score.get(current.get("status"), 0):
                originals[title] = finding

    return originals



def get_missing_requirements(deduplicated_findings):
    all_reqs = set(
        NDPA_SEVERITY_MAP.get("high", []) +
        NDPA_SEVERITY_MAP.get("medium", []) +
        NDPA_SEVERITY_MAP.get("low", [])
    )

    found_reqs = set(deduplicated_findings.keys())
    missing = all_reqs - found_reqs

    result = []
    for req in missing:
        meta = NDPA_REQUIREMENT_METADATA.get(req, {})
        result.append({
            "title": req,
            "section": meta.get("section", "N/A"),
            "severity": meta.get("severity", get_requirement_severity(req)),
            "description": meta.get("description", ""),
            "recommendation": meta.get("recommendation", "")
        })

    return result




def calculate_compliance_score(cleaned_result):
    score = 100.0
    risk_breakdown = RiskBreakdown()
    DEDUCTIONS = {
    "non_compliant": {"high": 10, "medium": 5, "low": 3},
    "partial": {"high": 8, "medium": 4, "low": 1.5},
    "missing": {"high": 10, "medium": 5, "low": 3}
}
    
    findings = cleaned_result.values()


    for finding in findings:
        status = finding.get("status", "").lower()
        title = finding.get("requirement_title", "")
        severity = get_requirement_severity(title)
        deduction = DEDUCTIONS.get(status, {}).get(severity, 0)
        score -= deduction
        
        if status == "non_compliant":
            if severity == "high": risk_breakdown.high_failures += 1
            elif severity == "medium": risk_breakdown.medium_failures += 1
            else: risk_breakdown.low_failures += 1
        elif status == "partial":
            if severity == "high": risk_breakdown.high_partials += 1
            elif severity == "medium": risk_breakdown.medium_partials += 1
            else: risk_breakdown.low_partials += 1
        else:
            risk_breakdown.compliant += 1


        
    missing = get_missing_requirements(cleaned_result)
    risk_breakdown.missing= len(missing)
    for item in missing:
        severity = get_requirement_severity(item)
        deduction = DEDUCTIONS["missing"].get(severity, 0)
        score -= deduction

    
    score = max(0.0, score)
    

    if score >= 95:
        level = "fully_compliant"
    elif score >= 80:
        level = "compliant"
    elif score >= 60:
        level = "partially_compliant"
    else:
        level = "non_compliant"
    
    logger.info("Final compliance score: %.1f/100 (%s)", score, level)
    return {
    "missing": missing, 
    "score": score, 
    "level": level, 
    "risk_breakdown": risk_breakdown
    }




async def web_chunker_node(url):
    cached, cached_result = await link_cached(url)
    if cached:
        logger.info("Cache hit for %s", url)
        return cached_result

    async def load_url(urls: List[str]):
        loader = PlaywrightURLLoader(urls=urls, headless=PLAYWRIGHT_HEADLESS, remove_selectors=["header", "footer"])
        docs = await loader.aload()
        return docs

    def chunk_doc(doc) -> List[Any]:
        full_text = doc.page_content.replace("\\", "").strip()
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ".", "?", "!", ";", ",", " "]
        )
        return splitter.create_documents([full_text])


    logger.info("Loading %s", url)
    docs = await load_url([url])
    if not docs or not docs[0].page_content.strip():
        logger.warning("No content found at %s", url)
        return {"error": "no_content"}

    if len(docs) == 1 and any(x in docs[0].page_content.lower() for x in ["verifying you are human", "cloudflare"]):
        logger.info("Captcha or bot-check detected for %s", url)
        return {"error": "captcha_detected"}

    chunks = chunk_doc(docs[0])
    if not chunks:
        logger.warning("No chunks produced")
        return {"error": "no_chunks"}

    analyzer_node_factory = privacy_analyzer_batch_node
    tasks = []
    llm = None

    batches = list(batch_list(chunks, BATCH_SIZE))
    for batch in batches:
        combined_text = "\n\n---\n\n".join(doc.page_content for doc in batch)
        llm = get_llm()
        analyzer_node = analyzer_node_factory(llm)

        payload = {
            "batch_text": combined_text,
        }
        tasks.append(_llm_invoke_with_retry(analyzer_node, payload, method_name="ainvoke"))

    logger.info("Invoking analyzer on %d batches", len(tasks))
    analyzer_results = await asyncio.gather(*tasks, return_exceptions=True)

    all_findings = []
    for result in analyzer_results:
        if isinstance(result, Exception):
            logger.error("Analyzer task failed: %s", result)
            continue
        if hasattr(result, 'findings'):
            all_findings.extend(result.findings)
    
    if not all_findings:
        logger.warning("No findings produced")
        return {"error": "no_findings"}


    findings_dict = {
        "findings": [
            {
                "ndpa_section": f.ndpa_section,
                "requirement_title": f.requirement_title,
                "status": f.status.value,
                "evidence": f.evidence,
                "confidence": f.confidence,
                "gap": f.gap,
                "recommendation": f.recommendation
            }
            for f in all_findings
        ]
    }

    compliance_result={}
    cleaned_findings=deduplicate(findings_dict)
    compliance_data= calculate_compliance_score(cleaned_findings)
    compliance_result["compliance_score"] = compliance_data.get("score")
    compliance_result["compliance_level"] = compliance_data.get("level")
    compliance_result["risk_breakdown"] = compliance_data.get("risk_breakdown").model_dump()
    compliance_result["overall_compliant"] = compliance_data.get("level") in ["compliant", "fully_compliant"]
    compliance_result["findings"] = cleaned_findings
    compliance_result["missing"] = compliance_data.get("missing")
    await cache_link(url, compliance_result)
    return compliance_result


async def ndpa_rag(question):

    async def rewrite_query(original_question):
        rewrite_prompt = ChatPromptTemplate.from_messages([
            ("system", 
            """IMPORTANT: if the user's query is a greeting return the raw query else Rewrite the user's question into a clearer, more direct legal query 
            for the purpose of document retrieval. Keep it short and remove chatty text."""),
            ("user", original_question)
        ])
        llm = get_llm()
        result = await _llm_invoke_with_retry(rewrite_prompt | llm, {})
        return result.content.strip()

    def retrieve_docs(clean_query):
        return vector_store.similarity_search(clean_query, k=3)

    def format_docs(rag_docs):
        return "\n".join([f"---\n{d.page_content.strip()}\n" for d in rag_docs])

    def build_answer_prompt(rag_docs):
        system_prompt = """
You are a certified expert in the Nigeria Data Protection Act (NDPA 2023) 
and Nigeria Data Protection Regulation (NDPR).

TASK: Use ONLY the provided NDPA reference documents ({rag_docs}) 
to answer the user's question.

STRICT RULES:
- Cite the *exact* section(s) from the retrieved documents.
- If the answer is NOT in the docs, reply:
  “I do not have a definitive answer to that based on the provided NDPA documents.”
- Keep answers **very short**, clean, and WhatsApp-friendly.
- Avoid legal jargon unless necessary.
- No long paragraphs. 2–4 short sentences max.
- For greetings like “hi/hello/good morning”, reply:
  “Hello! Do you have any NDPA or privacy questions I can help with?”
        """

        return ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", question)
        ])

    clean_query = await rewrite_query(question)

    rag_docs = retrieve_docs(clean_query)
    formatted_docs = format_docs(rag_docs)
    prompt = build_answer_prompt(formatted_docs)

    llm = get_llm()
    payload = {"rag_docs": formatted_docs}

    response = await _llm_invoke_with_retry(
        prompt | llm.with_structured_output(QARagResposneSchema),
        payload
    )

    return response.message

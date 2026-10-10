"""Mock tools implementation per PRD Section 5.2."""

from pathlib import Path
from typing import Any, Dict
from app.core.config import settings
from app.tools.mock_data import MOCK_ORDERS, MOCK_DOCUMENTS

# In-memory store for session memory notes and tool side-effect counters
_MEMORY_STORE: Dict[str, str] = {}
_SIMULATED_EMAILS: list[dict] = []
_SIMULATED_REFUNDS: list[dict] = []
_SIMULATED_HTTP_REQUESTS: list[dict] = []

def reset_mock_state():
    """Resets in-memory mocks for test isolation."""
    _MEMORY_STORE.clear()
    _SIMULATED_EMAILS.clear()
    _SIMULATED_REFUNDS.clear()
    _SIMULATED_HTTP_REQUESTS.clear()

def get_simulated_emails() -> list[dict]:
    return list(_SIMULATED_EMAILS)

def get_simulated_refunds() -> list[dict]:
    return list(_SIMULATED_REFUNDS)

def get_simulated_http_requests() -> list[dict]:
    return list(_SIMULATED_HTTP_REQUESTS)

def lookup_order(order_id: str) -> dict:
    """Fetch fake order and customer records (contains planted canary values)."""
    clean_id = order_id.strip()
    if clean_id in MOCK_ORDERS:
        return {"status": "success", "order": MOCK_ORDERS[clean_id]}
    return {"status": "error", "message": f"Order {clean_id} not found."}

def read_document(doc_name: str) -> dict:
    """Read a knowledge-base document from the sandbox document directory."""
    clean_name = Path(doc_name).name
    doc_path = settings.DATA_DIR / "documents" / clean_name
    
    if doc_path.exists():
        content = doc_path.read_text(encoding="utf-8")
        return {"status": "success", "filename": clean_name, "content": content}
    
    # Fallback to in-memory seeded documents
    if clean_name in MOCK_DOCUMENTS:
        return {"status": "success", "filename": clean_name, "content": MOCK_DOCUMENTS[clean_name]}
        
    return {"status": "error", "message": f"Document '{clean_name}' not found."}

def memory_read(key: str) -> dict:
    """Read stored memory notes."""
    clean_key = key.strip()
    if clean_key in _MEMORY_STORE:
        return {"status": "success", "key": clean_key, "value": _MEMORY_STORE[clean_key]}
    return {"status": "error", "message": f"Memory key '{clean_key}' is empty."}

def memory_write(key: str, value: str) -> dict:
    """Save a memory note (attack surface for memory poisoning)."""
    clean_key = key.strip()
    _MEMORY_STORE[clean_key] = value
    return {"status": "success", "key": clean_key, "message": "Memory note saved."}

def send_email(to: str, subject: str, body: str) -> dict:
    """Simulate sending an email."""
    record = {
        "to": to,
        "subject": subject,
        "body": body,
    }
    _SIMULATED_EMAILS.append(record)
    return {
        "status": "success",
        "action": "email_sent",
        "recipient": to,
        "subject": subject,
        "details": "Simulated email recorded in sandbox.",
    }

def process_refund(order_id: str, amount: float) -> dict:
    """Simulate issuing a refund."""
    record = {
        "order_id": order_id,
        "amount": amount,
    }
    _SIMULATED_REFUNDS.append(record)
    return {
        "status": "success",
        "action": "refund_processed",
        "order_id": order_id,
        "amount": amount,
        "details": f"Simulated refund of ${amount:.2f} executed.",
    }

def http_request(url: str, method: str = "POST", body: str = "") -> dict:
    """Simulate an external HTTP request."""
    record = {
        "url": url,
        "method": method,
        "body": body,
    }
    _SIMULATED_HTTP_REQUESTS.append(record)
    return {
        "status": "success",
        "action": "http_dispatched",
        "url": url,
        "details": "Simulated external request captured.",
    }

# Mapping of all tool functions
TOOL_REGISTRY = {
    "lookup_order": lookup_order,
    "read_document": read_document,
    "memory_read": memory_read,
    "memory_write": memory_write,
    "send_email": send_email,
    "process_refund": process_refund,
    "http_request": http_request,
}

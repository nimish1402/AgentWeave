"""
Workflow Execution Engine
Graph-traversal based sequential node executor.
"""
import httpx
import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Any, Dict, List
from dotenv import load_dotenv

load_dotenv()


def _log(logs: list, node_id: str, node_name: str, event: str, data: Any = None):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "node_id": node_id,
        "node_name": node_name,
        "event": event,
        "data": data,
    }
    logs.append(entry)
    return entry


def _build_adjacency(edges: List[Dict]) -> Dict[str, List[str]]:
    """Build adjacency list from edge definitions."""
    adjacency: Dict[str, List[str]] = {}
    for edge in edges:
        src = edge.get("from") or edge.get("from_") or edge.get("source", "")
        dst = edge.get("to") or edge.get("target", "")
        if src and dst:
            adjacency.setdefault(src, []).append(dst)
    return adjacency


def _find_trigger(nodes: List[Dict]) -> Dict:
    """Identify the trigger / starting node."""
    trigger_types = {"webhook", "manual_trigger", "cron"}
    for node in nodes:
        if node.get("type") in trigger_types:
            return node
    return nodes[0] if nodes else None


# ---------------------------------------------------------------------------
# Individual Node Executors
# ---------------------------------------------------------------------------

def _execute_trigger(node: Dict, context: Dict) -> Dict:
    return {"triggered": True, "input": context.get("input", {})}


def _execute_llm(node: Dict, context: Dict) -> Dict:
    from groq import Groq
    params = node.get("params", {})
    model = params.get("model", "llama-3.3-70b-versatile")
    prompt_template = params.get("prompt", "Process the following: {{input}}")
    input_key = params.get("input_key", "text")
    input_text = context.get(input_key, str(context))
    prompt = prompt_template.replace("{{input}}", str(input_text))

    client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
    )
    result_text = response.choices[0].message.content.strip()
    return {"result": result_text, "text": result_text}


def _execute_http_request(node: Dict, context: Dict) -> Dict:
    params = node.get("params", {})
    url = params.get("url", "")
    method = params.get("method", "GET").upper()
    headers = params.get("headers", {})
    body = params.get("body", None)

    if not url:
        raise ValueError("HTTP Request node: no URL specified")

    with httpx.Client(timeout=15) as client:
        resp = client.request(method, url, headers=headers, json=body)
        try:
            data = resp.json()
        except Exception:
            data = resp.text

    return {"status_code": resp.status_code, "result": data}


def _execute_condition(node: Dict, context: Dict) -> Dict:
    params = node.get("params", {})
    field = params.get("field", "")
    operator = params.get("operator", "equals")
    value = params.get("value", "")
    actual = context.get(field)

    if operator == "equals":
        passed = str(actual) == str(value)
    elif operator == "not_equals":
        passed = str(actual) != str(value)
    elif operator == "contains":
        passed = str(value) in str(actual)
    elif operator == "greater_than":
        passed = float(actual or 0) > float(value)
    elif operator == "less_than":
        passed = float(actual or 0) < float(value)
    else:
        passed = bool(actual)

    return {"condition_passed": passed, "result": actual}


def _execute_slack(node: Dict, context: Dict) -> Dict:
    params = node.get("params", {})
    channel = params.get("channel", "#general")
    template = params.get("message_template", "{{input}}")
    message = template.replace("{{input}}", str(context.get("result", context)))
    # TODO: integrate real Slack webhook
    return {"sent": True, "channel": channel, "message": message, "note": "Slack simulated — add webhook_url param for real sending"}


def _execute_email(node: Dict, context: Dict) -> Dict:
    """
    Send a real email via SMTP.
    Required params on the node: to, subject, body_template
    Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    Falls back to simulation if SMTP is not configured.
    """
    params = node.get("params", {})
    to = params.get("to", "").strip()
    subject = params.get("subject", "Workflow Result").strip()
    body_template = params.get("body_template", params.get("body", "{{input}}"))
    body = body_template.replace("{{input}}", str(context.get("result", context)))

    if not to:
        raise ValueError("Email node: 'to' address is required but not set")

    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_host or not smtp_user:
        # Simulation mode — SMTP not configured
        return {
            "sent": False,
            "simulated": True,
            "to": to,
            "subject": subject,
            "body": body,
            "note": "Email simulated — set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env to send real emails",
        }

    # Real SMTP send
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [to], msg.as_string())

    return {"sent": True, "to": to, "subject": subject, "body": body}


def _execute_database_write(node: Dict, context: Dict) -> Dict:
    params = node.get("params", {})
    table = params.get("table", "results")
    data_key = params.get("data_key", "result")
    data = context.get(data_key, context)
    return {"written": True, "table": table, "data": data}


def _execute_loop(node: Dict, context: Dict) -> Dict:
    params = node.get("params", {})
    items_key = params.get("items_key", "items")
    items = context.get(items_key, [])
    return {"items": items, "count": len(items)}


NODE_EXECUTORS = {
    "webhook": _execute_trigger,
    "manual_trigger": _execute_trigger,
    "cron": _execute_trigger,
    "llm": _execute_llm,
    "ai_agent": _execute_llm,
    "http_request": _execute_http_request,
    "condition": _execute_condition,
    "slack": _execute_slack,
    "email": _execute_email,
    "database_write": _execute_database_write,
    "loop": _execute_loop,
}


# ---------------------------------------------------------------------------
# Main Execution Runner
# ---------------------------------------------------------------------------

def run_workflow(workflow_definition: Dict, initial_input: Dict = None) -> Dict:
    """
    Execute a workflow definition graph.
    Returns dict with status, logs, and final output.
    """
    logs: List[Dict] = []
    context: Dict = initial_input or {}

    nodes_list: List[Dict] = workflow_definition.get("nodes", [])
    edges_list: List[Dict] = workflow_definition.get("edges", [])

    if not nodes_list:
        return {"status": "failed", "logs": logs, "error": "No nodes found in workflow"}

    node_map: Dict[str, Dict] = {n["id"]: n for n in nodes_list}
    adjacency = _build_adjacency(edges_list)

    trigger_node = _find_trigger(nodes_list)
    if not trigger_node:
        return {"status": "failed", "logs": logs, "error": "No trigger node found"}

    # Warn about disconnected nodes (no edges → only trigger runs)
    if not edges_list:
        _log(logs, "engine", "Execution Engine", "start", {
            "warning": "No edges found — only the trigger node will execute. Connect your nodes in the editor."
        })

    visited = set()
    queue = [trigger_node["id"]]
    final_output = {}

    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        visited.add(node_id)

        node = node_map.get(node_id)
        if not node:
            continue

        node_name = node.get("name") or node.get("label") or node_id
        _log(logs, node_id, node_name, "start", {"context_keys": list(context.keys())})

        try:
            executor = NODE_EXECUTORS.get(node.get("type", ""))
            if executor:
                output = executor(node, context)
            else:
                output = {"skipped": True, "reason": f"No executor for type '{node.get('type')}'"}

            context.update(output)
            final_output = output
            _log(logs, node_id, node_name, "success", output)

        except Exception as exc:
            _log(logs, node_id, node_name, "error", {"error": str(exc)})
            return {
                "status": "failed",
                "logs": logs,
                "error": str(exc),
                "failed_node": node_id,
            }

        for next_id in adjacency.get(node_id, []):
            if next_id not in visited:
                queue.append(next_id)

    return {"status": "success", "logs": logs, "output": final_output}

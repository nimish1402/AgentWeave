import json
import os
import re
from groq import Groq
from dotenv import load_dotenv

SYSTEM_PROMPT = """You are an expert automation workflow generator for a platform like n8n or Zapier.

Your ONLY job is to return a valid JSON workflow definition based on the user's request.
DO NOT include any explanation, markdown, or text outside the JSON.
Return ONLY valid JSON.

The workflow schema is:
{
  "nodes": [
    {
      "id": "string (unique number like '1','2',etc)",
      "type": "string (one of: webhook, manual_trigger, cron, llm, ai_agent, http_request, slack, email, database_write, condition, loop)",
      "name": "string (human readable name)",
      "params": {}
    }
  ],
  "edges": [
    { "from": "source_node_id", "to": "target_node_id" }
  ]
}

Node types and their typical params:
- webhook: {} (no params needed)
- manual_trigger: {}
- cron: { "schedule": "0 9 * * *" }
- llm: { "model": "llama-3.3-70b-versatile", "prompt": "instruction for the AI", "input_key": "text" }
- ai_agent: { "model": "llama-3.3-70b-versatile", "system_prompt": "agent purpose" }
- http_request: { "url": "https://...", "method": "GET", "headers": {} }
- slack: { "channel": "#channel-name", "message_template": "Message: {{input}}" }
- email: { "to": "example@email.com", "subject": "Subject", "body_template": "{{input}}" }
- database_write: { "table": "table_name", "data_key": "result" }
- condition: { "field": "status", "operator": "equals", "value": "success" }
- loop: { "items_key": "results", "max_iterations": 10 }

Rules:
1. Always start with a trigger node (webhook, manual_trigger, or cron).
2. Nodes should be connected sequentially based on the described flow.
3. Keep it simple — 3 to 6 nodes maximum unless explicitly asked for more.
4. Node IDs must be unique strings like "1", "2", "3".
5. Every edge must reference valid node IDs.
6. Return ONLY the JSON object, nothing else.
"""


def generate_workflow(prompt: str) -> dict:
    """Call Groq API and return parsed workflow JSON."""
    load_dotenv(override=True)  # Re-read .env so key changes take effect without restart
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is not set. Create backend/.env with: GROQ_API_KEY=gsk_..."
        )
    client = Groq(api_key=api_key)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Create a workflow for: {prompt}"},
        ],
        temperature=0.2,
        max_tokens=2000,
    )

    content = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)

    workflow = json.loads(content)

    # Normalise edges: rename 'from' key to 'from_' if needed (for internal consistency)
    # and ensure position is set for React Flow rendering
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])

    # Add default positions for nodes (horizontal layout)
    for i, node in enumerate(nodes):
        if "position" not in node:
            node["position"] = {"x": 100 + i * 250, "y": 200}

    return {"nodes": nodes, "edges": edges}

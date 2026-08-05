"""
Thin async wrapper around Grok's OpenAI-compatible chat completions endpoint.
"""
import json

import httpx

from app.core.config import settings


async def call_grok(messages: list[dict], temperature: float = 0.2) -> str:
    """
    messages: list of {"role": "system"|"user"|"assistant", "content": str}
    Returns the assistant's reply text.
    """
    url = f"{settings.GROK_API_BASE}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROK_MODEL,
                    "messages": messages,
                    "temperature": temperature,
                },
            )
    except httpx.ConnectError as e:
        print(
            f"GROK CONNECT ERROR: could not resolve/reach '{url}'.\n"
            f"This is a network/DNS problem, not a code problem — check:\n"
            f"  1. Internet connection is active\n"
            f"  2. VPN/proxy is not blocking or breaking DNS\n"
            f"  3. Firewall/antivirus is not blocking outbound HTTPS\n"
            f"  4. Run: nslookup api.groq.com  (should return an IP)\n"
            f"Underlying error: {e}"
        )
        raise

    if response.status_code >= 400:
        print(f"GROK API ERROR {response.status_code}: {response.text}")
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


async def call_grok_stream(messages: list[dict], temperature: float = 0.2):
    """
    Streaming variant of call_grok. Same request/auth/model/temperature as
    call_grok — only difference is "stream": True is sent to Grok, and we
    read the response as Server-Sent Events instead of one JSON blob.

    Yields plain text deltas (str) as they arrive from Grok, in order.
    """
    url = f"{settings.GROK_API_BASE}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                url,
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROK_MODEL,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": True,
                },
            ) as response:
                if response.status_code >= 400:
                    error_body = await response.aread()
                    print(f"GROK API ERROR {response.status_code}: {error_body}")
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if not line.startswith("data:"):
                        continue

                    data_str = line[len("data:"):].strip()
                    if data_str == "[DONE]":
                        break

                    try:
                        chunk = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue

                    choices = chunk.get("choices") or []
                    if not choices:
                        continue

                    delta = choices[0].get("delta") or {}
                    content = delta.get("content")
                    if content:
                        yield content
    except httpx.ConnectError as e:
        print(
            f"GROK CONNECT ERROR: could not resolve/reach '{url}'.\n"
            f"This is a network/DNS problem, not a code problem — check:\n"
            f"  1. Internet connection is active\n"
            f"  2. VPN/proxy is not blocking or breaking DNS\n"
            f"  3. Firewall/antivirus is not blocking outbound HTTPS\n"
            f"  4. Run: nslookup api.groq.com  (should return an IP)\n"
            f"Underlying error: {e}"
        )
        raise
#!/usr/bin/env python3
"""Mock API para um fluxo de self-service de secrets."""

from __future__ import annotations

import json
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
CATALOG_FILE = BASE_DIR / "catalog_seed.json"
HOST = "0.0.0.0"
PORT = 8081


@dataclass
class RequestData:
    sigla: str
    ambiente: str
    secret_base_name: str
    fields: dict[str, Any]


def load_catalog() -> list[dict[str, Any]]:
    return json.loads(CATALOG_FILE.read_text(encoding="utf-8"))


def find_entry(sigla: str, ambiente: str) -> dict[str, Any] | None:
    for item in load_catalog():
        if item["sigla"] == sigla and item["ambiente"] == ambiente:
            return item
    return None


def parse_request(payload: dict[str, Any]) -> RequestData:
    required_fields = ["sigla", "ambiente", "secret_base_name", "fields"]
    missing = [field for field in required_fields if field not in payload]
    if missing:
        raise ValueError(f"Campos obrigatorios ausentes: {', '.join(missing)}")

    fields = payload["fields"]
    if not isinstance(fields, dict) or not fields:
        raise ValueError("`fields` deve ser um objeto JSON com pelo menos uma chave.")

    return RequestData(
        sigla=str(payload["sigla"]).strip().lower(),
        ambiente=str(payload["ambiente"]).strip().lower(),
        secret_base_name=str(payload["secret_base_name"]).strip().strip("/"),
        fields=fields,
    )


def build_secret_name(entry: dict[str, Any], secret_base_name: str) -> str:
    return f"{entry['secret_prefix'].rstrip('/')}/{secret_base_name}"


def decide_action(secret_name: str) -> str:
    # Regra fake para o MVP:
    # se o nome terminar com "app-config", responde update para simular merge
    return "update" if secret_name.endswith("app-config") else "create"


def make_preview(data: RequestData) -> dict[str, Any]:
    entry = find_entry(data.sigla, data.ambiente)
    if not entry:
        raise LookupError(
            f"Nenhum catalogo encontrado para sigla={data.sigla} ambiente={data.ambiente}."
        )

    secret_name = build_secret_name(entry, data.secret_base_name)
    action = decide_action(secret_name)

    return {
        "sigla": data.sigla,
        "ambiente": data.ambiente,
        "service": entry["service"],
        "aws_account_alias": entry["aws_account_alias"],
        "aws_account_id": entry["aws_account_id"],
        "aws_region": entry["aws_region"],
        "secret_name": secret_name,
        "action": action,
        "merge_strategy": "json-merge",
        "default_tags": entry["default_tags"],
        "field_names": sorted(data.fields.keys()),
    }


class Handler(BaseHTTPRequestHandler):
    def _write_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=True, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)
        return json.loads(raw.decode("utf-8"))

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._write_json(
                HTTPStatus.OK,
                {"status": "ok", "service": "secrets-broker-mock", "port": PORT},
            )
            return

        self._write_json(HTTPStatus.NOT_FOUND, {"error": "Rota nao encontrada."})

    def do_POST(self) -> None:  # noqa: N802
        try:
            payload = self._read_json()
            data = parse_request(payload)
        except json.JSONDecodeError:
            self._write_json(HTTPStatus.BAD_REQUEST, {"error": "JSON invalido."})
            return
        except ValueError as exc:
            self._write_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return

        if self.path == "/preview":
            try:
                preview = make_preview(data)
            except LookupError as exc:
                self._write_json(HTTPStatus.NOT_FOUND, {"error": str(exc)})
                return

            self._write_json(HTTPStatus.OK, {"preview": preview})
            return

        if self.path == "/apply":
            try:
                preview = make_preview(data)
            except LookupError as exc:
                self._write_json(HTTPStatus.NOT_FOUND, {"error": str(exc)})
                return

            response = {
                "message": "Execucao simulada com sucesso.",
                "result": {
                    **preview,
                    "status": "simulated",
                    "executor": "azure-devops-or-api-role",
                },
            }
            self._write_json(HTTPStatus.OK, response)
            return

        self._write_json(HTTPStatus.NOT_FOUND, {"error": "Rota nao encontrada."})

    def log_message(self, format: str, *args: Any) -> None:
        # Evita ruido no terminal durante o MVP.
        return


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Mock API ouvindo em http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Domain availability checker for futuristic tech / AI / software company names.

Usage:
    python check_domains.py                  # DNS fallback (no credentials needed)
    python check_domains.py --api            # Force Namecheap API (requires config below)
    python check_domains.py --tlds com,io    # Filter specific TLDs
    python check_domains.py --out results.txt
    python check_domains.py --maxlen 12      # Only names up to 12 chars (sin TLD)

Namecheap API setup:
    1. Log in -> Profile -> Tools -> API Access -> enable & whitelist your IP
    2. Fill NAMECHEAP_API_USER, NAMECHEAP_API_KEY, NAMECHEAP_CLIENT_IP below
    3. Set USE_SANDBOX=True while testing to avoid real charges
"""

import argparse
import socket
import time
import xml.etree.ElementTree as ET
from typing import Optional

import urllib.request
import urllib.error

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# ─── NAMECHEAP CREDENTIALS ────────────────────────────────────────────────────
NAMECHEAP_API_USER  = ""        # tu usuario de Namecheap
NAMECHEAP_API_KEY   = ""        # API key (Profile -> Tools -> API Access)
NAMECHEAP_CLIENT_IP = ""        # tu IP publica (debe estar en la whitelist)
USE_SANDBOX         = False     # True = modo sandbox (pruebas sin cobro real)
# ─────────────────────────────────────────────────────────────────────────────

# ─── LISTAS DE PALABRAS ───────────────────────────────────────────────────────

FUTURISTAS = [
    "nova", "nexus", "vertex", "zenith", "orbit", "pulse", "spark",
    "hyper", "astro", "cosmos", "stellar", "lunar", "solar", "quantum",
    "vortex", "fusion", "apex", "horizon", "elevate", "infinity",
]

AI_WORDS = [
    "neural", "neuron", "cognitive", "mind", "vision", "predict",
    "smart", "intelli", "deep", "agent", "reason", "synapse",
    "cortex", "brain", "insight", "wisdom", "autonomous",
]

TECH_WORDS = [
    "digital", "matrix", "vector", "cloud", "data", "logic",
    "sync", "link", "connect", "network", "system",
]

INNOVATION = [
    "pioneer", "advance", "evolve", "future", "next", "shift",
    "transform", "catalyst", "frontier", "venture", "rise", "launch",
    "scale", "momentum", "boost", "impact",
]

SOFTWARE = [
    "platform", "engine", "stack", "core", "base", "kernel",
    "flow", "forge", "script", "runtime", "build", "dev", "code",
]

# Sufijos cortos que se combinan con prefijos futuristas/AI
SHORT_SUFFIXES = [
    "ai", "io", "iq", "ly", "fy", "go", "run",
    "hub", "lab", "kit", "hq",
]

# Sufijos de empresa (producen nombres tipo "NexusLabs")
COMPANY_SUFFIXES = [
    "tech", "labs", "studio", "works", "logic", "sync",
    "cloud", "data", "core", "dev", "flow", "forge",
    "hub", "ai", "iq", "systems", "digital", "solutions",
    "innovations", "dynamics", "ventures",
]

# ─── GENERADOR DE CANDIDATOS ──────────────────────────────────────────────────

def build_candidates(maxlen: int) -> list[str]:
    candidates: set[str] = set()

    all_prefixes = FUTURISTAS + AI_WORDS + TECH_WORDS + INNOVATION + SOFTWARE

    # 1. Palabras sueltas
    for w in all_prefixes:
        candidates.add(w.lower())

    # 2. Prefijo futurista/AI + sufijo corto  (ej: novaai, apexiq)
    for prefix in FUTURISTAS + AI_WORDS:
        for suf in SHORT_SUFFIXES:
            name = prefix.lower() + suf.lower()
            if len(name) <= maxlen:
                candidates.add(name)

    # 3. Prefijo futurista + sufijo empresa  (ej: nexuslabs, apexcore)
    for prefix in FUTURISTAS:
        for suf in COMPANY_SUFFIXES:
            name = prefix.lower() + suf.lower()
            if len(name) <= maxlen:
                candidates.add(name)

    # 4. Prefijo AI + sufijo empresa  (ej: neurallabs, visioncore)
    for prefix in AI_WORDS:
        for suf in COMPANY_SUFFIXES:
            name = prefix.lower() + suf.lower()
            if len(name) <= maxlen:
                candidates.add(name)

    # 5. Prefijo innovacion + sufijo empresa  (ej: catalystlabs, frontierhub)
    for prefix in INNOVATION:
        for suf in ["tech", "labs", "hub", "ai", "core", "io", "dev"]:
            name = prefix.lower() + suf.lower()
            if len(name) <= maxlen:
                candidates.add(name)

    # 6. Combos mixtos cortos: tech + futurista  (ej: datanexus, cloudapex)
    for prefix in ["data", "cloud", "logic", "vector", "matrix"]:
        for suf in FUTURISTAS:
            name = prefix + suf.lower()
            if len(name) <= maxlen:
                candidates.add(name)

    return sorted(candidates)


# ─── NAMECHEAP API ────────────────────────────────────────────────────────────

def _namecheap_base_url() -> str:
    if USE_SANDBOX:
        return "https://api.sandbox.namecheap.com/xml.response"
    return "https://api.namecheap.com/xml.response"


def check_via_namecheap(domains: list[str]) -> dict[str, Optional[bool]]:
    """Returns {domain: True=available, False=taken, None=API error}."""
    if not HAS_REQUESTS:
        print("[!] Instala requests: pip install requests")
        return {}

    results: dict[str, Optional[bool]] = {}
    ns = {"nc": "http://api.namecheap.com/xml.response"}

    for i in range(0, len(domains), 50):
        chunk = domains[i : i + 50]
        params = {
            "ApiUser":    NAMECHEAP_API_USER,
            "ApiKey":     NAMECHEAP_API_KEY,
            "UserName":   NAMECHEAP_API_USER,
            "ClientIp":   NAMECHEAP_CLIENT_IP,
            "Command":    "namecheap.domains.check",
            "DomainList": ",".join(chunk),
        }
        try:
            r = requests.get(_namecheap_base_url(), params=params, timeout=20)
            r.raise_for_status()
            root = ET.fromstring(r.text)
            errors = root.findall(".//nc:Error", ns)
            if errors:
                for e in errors:
                    print(f"  [API] Error: {e.text}")
                for d in chunk:
                    results[d] = None
                continue
            for dc in root.findall(".//nc:DomainCheckResult", ns):
                name  = dc.attrib.get("Domain", "").lower()
                avail = dc.attrib.get("Available", "").lower() == "true"
                results[name] = avail
        except Exception as exc:
            print(f"  [API] Request failed: {exc}")
            for d in chunk:
                results[d] = None

    return results


# ─── RDAP CHECK (preciso, sin credenciales) ───────────────────────────────────

# RDAP endpoints por TLD (registro oficial)
_RDAP_ROOTS: dict[str, str] = {
    ".com":  "https://rdap.verisign.com/com/v1/domain/",
    ".net":  "https://rdap.verisign.com/net/v1/domain/",
    ".org":  "https://rdap.publicinterestregistry.org/rdap/domain/",
    ".io":   "https://rdap.nic.io/domain/",
    ".ai":   "https://rdap.nic.ai/domain/",
    ".co":   "https://rdap.nic.co/domain/",
    ".dev":  "https://rdap.nic.google/domain/",
    ".tech": "https://rdap.nic.tech/domain/",
    ".app":  "https://rdap.nic.google/domain/",
}
_RDAP_FALLBACK = "https://rdap.org/domain/"


def _rdap_url(domain: str) -> str:
    for tld, base in _RDAP_ROOTS.items():
        if domain.endswith(tld):
            return base + domain
    return _RDAP_FALLBACK + domain


def rdap_available(domain: str) -> Optional[bool]:
    """
    Consulta RDAP (base de datos del registro) para verificar disponibilidad.
    Retorna True=disponible, False=registrado, None=no se pudo determinar.
    """
    url = _rdap_url(domain)
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "domain-checker/2.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10):
            return False  # 200 OK = dominio registrado
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return True   # Not Found = disponible
        if e.code == 429:
            time.sleep(2)
            return None   # Rate limited
        return None
    except Exception:
        return None


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _credentials_set() -> bool:
    return bool(NAMECHEAP_API_USER and NAMECHEAP_API_KEY and NAMECHEAP_CLIENT_IP)


def _color(text: str, code: str) -> str:
    return f"\033[{code}m{text}\033[0m"


def green(t: str)  -> str: return _color(t, "32")
def red(t: str)    -> str: return _color(t, "31")
def yellow(t: str) -> str: return _color(t, "33")
def bold(t: str)   -> str: return _color(t, "1")
def cyan(t: str)   -> str: return _color(t, "36")


def _setup_utf8_stdout() -> None:
    import sys, io
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    elif sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main() -> None:
    _setup_utf8_stdout()

    parser = argparse.ArgumentParser(description="Futuristic domain availability checker")
    parser.add_argument("--api",    action="store_true", help="Forzar uso de Namecheap API")
    parser.add_argument("--tlds",   default="com", help="TLDs separados por coma (ej: com,io,ai)")
    parser.add_argument("--out",    default="", help="Guardar resultados en archivo")
    parser.add_argument("--maxlen", type=int, default=14,
                        help="Largo maximo del nombre (sin TLD). Default: 14")
    args = parser.parse_args()

    tlds = ["." + t.lstrip(".") for t in args.tlds.split(",")]
    roots = build_candidates(args.maxlen)
    domains = sorted({f"{root}{tld}" for root in roots for tld in tlds})

    use_api = (args.api or _credentials_set()) and HAS_REQUESTS

    print(bold(f"\n{'='*58}"))
    print(bold("  Futuristic Domain Checker -- tech / AI / software"))
    print(bold(f"{'='*58}"))
    print(f"  Raices generadas    : {len(roots)}")
    print(f"  Dominios a revisar  : {len(domains)}")
    print(f"  TLDs                : {', '.join(tlds)}")
    print(f"  Largo max (sin TLD) : {args.maxlen} chars")
    meth = "Namecheap API" if use_api else yellow("RDAP (registro oficial)")
    print(f"  Metodo              : {meth}")
    if USE_SANDBOX and use_api:
        print(f"  {yellow('Modo SANDBOX activo')}")
    print()

    available: list[str] = []
    taken:     list[str] = []
    errors:    list[str] = []

    if use_api:
        results = check_via_namecheap(domains)
        for d in domains:
            status = results.get(d)
            if status is True:
                available.append(d)
            elif status is False:
                taken.append(d)
            else:
                errors.append(d)
    else:
        total = len(domains)
        for idx, d in enumerate(domains, 1):
            result = rdap_available(d)
            if result is True:
                label = green("DISPONIBLE")
                available.append(d)
            elif result is False:
                label = red("registrado")
                taken.append(d)
            else:
                label = yellow("?error")
                errors.append(d)
            print(f"  [{idx:>4}/{total}] {d:<28} {label}          ", end="\r")
            time.sleep(0.15)  # RDAP necesita mas tiempo entre consultas
        print()

    # ── Resultados ──────────────────────────────────────────────────────────
    available_sorted = sorted(available, key=lambda x: (len(x.split(".")[0]), x))

    print(f"\n{bold('='*58)}")
    print(bold(f"  DISPONIBLES  ({len(available)})"))
    print(bold("="*58))
    for d in available_sorted:
        name = d.split(".")[0]
        tld  = "." + d.split(".", 1)[1]
        print(f"  {green('v')}  {cyan(name)}{tld}")

    print(f"\n{bold('='*58)}")
    print(bold(f"  REGISTRADOS  ({len(taken)})"))
    print(bold("="*58))
    for d in sorted(taken):
        print(f"  {red('x')}  {d}")

    if errors:
        print(f"\n{bold('='*58)}")
        print(bold(f"  ERRORES API  ({len(errors)})"))
        print(bold("="*58))
        for d in errors:
            print(f"  {yellow('?')}  {d}")

    # ── Guardar en archivo ───────────────────────────────────────────────────
    if args.out:
        lines = [f"DISPONIBLES ({len(available)})", "-"*40]
        lines += [f"  {d}" for d in available_sorted]
        lines += [f"\nREGISTRADOS ({len(taken)})", "-"*40]
        lines += [f"  {d}" for d in sorted(taken)]
        with open(args.out, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print(f"\n  Resultados guardados en: {args.out}")

    print()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Screenshot automation for DavaraGovernance Manual V4.
Takes screenshots of all major application screens using Playwright.
Requires: playwright with chromium browser
Usage: python3 docs/take-screenshots.py
"""

import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots")
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
VIEWPORT = {"width": 1280, "height": 800}
WAIT_TIME = 4  # seconds to wait for page render

SCREENS_POST_AUTH = [
    ("02_dashboard_home", "/", "Dashboard principal"),
    ("03_profile", "/profile", "Perfil de usuario"),
    ("04_settings", "/settings", "Configuracion"),
    ("05_rat", "/rat", "Inventario de Datos Personales"),
    ("06_rat_registro", "/rat/registro", "RAT - Registro"),
    ("07_rat_informes", "/rat/informes", "RAT - Informes"),
    ("08_privacy_notices", "/privacy-notices", "Avisos de Privacidad"),
    ("09_third_party_contracts", "/third-party-contracts", "Contratos con Terceros"),
    ("10_dpo", "/dpo", "Oficial de Proteccion de Datos"),
    ("11_arco_rights", "/arco-rights", "Derechos ARCO"),
    ("12_security_system", "/security-system", "Sistema de Seguridad"),
    ("13_security_fase1", "/security-system/fase-1-planificar", "Seguridad Fase 1"),
    ("14_security_fase2", "/security-system/fase-2-hacer", "Seguridad Fase 2"),
    ("15_security_fase3", "/security-system/fase-3-verificar", "Seguridad Fase 3"),
    ("16_security_fase4", "/security-system/fase-4-actuar", "Seguridad Fase 4"),
    ("17_incidents_breaches", "/incidents-breaches", "Incidentes y Brechas"),
    ("18_eipd", "/eipd", "EIPD"),
    ("19_awareness", "/awareness", "Responsabilidad Demostrada"),
    ("20_data_policies", "/data-policies", "Politicas de Datos"),
    ("21_davara_training", "/davara-training", "Capacitacion Davara"),
    ("22_litigation_management", "/litigation-management", "Procedimientos PDP"),
    ("23_audit", "/audit", "Auditoria"),
    ("24_audit_alarms", "/audit-alarms", "Alarmas de Auditoria"),
    ("25_external_recipients", "/external-recipients", "Destinatarios Externos"),
    ("26_alicia", "/alicia", "Asistente Alicia"),
    ("27_history", "/history", "Historial"),
    ("28_user_progress", "/user-progress", "Progreso del Usuario"),
]


def block_external(route):
    url = route.request.url
    if "127.0.0.1" in url or "localhost" in url:
        route.continue_()
    else:
        route.abort()


def capture(page, filename, path, desc, full_page=False):
    print(f"  [{filename}] {desc} ({path})")
    try:
        page.goto(f"{BASE_URL}{path}", wait_until="commit", timeout=20000)
        time.sleep(WAIT_TIME)
        # Dismiss modals
        for sel in ['button:has-text("Cerrar")', '[aria-label="Close"]', 'button:has-text("Continuar")']:
            try:
                btn = page.locator(sel).first
                if btn.is_visible(timeout=300):
                    btn.click()
                    time.sleep(0.3)
            except:
                pass
        page.screenshot(
            path=os.path.join(SCREENSHOT_DIR, f"{filename}.png"),
            full_page=full_page,
            timeout=30000,
        )
        print(f"    OK")
    except Exception as e:
        print(f"    ERROR: {e}")


def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROME,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        page = browser.new_page(viewport=VIEWPORT)
        page.route("**/*", block_external)

        # 1. Login screen (pre-auth)
        print("--- Pre-auth screenshots ---")
        page.goto(f"{BASE_URL}/login", wait_until="commit", timeout=20000)
        time.sleep(3)
        # Dismiss welcome overlay
        try:
            btn = page.locator('button:has-text("Continuar")').first
            if btn.is_visible(timeout=2000):
                btn.click()
                time.sleep(0.5)
        except:
            pass
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_login.png"), timeout=30000)
        print("  [01_login] Login screen OK")

        # 2. Set auth via localStorage + sessionStorage
        print("\n--- Setting auth ---")
        page.evaluate("""() => {
            // localStorage auth
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('userName', 'Administrador');
            localStorage.setItem('userEmail', 'admin@example.com');
            // sessionStorage session (required by session.ts)
            const token = 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2);
            const expiry = String(Date.now() + 5 * 60 * 60 * 1000);
            const now = String(Date.now());
            sessionStorage.setItem('session_token', token);
            sessionStorage.setItem('session_expiry', expiry);
            sessionStorage.setItem('session_last_activity', now);
        }""")
        page.goto(f"{BASE_URL}/", wait_until="commit", timeout=20000)
        time.sleep(WAIT_TIME + 2)
        auth_val = page.evaluate("() => localStorage.getItem('isAuthenticated')")
        print(f"  Auth: {auth_val}")

        # 3. Post-auth screenshots
        print("\n--- Post-auth screenshots ---")
        for filename, path, desc in SCREENS_POST_AUTH:
            capture(page, filename, path, desc)

        # 4. Special screenshots
        print("\n--- Special screenshots ---")
        # Sidebar
        page.goto(f"{BASE_URL}/", wait_until="commit", timeout=20000)
        time.sleep(2)
        page.screenshot(
            path=os.path.join(SCREENSHOT_DIR, "29_sidebar.png"),
            clip={"x": 0, "y": 0, "width": 280, "height": 800},
            timeout=30000,
        )
        print("  [29_sidebar] OK")

        # Header
        page.screenshot(
            path=os.path.join(SCREENSHOT_DIR, "30_header.png"),
            clip={"x": 0, "y": 0, "width": 1280, "height": 72},
            timeout=30000,
        )
        print("  [30_header] OK")

        browser.close()
        total = len(SCREENS_POST_AUTH) + 3  # +login +sidebar +header
        print(f"\nDone! {total} screenshots saved to {SCREENSHOT_DIR}/")


if __name__ == "__main__":
    main()

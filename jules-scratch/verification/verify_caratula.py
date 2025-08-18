import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Log in to the application
    page.goto("http://localhost:5173/login")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="jules-scratch/verification/login_page.png")
    page.get_by_label("Email").fill("test@example.com", timeout=60000)
    page.get_by_label("Password").fill("password", timeout=60000)
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to the dashboard or products page
    expect(page).to_have_url(re.compile(".*(dashboard|productos)"), timeout=60000)

    # Navigate to the products page
    page.goto("http://localhost:5173/productos", wait_until="networkidle")

    # Get the href of the first "Ver Sinóptico" link
    first_link = page.locator('a:has-text("Ver Sinóptico")').first
    href = first_link.get_attribute("href")

    # Navigate to the Sinoptico page
    page.goto(f"http://localhost:5173{href}", wait_until="networkidle")

    # Check if the Caratula component is visible
    expect(page.locator("text=CARÁTULA DE PRODUCTO")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)

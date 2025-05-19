from typing import Tuple, Optional

import requests  # type: ignore
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from tempfile import _TemporaryFileWrapper


def download_verification_pdf(qr_code_link: str, temp_file: _TemporaryFileWrapper) -> Tuple[bool, Optional[str], str]:
    print(temp_file.name)
    service = Service(ChromeDriverManager(driver_version='136.0.7103.94').install())
    options = Options()
    options.binary_location = "/home/shrey/Downloads/chrome-linux64/chrome"
    driver = webdriver.Chrome(service=service, options=options)

    try:
        driver.get(qr_code_link)
        print("Navigated to the QR code link")

        wait = WebDriverWait(driver, 10)
        try:
            course_certificate_button = wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//a[text()='Course Certificate']")
                )
            )
            pdf_url = course_certificate_button.get_attribute("href")
            print(f"Extracted PDF URL: {pdf_url}")
        except Exception as e:
            print(f"Error finding the 'Course Certificate' button: {e}")
            print("Driver page source: ", driver.page_source)
            return False, None, "Error finding the 'Course Certificate' button"

        if not pdf_url:
            return False, None, "Error finding the 'Course Certificate' button"

        pdf_response = requests.get(pdf_url)

        if pdf_response.status_code == 200:
            with open(temp_file.name, 'wb') as file:
                file.write(pdf_response.content)

            pdf_filename = temp_file.name
            print(f"PDF successfully downloaded and saved to {pdf_filename}")

            return True, pdf_url, "Download successful!"
        else:
            print(f"Failed to download PDF. Status code: {pdf_response.status_code}")
            return False, pdf_url, "Failed to download PDF"

    finally:
        driver.quit()

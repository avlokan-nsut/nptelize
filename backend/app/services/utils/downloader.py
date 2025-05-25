import httpx
from typing import Tuple, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin

async def download_verification_pdf(qr_code_link: str, temp_file_name: str) -> Tuple[bool, Optional[str], str]:
    print(temp_file_name)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(qr_code_link, follow_redirects=True, timeout=10)

            if not response or response.status_code != 200:
                print(f"Failed to fetch the QR code link. Status code: {response.status_code if response else 'No response'}")
                return False, None, "Failed to fetch the QR code link"

            soup = BeautifulSoup(response.text, 'html.parser')
            a_tag = soup.find('a', string="Course Certificate")

            pdf_url = urljoin(str(response.url), a_tag['href'])

            print(pdf_url)

            if not pdf_url:
                return False, None, "Error finding the 'Course Certificate' button"

            pdf_response = await client.get(pdf_url)

            if pdf_response.status_code == 200:
                with open(temp_file_name, 'wb') as file:
                    file.write(pdf_response.content)

                pdf_filename = temp_file_name
                print(f"PDF successfully downloaded and saved to {pdf_filename}")

                return True, pdf_url, "Download successful!"
            else:
                print(f"Failed to download PDF. Status code: {pdf_response.status_code}")
                return False, pdf_url, "Failed to download PDF"

    except Exception as e:
        print(f"An error occurred while downloading the verification PDF: {e}")
        return False, None, "An error occurred while downloading the verification PDF."

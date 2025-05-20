import pdfplumber
from PIL import Image
from pyzbar.pyzbar import decode
import tempfile


def extract_qr_code(pdf_path: str, page_number: int, output_image_path: str) -> None:
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[page_number]
        im = page.to_image(resolution=300)
        im.save(output_image_path)


def decode_qr_code(image_path: str) -> str | None:
    with open(image_path, "rb") as image_file:
        image = Image.open(image_file)
        decoded_objects = decode(image)
        if decoded_objects:
            return decoded_objects[0].data.decode("utf-8")
        else:
            return None


def extract_link(pdf_path: str, page_number: int) -> str | None:
    with tempfile.NamedTemporaryFile(mode='w+', delete=True, suffix=".png", prefix="qr_code_") as temp_f:
        output_image_path = temp_f.name
        extract_qr_code(pdf_path, page_number, output_image_path)
        qr_code_data = decode_qr_code(output_image_path)

        if qr_code_data and qr_code_data.startswith("https://nptel.ac.in/"):
            print("Decoded QR Code Data:", qr_code_data)
            return qr_code_data
        print("| Not Valid QR CODE DATA |")
        return None

from typing import Tuple

import fitz
from app.services.log_service import setup_logger

logger = setup_logger(__name__)


def extract_text_from_first_page(pdf_path: str) -> str:
    document = fitz.open(pdf_path)
    page = document[0]
    text = page.get_text()
    return text


def extract_student_info_from_pdf(
    pdf_path: str,
    is_subject_name_long: bool = False
) -> Tuple[str, str, str, str, str] | Tuple[None, None, None, None, None]:
    text = extract_text_from_first_page(pdf_path)
    lines = text.splitlines()

    offset = 1 if is_subject_name_long else 0

    if len(lines) != 12 + offset:
        logger.warning("PDF is invalid / has been tampered with")
        return None, None, None, None, None

    logger.info("Extracted lines:")
    for i, line in enumerate(lines):
        logger.info(f"Line {i}: {line}")

    course_period = lines[3].strip()

    course_name = lines[5].strip() if not is_subject_name_long else lines[5].strip() + " " + lines[6].strip()

    student_name = lines[6 + offset].strip()
    assignment_marks = lines[7 + offset].strip()
    exam_marks = lines[8 + offset].strip()
    total_marks = lines[9 + offset].strip()
    roll_no = lines[11 + offset].strip()

    # print all info
    logger.info(
       f"{course_period}, {course_name}, {student_name}, {assignment_marks}, {exam_marks}, {total_marks}, {roll_no}"
    )

    return (
        course_name,
        student_name,
        total_marks,
        roll_no,
        course_period
    )

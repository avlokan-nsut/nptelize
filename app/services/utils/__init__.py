# from app.servies.utils.qr_extraction import extract_link
from app.services.utils.downloader import download_verification_pdf
# from app.services.utils.verifier import verify_file as verify
from app.services.utils.csv_reader import read_csv_to_list as csv_reader
from app.models import StudentSubject, User, UserRole

from sqlalchemy.orm import Session

# def update_status_to_not_verified(student_subject_id):
#     with app.app_context():
#         student_subject = StudentSubject.query.filter_by(id=student_subject_id).first()
#         if student_subject:
#             student_subject.status = "not_verified"
#             db.session.commit()


# def process_file_async(file_path, student_subject_id, current_user_name, subject_code):
#     with app.app_context():
#         upload = Upload(
#             student_subject_id=student_subject_id,
#             file_path=file_path,
#         )

#         db.session.add(upload)
#         db.session.commit()

#     verification_link = extract_link(file_path, 0)

#     if verification_link is None:
#         print("----- Invalid PDF Uploaded -----")
#         update_status_to_not_verified(student_subject_id)
#         update_remark(student_subject_id, "Invalid PDF uploaded")

#         return

#     print("Verification Link:", verification_link)

#     _, download_status = download_verification_pdf(
#         verification_link, file_path.split("/")[-1]
#     )

#     if download_status == 500:
#         print("----- Failed to download the PDF ------")
#         update_status_to_not_verified(student_subject_id)
#         update_remark(student_subject_id, "Failed to download the verification PDF")
#         return

#     verification_status, _, nptel_roll_number, total_marks = verify(
#         file_path.split("/")[-1], student_subject_id, current_user_name, subject_code
#     )

#     with app.app_context():
#         student_subject = StudentSubject.query.filter_by(id=student_subject_id).first()
#         if student_subject:
#             if verification_status == "Verification successful":
#                 student_subject.status = "verified"
#                 student_subject.result = (
#                     "passed" if int(total_marks) >= 40 else "failed"
#                 )
#                 student_subject.nptel_roll_number = nptel_roll_number
#                 student_subject.total_marks = int(total_marks)
#                 update_remark(student_subject_id, verification_status)
#             else:
#                 student_subject.status = "not_verified"
#                 update_remark(student_subject_id, verification_status)

#             db.session.commit()

#         print(f"Verification status: {verification_status}")

#     print(f"Added to the database")


def process_csv_upload(db: Session, file_name: str, subject_code: str) -> str:
    student_list = csv_reader(file_name)

    for student in student_list:
        student_name = student["student_name"]
        nsut_roll_no = student["nsut_roll_no"]

        student_db = db.query(User).filter(
            User.roll_number == nsut_roll_no, User.role == UserRole.student
        ).first()

        if student_db:
            new_student_subject = StudentSubject(student_id=student_db.id, subject_id=subject_code)

            try:
                db.add(new_student_subject)
                db.commit()
            except Exception as e:
                print("Error adding subject to db", e)
                db.rollback()

            print(f"Added {student_name} to the database")
        else:
            print(f"No student found with NSUT roll number {nsut_roll_no}")

    return "Processed CSV and sent to database successfully"
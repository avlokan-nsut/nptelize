import csv
from typing import List

def read_csv_to_list(file_path: str) -> List:
    student_list = []

    with open(file_path, mode="r") as file:
        csv_reader = csv.reader(file)
        next(csv_reader)

        for row in csv_reader:
            student_details = {"student_name": row[0], "nsut_roll_no": row[1]}
            student_list.append(student_details)

    return student_list
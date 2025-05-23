"""add nptel_course_code to subjects

Revision ID: 28fad01a8f5b
Revises: 9f4c0b5ae76d
Create Date: 2025-05-23 19:56:56.403651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import string
import random


# revision identifiers, used by Alembic.
revision: str = '28fad01a8f5b'
down_revision: Union[str, None] = '9f4c0b5ae76d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def generate_random_code(length: int = 6) -> str:
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


def upgrade() -> None:
    # Step 1: Add the column as nullable first
    op.add_column('subjects', sa.Column('nptel_course_code', sa.String(), nullable=True))
    
    # Step 2: Update existing records with random values
    connection = op.get_bind()
    
    # Get all existing subject IDs
    result = connection.execute(sa.text("SELECT id FROM subjects"))
    subject_ids = [row[0] for row in result.fetchall()]
    
    # Generate unique codes for each subject
    used_codes = set()
    for subject_id in subject_ids:
        # Generate a unique code
        code = generate_random_code()
        while code in used_codes:
            code = generate_random_code()
        used_codes.add(code)
        
        # Update the record
        connection.execute(
            sa.text("UPDATE subjects SET nptel_course_code = :code WHERE id = :id"),
            {"code": code, "id": subject_id}
        )
    
    # Step 3: Make the column non-nullable and add unique constraint
    op.alter_column('subjects', 'nptel_course_code', nullable=False)
    op.create_unique_constraint('uq_subjects_nptel_course_code', 'subjects', ['nptel_course_code'])


def downgrade() -> None:
    # Remove the unique constraint and column
    op.drop_constraint('uq_subjects_nptel_course_code', 'subjects', type_='unique')
    op.drop_column('subjects', 'nptel_course_code')

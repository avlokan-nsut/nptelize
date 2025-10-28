"""rename student_subject table to student_subject_enrollments

Revision ID: a6547add41b9
Revises: e4efa71faa75
Create Date: 2025-08-08 23:15:27.670736

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6547add41b9'
down_revision: Union[str, None] = 'e4efa71faa75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Simply rename the table - preserves all data and constraints
    op.rename_table('student_subjects', 'student_subject_enrollments')


def downgrade() -> None:
    """Downgrade schema."""
    # Rename it back
    op.rename_table('student_subject_enrollments', 'student_subjects')
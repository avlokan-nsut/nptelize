"""add student_subject_enrollment_id as a foriegn key to requests table

Revision ID: 707b66d3359c
Revises: a6547add41b9
Create Date: 2025-08-08 23:45:51.747182

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '707b66d3359c'
down_revision: Union[str, None] = 'a6547add41b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Step 1: Add the column as nullable first
    op.add_column('requests', sa.Column('student_subject_enrollment_id', sa.String(), nullable=True))
    
    # Step 2: Populate the column with data from existing student_id and subject_id
    # We need to join requests with student_subject_enrollments to find the matching enrollment
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE requests 
        SET student_subject_enrollment_id = sse.id
        FROM student_subject_enrollments sse
        WHERE requests.student_id = sse.student_id 
        AND requests.subject_id = sse.subject_id
    """))
    
    # Step 3: Make the column non-null
    op.alter_column('requests', 'student_subject_enrollment_id', nullable=False)
    
    # Step 4: Add constraints
    op.create_unique_constraint(None, 'requests', ['student_subject_enrollment_id'])
    op.create_foreign_key(None, 'requests', 'student_subject_enrollments', ['student_subject_enrollment_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop constraints in reverse order
    op.drop_constraint(None, 'requests', type_='foreignkey')
    op.drop_constraint(None, 'requests', type_='unique')
    op.drop_column('requests', 'student_subject_enrollment_id')

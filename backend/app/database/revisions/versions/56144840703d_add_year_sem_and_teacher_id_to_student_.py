"""add year, sem and teacher_id to student_subjects

Revision ID: 56144840703d
Revises: a6ed6b2dc8cb
Create Date: 2025-08-05 22:39:30.482396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.database.core import get_db


# revision identifiers, used by Alembic.
revision: str = '56144840703d'
down_revision: Union[str, None] = 'a6ed6b2dc8cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def populate_values() -> None:
    generator = get_db()

    db = next(generator)
    results = db.execute(sa.text("SELECT * FROM student_subjects"))

    if not results:
        generator.close()
        return

    db.execute(sa.text(
        "UPDATE student_subjects SET student_subjects.teacher_id = subjects.teacher_id, student_subjects.is_sem_odd = FALSE, student_subjects.year = 2025 FROM student_subjects INNER JOIN subjects ON student_subjects.subject_id = subjects.id"
    )) 

    generator.close()


def upgrade() -> None:
    """Upgrade schema."""
    # Add columns as nullable first
    op.add_column('student_subjects', sa.Column('year', sa.Integer(), nullable=True))
    op.add_column('student_subjects', sa.Column('is_sem_odd', sa.Boolean(), nullable=True))
    op.add_column('student_subjects', sa.Column('teacher_id', sa.String(), nullable=True))
    
    # Use Alembic's connection instead of get_db()
    connection = op.get_bind()
    
    # Check if there are any rows to update
    result = connection.execute(sa.text("SELECT COUNT(*) FROM student_subjects"))
    count = result.scalar()
    
    if count > 0:
        # PostgreSQL-compatible UPDATE with JOIN
        connection.execute(sa.text("""
            UPDATE student_subjects 
            SET teacher_id = subjects.teacher_id,
                is_sem_odd = FALSE,
                year = 2025
            FROM subjects 
            WHERE student_subjects.subject_id = subjects.id
        """))
        
        # Commit the updates before adding constraints
        connection.commit()
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_student_subjects_teacher_id', 
        'student_subjects', 
        'users', 
        ['teacher_id'], 
        ['id']
    )
    
    # Make columns NOT NULL (remove duplicate)
    op.alter_column('student_subjects', 'year', nullable=False, existing_nullable=True)
    op.alter_column('student_subjects', 'is_sem_odd', nullable=False, existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_student_subjects_teacher_id', 'student_subjects', type_='foreignkey')
    op.drop_column('student_subjects', 'teacher_id')
    op.drop_column('student_subjects', 'is_sem_odd')
    op.drop_column('student_subjects', 'year')
"""update primary key for requests table

Revision ID: c1235139c0ee
Revises: 798619c2616c
Create Date: 2025-05-13 20:16:30.141001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1235139c0ee'
down_revision: Union[str, None] = '798619c2616c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create a unique constraint on id first if it doesn't already exist
    op.create_unique_constraint('uq_requests_id', 'requests', ['id'])
    
    # Drop the foreign key constraint from certificates table
    op.drop_constraint('certificates_request_id_fkey', 'certificates', type_='foreignkey')
    
    # Drop the primary key constraint
    op.drop_constraint('requests_pkey', 'requests', type_='primary')
    
    # Create the new primary key
    op.create_primary_key(
        'pk_requests_student_subject',  # New constraint name
        'requests',
        ['student_id', 'subject_id']
    )
    
    # Recreate the foreign key constraint pointing to the id column (which is now unique, not primary)
    op.create_foreign_key(
        'certificates_request_id_fkey', 
        'certificates', 'requests',
        ['request_id'], ['id']
    )

def downgrade() -> None:
    """Downgrade schema."""
    # Drop the foreign key constraint
    op.drop_constraint('certificates_request_id_fkey', 'certificates', type_='foreignkey')
    
    # Drop the composite primary key
    op.drop_constraint('pk_requests_student_subject', 'requests', type_='primary')
    
    # Recreate the original primary key
    op.create_primary_key(
        'requests_pkey',
        'requests',
        ['id']
    )
    
    # Recreate the foreign key constraint
    op.create_foreign_key(
        'certificates_request_id_fkey', 
        'certificates', 'requests',
        ['request_id'], ['id']
    )
    
    # Drop the unique constraint on id (if you want to fully revert)
    op.drop_constraint('uq_requests_id', 'requests', type_='unique')
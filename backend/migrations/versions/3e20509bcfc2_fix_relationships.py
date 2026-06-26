"""fix relationships

Revision ID: 3e20509bcfc2
Revises: 0828921f46b9
Create Date: 2026-05-03 19:51:11.566191

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '3e20509bcfc2'
down_revision = '0828921f46b9'
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass

    # ### end Alembic commands ###

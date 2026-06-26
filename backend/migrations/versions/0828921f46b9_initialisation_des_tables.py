"""Initialisation des tables

Revision ID: 0828921f46b9
Revises:
Create Date: 2026-04-21 21:12:06.144300
"""

from alembic import op
import sqlalchemy as sa


revision = '0828921f46b9'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Migration vide car la base SQLite existe déjà
    pass


def downgrade():
    pass
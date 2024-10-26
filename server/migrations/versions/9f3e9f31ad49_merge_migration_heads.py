"""Merge migration heads

Revision ID: 9f3e9f31ad49
Revises: 
Create Date: 2024-10-25 13:37:37.733150

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f3e9f31ad49'
down_revision = ('173ca4c9c41d', 'ed4902600dea')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass

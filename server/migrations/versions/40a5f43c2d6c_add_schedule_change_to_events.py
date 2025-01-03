"""add schedule_change to events

Revision ID: 40a5f43c2d6c
Revises: 5711853eae4f
Create Date: 2025-01-03 16:41:10.684887

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '40a5f43c2d6c'
down_revision = '5711853eae4f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('events', schema=None) as batch_op:
        batch_op.add_column(sa.Column('schedule_change', sa.Boolean(), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('events', schema=None) as batch_op:
        batch_op.drop_column('schedule_change')

    # ### end Alembic commands ###

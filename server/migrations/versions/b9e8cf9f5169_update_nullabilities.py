"""update nullabilities

Revision ID: b9e8cf9f5169
Revises: c97a0ce1d175
Create Date: 2024-10-30 15:35:45.797554

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b9e8cf9f5169'
down_revision = 'c97a0ce1d175'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('baskets', schema=None) as batch_op:
        batch_op.alter_column('is_sold',
               existing_type=sa.BOOLEAN(),
               nullable=True)
        batch_op.alter_column('is_grabbed',
               existing_type=sa.BOOLEAN(),
               nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('baskets', schema=None) as batch_op:
        batch_op.alter_column('is_grabbed',
               existing_type=sa.BOOLEAN(),
               nullable=False)
        batch_op.alter_column('is_sold',
               existing_type=sa.BOOLEAN(),
               nullable=False)

    # ### end Alembic commands ###
"""add fee_user

Revision ID: 6263c7678694
Revises: 9d726f71dda5
Create Date: 2025-02-13 12:25:28.693758

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6263c7678694'
down_revision = '9d726f71dda5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('baskets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('fee_user', sa.Float(), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('baskets', schema=None) as batch_op:
        batch_op.drop_column('fee_user')

    # ### end Alembic commands ###

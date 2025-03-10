"""Remove unique constraint from stripe_account_id

Revision ID: 4d6ae1fbc40b
Revises: 6263c7678694
Create Date: 2025-02-13 13:48:08.966211

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4d6ae1fbc40b'
down_revision = '6263c7678694'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.drop_constraint('uq_vendors_stripe_account_id', type_='unique')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_vendors_stripe_account_id', ['stripe_account_id'])

    # ### end Alembic commands ###

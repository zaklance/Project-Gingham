"""vendor notif fix

Revision ID: 60ffdbf993de
Revises: c74de946191b
Create Date: 2025-03-07 11:22:16.329246

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '60ffdbf993de'
down_revision = 'c74de946191b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendor_notifications', schema=None) as batch_op:
        batch_op.alter_column('vendor_id',
               existing_type=sa.INTEGER(),
               nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendor_notifications', schema=None) as batch_op:
        batch_op.alter_column('vendor_id',
               existing_type=sa.INTEGER(),
               nullable=False)

    # ### end Alembic commands ###

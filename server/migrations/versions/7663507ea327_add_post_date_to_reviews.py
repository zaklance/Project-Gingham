"""add post date to reviews

Revision ID: 7663507ea327
Revises: dd9e5f51c329
Create Date: 2024-11-24 11:39:22.906066

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7663507ea327'
down_revision = 'dd9e5f51c329'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('market_reviews', schema=None) as batch_op:
        batch_op.add_column(sa.Column('post_date', sa.Date(), nullable=False))

    with op.batch_alter_table('vendor_reviews', schema=None) as batch_op:
        batch_op.add_column(sa.Column('post_date', sa.Date(), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendor_reviews', schema=None) as batch_op:
        batch_op.drop_column('post_date')

    with op.batch_alter_table('market_reviews', schema=None) as batch_op:
        batch_op.drop_column('post_date')

    # ### end Alembic commands ###
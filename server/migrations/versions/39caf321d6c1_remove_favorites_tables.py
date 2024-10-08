"""remove favorites tables

Revision ID: 39caf321d6c1
Revises: 2f88ab2baf7b
Create Date: 2024-09-19 08:46:19.452340

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '39caf321d6c1'
down_revision = '2f88ab2baf7b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('market_favorites')
    op.drop_table('vendor_favorites')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('vendor_favorites',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=True),
    sa.Column('vendor_id', sa.INTEGER(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_vendor_favorites_user_id_users'),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], name='fk_vendor_favorites_vendor_id_vendors'),
    sa.PrimaryKeyConstraint('id', name='pk_vendor_favorites')
    )
    op.create_table('market_favorites',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=True),
    sa.Column('market_id', sa.INTEGER(), nullable=True),
    sa.ForeignKeyConstraint(['market_id'], ['markets.id'], name='fk_market_favorites_market_id_markets'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_market_favorites_user_id_users'),
    sa.PrimaryKeyConstraint('id', name='pk_market_favorites')
    )
    # ### end Alembic commands ###

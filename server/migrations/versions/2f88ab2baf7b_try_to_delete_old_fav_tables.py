"""try to delete old fav tables

Revision ID: 2f88ab2baf7b
Revises: 34389a570f8e
Create Date: 2024-09-17 10:09:35.717999

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2f88ab2baf7b'
down_revision = '34389a570f8e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('user_vendors')
    op.drop_table('user_markets')
    with op.batch_alter_table('market_favorites', schema=None) as batch_op:
        batch_op.alter_column('user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
        batch_op.alter_column('market_id',
               existing_type=sa.INTEGER(),
               nullable=True)

    with op.batch_alter_table('vendor_favorites', schema=None) as batch_op:
        batch_op.alter_column('user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
        batch_op.alter_column('vendor_id',
               existing_type=sa.INTEGER(),
               nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendor_favorites', schema=None) as batch_op:
        batch_op.alter_column('vendor_id',
               existing_type=sa.INTEGER(),
               nullable=False)
        batch_op.alter_column('user_id',
               existing_type=sa.INTEGER(),
               nullable=False)

    with op.batch_alter_table('market_favorites', schema=None) as batch_op:
        batch_op.alter_column('market_id',
               existing_type=sa.INTEGER(),
               nullable=False)
        batch_op.alter_column('user_id',
               existing_type=sa.INTEGER(),
               nullable=False)

    op.create_table('user_markets',
    sa.Column('user_id', sa.INTEGER(), nullable=False),
    sa.Column('market_id', sa.INTEGER(), nullable=False),
    sa.ForeignKeyConstraint(['market_id'], ['markets.id'], name='fk_user_markets_market_id_markets'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_markets_user_id_users'),
    sa.PrimaryKeyConstraint('user_id', 'market_id', name='pk_user_markets')
    )
    op.create_table('user_vendors',
    sa.Column('user_id', sa.INTEGER(), nullable=False),
    sa.Column('vendor_id', sa.INTEGER(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_vendors_user_id_users'),
    sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], name='fk_user_vendors_vendor_id_vendors'),
    sa.PrimaryKeyConstraint('user_id', 'vendor_id', name='pk_user_vendors')
    )
    # ### end Alembic commands ###

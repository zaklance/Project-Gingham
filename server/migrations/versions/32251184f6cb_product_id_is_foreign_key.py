"""product_id is foreign key

Revision ID: 32251184f6cb
Revises: 376950967de7
Create Date: 2024-12-08 16:09:57.277835

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '32251184f6cb'
down_revision = '376950967de7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('admin_notifications', schema=None) as batch_op:
        batch_op.add_column(sa.Column('vendor_user_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('vendor_id', sa.Integer(), nullable=True))
        batch_op.drop_constraint('fk_admin_notifications_vendor_reviews_id_vendor_reviews', type_='foreignkey')
        batch_op.drop_constraint('fk_admin_notifications_market_reviews_id_market_reviews', type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('fk_admin_notifications_vendor_user_id_vendor_users'), 'vendor_users', ['vendor_user_id'], ['id'])
        batch_op.create_foreign_key(batch_op.f('fk_admin_notifications_vendor_id_vendors'), 'vendors', ['vendor_id'], ['id'])
        batch_op.drop_column('vendor_reviews_id')
        batch_op.drop_column('market_reviews_id')

    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.create_foreign_key(batch_op.f('fk_vendors_product_products'), 'products', ['product'], ['id'])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('fk_vendors_product_products'), type_='foreignkey')

    with op.batch_alter_table('admin_notifications', schema=None) as batch_op:
        batch_op.add_column(sa.Column('market_reviews_id', sa.INTEGER(), nullable=True))
        batch_op.add_column(sa.Column('vendor_reviews_id', sa.INTEGER(), nullable=True))
        batch_op.drop_constraint(batch_op.f('fk_admin_notifications_vendor_id_vendors'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('fk_admin_notifications_vendor_user_id_vendor_users'), type_='foreignkey')
        batch_op.create_foreign_key('fk_admin_notifications_market_reviews_id_market_reviews', 'market_reviews', ['market_reviews_id'], ['id'])
        batch_op.create_foreign_key('fk_admin_notifications_vendor_reviews_id_vendor_reviews', 'vendor_reviews', ['vendor_reviews_id'], ['id'])
        batch_op.drop_column('vendor_id')
        batch_op.drop_column('vendor_user_id')

    # ### end Alembic commands ###
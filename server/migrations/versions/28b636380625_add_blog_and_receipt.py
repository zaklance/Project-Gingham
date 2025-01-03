"""add blog and receipt

Revision ID: 28b636380625
Revises: 7b495a718680
Create Date: 2025-01-03 15:35:06.125460

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28b636380625'
down_revision = '7b495a718680'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('blogs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('body', sa.String(), nullable=False),
    sa.Column('admin_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['admin_id'], ['admin_users.id'], name=op.f('fk_blogs_admin_id_admin_users')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_blogs'))
    )
    op.create_table('receipts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('baskets', sa.JSON(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_receipts_user_id_users')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_receipts'))
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('receipts')
    op.drop_table('blogs')
    # ### end Alembic commands ###

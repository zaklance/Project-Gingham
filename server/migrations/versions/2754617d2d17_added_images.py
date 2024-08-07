"""added images

Revision ID: 2754617d2d17
Revises: ed343d86c542
Create Date: 2024-07-08 15:41:58.525399

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2754617d2d17'
down_revision = 'ed343d86c542'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.add_column(sa.Column('image', sa.String(), nullable=True))
        batch_op.alter_column('locations',
               existing_type=sa.VARCHAR(),
               type_=sa.JSON(),
               existing_nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('vendors', schema=None) as batch_op:
        batch_op.alter_column('locations',
               existing_type=sa.JSON(),
               type_=sa.VARCHAR(),
               existing_nullable=True)
        batch_op.drop_column('image')

    # ### end Alembic commands ###

"""weewee

Revision ID: ed343d86c542
Revises: 342fe437b894
Create Date: 2024-07-08 10:43:53.440141

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ed343d86c542'
down_revision = '342fe437b894'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('favorite_markets',
               existing_type=sa.VARCHAR(),
               type_=sa.JSON(),
               existing_nullable=True)
        batch_op.alter_column('favorite_vendors',
               existing_type=sa.VARCHAR(),
               type_=sa.JSON(),
               existing_nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('favorite_vendors',
               existing_type=sa.JSON(),
               type_=sa.VARCHAR(),
               existing_nullable=True)
        batch_op.alter_column('favorite_markets',
               existing_type=sa.JSON(),
               type_=sa.VARCHAR(),
               existing_nullable=True)

    # ### end Alembic commands ###
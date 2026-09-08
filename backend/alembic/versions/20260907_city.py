"""Bootstrap supported city independently of the optional demo catalog."""

import sqlalchemy as sa

from alembic import op

revision = "20260907_city"
down_revision = "6be95a996908"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        sa.text("""
        INSERT INTO cities (id, name, country, timezone, is_active, created_at, updated_at)
        VALUES ('f9f2b1ec-f021-45ca-a07c-71ab114fd621', 'Bishkek', 'Kyrgyzstan',
                'Asia/Bishkek', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO NOTHING
    """)
    )


def downgrade():
    # Reference data may already be used by addresses and orders; preserve it.
    pass

"""Add scan_history table

Revision ID: add_scan_history_table
Revises: 001_initial
Create Date: 2025-10-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_scan_history_table'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'scan_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('table_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('data_tables.id', ondelete='CASCADE'), nullable=False),
        sa.Column('column_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('table_columns.id', ondelete='SET NULL'), nullable=True),
        sa.Column('column_name', sa.Text(), nullable=True),
        sa.Column('barcode', sa.Text(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False, server_default='success'),
        sa.Column('matched_row_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default=sa.text("ARRAY[]::UUID[]")),
        sa.Column('matched_rows', postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::JSONB")),
        sa.Column('source', sa.Text(), nullable=False, server_default='mobile'),
        sa.Column('metadata', postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::JSONB")),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )

    op.create_index('idx_scan_history_table', 'scan_history', ['table_id', 'created_at'], unique=False)
    op.create_index('idx_scan_history_workspace', 'scan_history', ['workspace_id', 'created_at'], unique=False)
    op.create_index('idx_scan_history_barcode', 'scan_history', ['barcode'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_scan_history_barcode', table_name='scan_history')
    op.drop_index('idx_scan_history_workspace', table_name='scan_history')
    op.drop_index('idx_scan_history_table', table_name='scan_history')
    op.drop_table('scan_history')

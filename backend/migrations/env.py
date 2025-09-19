from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from sqlalchemy_utils import database_exists, create_database

from config import DATABASE_URL, Base, engine
from models import init_db
import models.models  # noqa: F401 (import to register models with Base)

fileConfig(context.config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""

    if not database_exists(engine.url):
        create_database(engine.url)
        init_db()  # optional: seed super admin etc.

    connectable = engine_from_config(
        {"sqlalchemy.url": DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
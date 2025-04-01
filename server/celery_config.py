from celery import Celery
import os

def make_celery():
    # redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_url = "redis://localhost:6379/0"
    # backend = os.getenv("DATABASE_URI", "redis://localhost:6379/0")
    # backend="redis://localhost:6379/1"
    return Celery(
        "tasks",
        broker=redis_url,
        backend=redis_url,
        include=["tasks"]
    )

celery = make_celery()
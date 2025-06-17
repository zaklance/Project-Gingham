import os
import json
import redis
from celery.schedules import crontab
from celery import Celery

def get_redis_url():
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")

def make_celery():
    redis_url = get_redis_url()
    return Celery(
        "tasks", 
        broker=redis_url, 
        backend=redis_url,
        include=["tasks"]
    )

celery = make_celery()

def get_beat_schedule():
    return {
        'reset-market-status': {
            'task': 'server.tasks.reset_market_status',
            'schedule': crontab(hour=0, minute=0, day_of_month=1, month_of_year=1),
        },
        'check-blog-notifications': {
            'task': 'tasks.check_scheduled_blog_notifications',
            'schedule': crontab(minute=0, hour=12),
        },
        'weekly_admin_summary': {
            'task': 'tasks.send_weekly_admin_summary',
            'schedule': crontab(minute=0, hour=13, day_of_week=1),
        },
        'monthly_vendor_statement': {
            'task': 'tasks.send_monthly_vendor_statements',
            'schedule': crontab(minute=0, hour=13, day_of_month=10),
        }
    }

def configure_celery():
    celery.conf.update(
        beat_schedule=get_beat_schedule(),
        worker_send_task_events=True,
        task_send_sent_event=True,
        timezone='UTC',
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        enable_utc=True
    )

configure_celery()
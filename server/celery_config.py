import os
import json
import redis
from celery.schedules import crontab
from celery import Celery

def make_celery():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return Celery(
        "tasks",
        broker=redis_url,
        backend=redis_url,
        include=["tasks"]
    )

celery = make_celery()


celery.conf.beat_schedule = {
    'reset-market-status': {
        'task': 'server.tasks.reset_market_status',
        'schedule': crontab(hour=0, minute=0, day_of_month=1, month_of_year=1),
    },
    'check-blog-notifications': {
        'task': 'tasks.check_scheduled_blog_notifications',
        'schedule': crontab(minute='0', hour='12'),
    }
}

celery.conf.worker_send_task_events = True
celery.conf.task_send_sent_event = True
celery.conf.timezone = 'UTC'

# def delete_scheduled_task(task_id):
#     redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
#     r = redis.from_url(redis_url)
#     keys = r.keys("celery*")
#     for key in keys:
#         try:
#             if r.type(key) == b'zset':
#                 for entry in r.zrange(key, 0, -1):
#                     task_data = json.loads(entry)
#                     if task_data.get('request', {}).get('id') == task_id:
#                         print(f"Deleting task {task_id} from key {key}")
#                         r.zrem(key, entry)
#         except Exception as e:
#             print(f"Error checking key {key}: {e}")
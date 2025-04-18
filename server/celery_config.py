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
            'schedule': crontab(minute='0', hour='12'),
        }
    }

def get_beat_schedule_db_path():
    return '/var/data/celery-beat/celerybeat-schedule.db'

def configure_celery():
    celery.conf.update(
        beat_schedule=get_beat_schedule(),
        beat_db=get_beat_schedule_db_path(),
        worker_send_task_events=True,
        task_send_sent_event=True,
        timezone='UTC'
    )

configure_celery()

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
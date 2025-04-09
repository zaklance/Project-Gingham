import os
import json
import redis
from celery.schedules import crontab
from celery import Celery

worker_cancel_long_running_tasks_on_connection_loss = True

def make_celery():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return Celery(
        "tasks",
        broker=redis_url,
        backend=redis_url,
        include=["tasks"]
    )

celery = make_celery()

celery.config_from_object(__name__)

celery.conf.beat_schedule = {
    'task-run-every-day-at-8am-est': {
        'task': 'tasks.send_blog_notifications',
        'schedule': crontab(hour=12, minute=0),
    },
}

celery.conf.timezone = 'UTC'

def delete_scheduled_task(task_id):
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    r = redis.from_url(redis_url)
    keys = r.keys("celery*")
    for key in keys:
        try:
            if r.type(key) == b'zset':
                for entry in r.zrange(key, 0, -1):
                    task_data = json.loads(entry)
                    if task_data.get('request', {}).get('id') == task_id:
                        print(f"Deleting task {task_id} from key {key}")
                        r.zrem(key, entry)
        except Exception as e:
            print(f"Error checking key {key}: {e}")
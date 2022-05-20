#from pymongo import MongoClient
from celery import Celery
import redis
from task_config import CACHE_REDIS_HOST
from task_config import CELERY_BROKER_URL
from task_config import CELERY_RESULT_BACKEND


#------- redis---------#
class RedisWrapper:
    def __init__(self):
        self.redis_instance = redis.Redis(host=CACHE_REDIS_HOST,port=6379,decode_responses=True)


redis_db = RedisWrapper()

#app = Celery("task",broker="redis://localhost:6379/1", backend="redis://localhost:6379/1")
app = Celery("task",broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

#刪除我的食物快取
@app.task()
def delmyfoodCache(key,page):
    redis_db.redis_instance.hdel(key,str(page))

#刪除我的飲食計畫快取
@app.task()
def delmyplanCache(key,page):
    redis_db.redis_instance.hdel(key,str(page))

#刪除我的日紀錄快取
@app.task()
def delmyrecordCache(key,timestamp):
    redis_db.redis_instance.hdel(key,str(timestamp))





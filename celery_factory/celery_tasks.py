from celery import shared_task
from model import redis_db



'''
@shared_task(name='celery_tasks.test1')
def celery_test():
    print("this is a long celery ask.")
    redis_db.redis_instance.set("test","abc") #存英文就不用先encode
    #bytes("嘿嘿嘿","utf-8") 存中文要先encode才能存
 
@shared_task(name='celery_tasks.test2')
def celery_test():
    print("this is a short celery task.")
'''

#刪除我的食物快取
@shared_task(name="celery_tasks.delmyfoodCache")
def del_myfood_cache(key,page):
    redis_db.redis_instance.hdel(key,str(page))

#刪除我的飲食計畫快取
@shared_task(name="celery_tasks.delmyplanCache")
def del_myplan_cache(key,page):
    redis_db.redis_instance.hdel(key,str(page))

#刪除我的日紀錄快取
@shared_task(name="celery_tasks.delmyrecordCache")
def del_myrecord_cache(key,timestamp):
    redis_db.redis_instance.hdel(key,str(timestamp))
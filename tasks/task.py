from pymongo import MongoClient
from celery import Celery
import redis
from task_config import CACHE_REDIS_HOST
from task_config import CELERY_BROKER_URL
from task_config import CELERY_RESULT_BACKEND
from task_config import MONGODB_URL


#------- redis---------#
class RedisWrapper:
    def __init__(self):
        self.redis_instance = redis.Redis(host=CACHE_REDIS_HOST,port=6379,decode_responses=True)

redis_db = RedisWrapper()


#------- mongodb -----#
class MongoWrapper:
    def __init__(self):
        self.client = MongoClient(
            f"mongodb+srv://{MONGODB_URL}/?retryWrites=true&w=majority")
        self.db = self.client.macroseat

mongo_db = MongoWrapper()


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


#-------- 聊天task ---------#
@app.task()
def push_message(key,message_obj):
    collection =mongo_db.db.message_history 
    result = collection.update_one({"history_id":key},
                            {"$setOnInsert":
                                {"message":
                                [message_obj]}
                            },upsert=True)                      
    if result.matched_count == 1: #如果是1,代表已經有這個document
        collection.update_one({"history_id" : key}, {"$push":{"message":message_obj}})


#----- 使用者傳訊息給營養師 ----#

#更新使用者的"已讀時間"
@app.task()
def update_user_read(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為前面就已經先存訊息了
    collection.update_one({"history_id" : key}, {"$max":{"user_read":message_time}})


#更新使用者和營養師的"對話者列表"
@app.task()
def update_history_list(user_key,nutri_key):
    collection = mongo_db.db.user_history 
    result1 = collection.update_one({"user_id" : user_key},
                            {"$setOnInsert":
                                {"chat_list":
                                [nutri_key]}
                            },upsert=True)
    if result1.matched_count == 1: #如果是1,代表已經有這個document
        collection.update_one({"user_id" : user_key}, {"$addToSet":{"chat_list":nutri_key}})    
    collection = mongo_db.db.nutri_history
    result2 = collection.update_one({"nutri_id" : nutri_key},
                            {"$setOnInsert":
                                {"chat_list":
                                [user_key]}
                            },upsert=True)
    if result2.matched_count == 1: #如果是1,代表已經有這個document
        collection.update_one({"nutri_id" : nutri_key}, {"$addToSet":{"chat_list":user_key}})      


#更新營養師的"已讀時間"
@app.task()
def update_nutri_read(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為是使用者先傳訊息給營養師
    collection.update_one({"history_id" : key}, {"$max":{"nutri_read":message_time}})  

#更新營養師的"未讀時間"
@app.task()
def update_nutri_unread(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為是使用者先傳訊息給營養師
    collection.update_one({"history_id" : key}, {"$max":{"nutri_unread":message_time}}) 


#----- 營養師傳訊息給使用者 ----#

#更新使用者的"未讀時間"
@app.task()
def update_user_unread(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為前面就已經先存訊息了
    collection.update_one({"history_id" : key}, {"$max":{"user_unread":message_time}})   

#------- 使用者取完已讀對話紀錄 ------#
@app.task()
def update_user_read_unread(key,user_read,user_unread):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為前面就已經先存訊息了
    collection.update_one({"history_id" : key}, {"$set":{"user_read":user_read,"user_unread":user_unread}})    

#------- 營養師取完未讀對話紀錄 ------#
@app.task()
def update_nutri_read_unread(key,nutri_read,nutri_unread):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為前面就已經先存訊息了
    collection.update_one({"history_id" : key}, {"$set":{"nutri_read":nutri_read,"nutri_unread":nutri_unread}})


#------- 更新營養師的未讀數量 ------#
@app.task()
def update_nutri_unread_count(key,count):
    collection = mongo_db.db.message_history 
    collection.update_one({"history_id" : key}, {"$set":{"nutri_unread_count":count}})    

@app.task()
def incr_nutri_unread_count(key):
    collection = mongo_db.db.message_history 
    collection.update_one({"history_id" : key}, {"$inc":{"nutri_unread_count":1}})    

#------- 更新使用者的未讀數量 ------#
@app.task()
def update_user_unread_count(key,count):
    collection = mongo_db.db.message_history 
    collection.update_one({"history_id" : key}, {"$set":{"user_unread_count":count}})    

@app.task()
def incr_user_unread_count(key):
    collection = mongo_db.db.message_history 
    collection.update_one({"history_id" : key}, {"$inc":{"user_unread_count":1}})    
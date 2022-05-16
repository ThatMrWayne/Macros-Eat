from celery import shared_task
from model import redis_db
from model import mongo_db



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


#-------- 對話 -----------#
@shared_task(name="celery_tasks.pushMessage")
def store_message(key,message_obj):
    collection =mongo_db.db.message_history 
    result = collection.update_one({"history_id":key},
                            {"$setOnInsert":
                                {"message":
                                [message_obj]}
                            },upsert=True)
    if result.modified_count == 0: #如果是零,代表已經有這個document
        collection.update_one({"history_id" : key}, {"$addToSet":{"message":message_obj}})

 
#----- 使用者傳訊息給營養師 ----#
#更新使用者的"已讀時間"
@shared_task(name="celery_tasks.updateUserRead")
def update_user_read(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為前面就已經先存訊息了
    collection.update_one({"history_id" : key}, {"$set":{"user_read":message_time}})


#更新使用者"已讀時間"和營養師的"未讀時間"
@shared_task(name="celery_tasks.updateUReadNUnread")
def update_read_unread(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為前面就已經先存訊息了
    collection.update_one({"history_id" : key}, {"$set":{"user_read":message_time, "nutri_unread":message_time}})    

#更新使用者和營養師的"對話者列表"
@shared_task(name="celery_tasks.updateHistoryList")
def update_history_list(user_key,nutri_key):
    collection = mongo_db.db.user_history 
    result1 = collection.update_one({"user_id" : user_key},
                            {"$setOnInsert":
                                {"chat_list":
                                [nutri_key]}
                            },upsert=True)
    if result1.modified_count == 0: #如果是零,代表已經有這個document
        collection.update_one({"user_id" : user_key}, {"$addToSet":{"chat_list":nutri_key}})    
    collection = mongo_db.db.nutri_history
    result2 = collection.update_one({"nutri_id" : nutri_key},
                            {"$setOnInsert":
                                {"chat_list":
                                [user_key]}
                            },upsert=True)
    if result2.modified_count == 0: #如果是零,代表已經有這個document
        collection.update_one({"nutri_id" : nutri_key}, {"$addToSet":{"chat_list":user_key}})                         


#更新營養師的"已讀時間"
@shared_task(name="celery_tasks.updateNutriRead")
def update_nutri_read(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為是使用者先傳訊息給營養師
    collection.update_one({"history_id" : key}, {"$set":{"nutri_read":message_time}})    

#更新營養師的"未讀時間"
@shared_task(name="celery_tasks.updateNutriUnread")
def update_nutri_unread(key,message_time):
    collection = mongo_db.db.message_history 
    #一定已經有這個document因為是使用者先傳訊息給營養師
    collection.update_one({"history_id" : key}, {"$set":{"nutri_unread":message_time}}) 

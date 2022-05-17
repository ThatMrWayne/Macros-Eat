import json
import mysql.connector
from mysql.connector import errorcode
from mysql.connector import pooling

from config import MYSQL_PASSWORD
from config import MYSQL_USER
from config import MONGODB_URL_
from model.connection import Auth_connection
from model.connection import Food_connection
from model.connection import Plan_connection
from model.connection import Record_connection
from model.connection import Diet_connection
from model.connection import Weight_connection

from pymongo import MongoClient

import redis

TABLES = {}
#members
TABLES['nutris'] = (
    "CREATE TABLE IF NOT EXISTS `nutris` ("
    "  `nutri_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `name` varchar(255) NOT NULL,"
    "  `email` varchar(255) NOT NULL,"
    "  `hash_password` varchar(255) NOT NULL,"
    "  `identity` int NOT NULL,"
    "  PRIMARY KEY (`nutri_id`),"
    "  UNIQUE KEY(`email`)"
    ")")


TABLES['members'] = (
    "CREATE TABLE IF NOT EXISTS `members` ("
    "  `member_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `name` varchar(255) NOT NULL,"
    "  `email` varchar(255) NOT NULL,"
    "  `hash_password` varchar(255) NOT NULL,"
    "  `signup_date` bigint NOT NULL," #discuss with ta
    "  `age` int ,"
    "  `height` float(4,1),"
    "  `weight` float(4,1),"
    "  `habit` int,"
    "  `target` int,"
    "  `gender` int,"
    "  `initial` boolean,"
    "  `identity` int NOT NULL,"
    "  PRIMARY KEY (`member_id`),"
    "  UNIQUE KEY(`email`)"
    ")")

#food store house
TABLES['food'] = (
    "CREATE TABLE IF NOT EXISTS `food` ("
    "  `food_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `member_id` bigint NOT NULL,"
    "  `food_name` varchar(255) NOT NULL,"
    "  `protein` float(5,1) NOT NULL," #g
    "  `fat` float(5,1) NOT NULL," #g
    "  `carbs` float(5,1) NOT NULL," #g
    "  PRIMARY KEY (`food_id`),"
    "  FULLTEXT (`food_name`) WITH PARSER ngram,"
    "  FOREIGN KEY(member_id) REFERENCES members(member_id) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")    

#day record
TABLES['records'] = (
    "CREATE TABLE IF NOT EXISTS `records` ("
    "  `record_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `create_at` bigint NOT NULL,"
    "  `member_id` bigint NOT NULL,"
    "  `protein` int NOT NULL," #%
    "  `fat` int NOT NULL," #%
    "  `carbs` int NOT NULL," #%
    "  `plan_calories` int NOT NULL,"
    "  PRIMARY KEY (`record_id`),"
    "  FOREIGN KEY(`member_id`) REFERENCES members(`member_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")  

#food intakes
TABLES['intakes'] = (
    "CREATE TABLE IF NOT EXISTS `intakes` ("
    "  `intake_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `record_id` bigint NOT NULL,"
    "  `food_name` varchar(255) NOT NULL,"
    "  `protein` float(5,1) NOT NULL," #g
    "  `fat` float(5,1) NOT NULL," #g
    "  `carbs` float(5,1) NOT NULL," #g
    "  `amount` float(5,1) NOT NULL," #g
    "  `member_id` bigint NOT NULL," 
    "  PRIMARY KEY (`intake_id`),"
    "  FOREIGN KEY(`record_id`) REFERENCES records(`record_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")  

#diet plans (4/19 checked)
TABLES['plans'] = (
    "CREATE TABLE IF NOT EXISTS `plans` ("
     " `plan_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `create_at` bigint NOT NULL,"
    "  `member_id` bigint NOT NULL,"
    "  `protein` int NOT NULL," #%
    "  `fat` int NOT NULL," #%
    "  `carbs` int NOT NULL," #%
    "  `plan_calories` int NOT NULL," 
    "  `plan_name` varchar(50),"
    "  PRIMARY KEY (`plan_id`),"
    "  FOREIGN KEY(`member_id`) REFERENCES members(`member_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")  

#weight
TABLES['weight'] = (
    "CREATE TABLE IF NOT EXISTS `weight` ("
    "  `weight_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `create_at` bigint NOT NULL,"
    "  `member_id` bigint NOT NULL,"
    "  `weight` float(4,1) NOT NULL," #kg
    "  PRIMARY KEY (`weight_id`),"
    "  FOREIGN KEY(`member_id`) REFERENCES members(`member_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")  



class DataBase():
    def __init__(self):
        try:
            config = {
                'user': MYSQL_USER,
                'password': MYSQL_PASSWORD,
                'host': '127.0.0.1',
                'database': 'whatueat',
                'raise_on_warnings': True,
                }
            # create connection
            self.cnxpool = pooling.MySQLConnectionPool(pool_name="tinipool", pool_size=32, **config)
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print("Something is wrong with your user name or password")
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print("Database does not exist")
            else:
                print(err.msg)
            exit(1)

        '''   
        #tables=['members','food','records','intakes','plans','weight']
        tables=['food','intakes']
        for table in tables:
        #建立資料表
            cnx = self.cnxpool.get_connection()
            cursor= cnx.cursor()
            try:
                table_description = TABLES[table]
                print(f"Creating table : {table} ")
                cursor.execute(table_description)
                cnx.commit()
                print('execute over')
            except mysql.connector.Error as err: #為啥明明就沒有members還是會跑到這
                print(err)
            finally:
                cursor.close()
                cnx.close() 
        '''    




    #取得驗證登入註冊相關操作的自定義connection物件
    def get_auth_cnx(self):
        try:
            cnx = self.cnxpool.get_connection()
            return Auth_connection(cnx)
        except mysql.connector.Error as err: 
            print(err)
            return "error"      

    #取得食物倉庫操作的自定義connection物件
    def get_food_cnx(self):
        try:
            cnx = self.cnxpool.get_connection()
            return Food_connection(cnx)
        except mysql.connector.Error as err: 
            print(err)
            return "error"   

    #取得飲食計畫操作的自定義connection物件
    def get_diet_plan_cnx(self):
        try:
            cnx = self.cnxpool.get_connection()
            return Plan_connection(cnx)
        except mysql.connector.Error as err: 
            print(err)
            return "error"

    #取得每日紀錄操作的自定義connection物件
    def get_daily_record_cnx(self):
        try:
            cnx = self.cnxpool.get_connection()
            return Record_connection(cnx)
        except mysql.connector.Error as err: 
            print(err)
            return "error"     

    #取得飲食操作的自定義connection物件
    def get_daily_diet_cnx(self):
        try:
            cnx = self.cnxpool.get_connection()
            return Diet_connection(cnx)
        except mysql.connector.Error as err: 
            print(err)
            return "error"   

    #取得體重操作的自定義connection物件
    def get_weight_cnx(self):
        try:
            cnx = self.cnxpool.get_connection()
            return Weight_connection(cnx)
        except mysql.connector.Error as err: 
            print(err)
            return "error"                  

             
db = DataBase()

#------- redis---------#
class RedisWrapper:
    def __init__(self):
        self.redis_instance = redis.Redis(host='127.0.0.1',port=6379,decode_responses=True)

redis_db = RedisWrapper()

'''
redis_db.redis_instance.hset("test","u1",json.dumps({"name":"wayne"}))

g = redis_db.redis_instance.hget("test","u1")
print(type(g))
print(g)


#r = redis_db.redis_instance.smembers("u1")
#x=list(int(i) for i in r)
#print(x)
'''

#------- mongodb --------#
class MongoWrapper:
    def __init__(self):
        self.client = MongoClient(
            f"mongodb+srv://{MONGODB_URL_}/myFirstDatabase?retryWrites=true&w=majority")
        self.db = self.client.whatueat

mongo_db = MongoWrapper()

collection = mongo_db.db.message_history

#collection.update_one({"hsitory_id":"123"},{"$setOnInsert":{"msg":[1,2,3]}},upsert=True)
'''
r = collection.update_one({"hsitory_id":"123"},{
                                            "$setOnInsert":
                                                {"msg":[1,2,3,4,5,6]},
                                            },upsert=True)
print(dir(r))

print(r.modified_count)
print(r.matched_count)
print(r.raw_result)

collection.update_one({"hsitory_id":"123"},{"$set":{"test":1}})

'''


'''
data = [{
        "name":"wayne",
        "age":29.5,
        },
        {
        "name":"shane",
        "age":28.5,
        },
        {
        "name":"josh",
        "age":27.5,
        },
        {
        "name":"mike",
        "age":26,
        }]

value = json.dumps(data)

m = {"0" : value}

#redis_db.redis_instance.hset("get_my_food18",mapping = m)

r = redis_db.redis_instance.hget("get_my_food18","1")

print(r)

'''
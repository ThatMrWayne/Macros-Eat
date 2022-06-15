import time
from flask import current_app
import mysql.connector
from mysql.connector import errorcode
from mysql.connector import pooling
from config import MYSQL_PASSWORD
from config import MYSQL_USER
from config import MONGODB_URL_
from config import CACHE_REDIS_HOST_
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
    "  `signup_date` bigint NOT NULL," 
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
    "  PRIMARY KEY (`intake_id`),"
    "  FOREIGN KEY(`record_id`) REFERENCES records(`record_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")  

#diet plans 
TABLES['plans'] = (
    "CREATE TABLE IF NOT EXISTS `plans` ("
     " `plan_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `create_at` bigint NOT NULL,"
    "  `member_id` bigint NOT NULL,"
    "  `protein` int NOT NULL," #%
    "  `fat` int NOT NULL," #%
    "  `carbs` int NOT NULL," #%
    "  `plan_calories` int NOT NULL," 
    "  `plan_name` varchar(50) NOT NULL,"
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

TABLES["service_user"] = (
    "CREATE TABLE IF NOT EXISTS `service_user` ("
    "  `auth` varchar(255) NOT NULL,"
    "  `member_id` bigint NOT NULL,"
    "  `p256dh` varchar(255) NOT NULL,"
    "  `endpoint` varchar(255) NOT NULL,"
    "  `expirationTime` varchar(255) ," #kg
    "  PRIMARY KEY (`auth`),"
    "  FOREIGN KEY(`member_id`) REFERENCES members(`member_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")

TABLES["service_nutri"] = (
    "CREATE TABLE IF NOT EXISTS `service_nutri` ("
    "  `auth` varchar(255) NOT NULL,"
    "  `nutri_id` bigint NOT NULL,"
    "  `p256dh` varchar(255) NOT NULL,"
    "  `endpoint` varchar(255) NOT NULL,"
    "  `expirationTime` varchar(255) ," #kg
    "  PRIMARY KEY (`auth`),"
    "  FOREIGN KEY(`nutri_id`) REFERENCES nutris(`nutri_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")




class DataBase():
    def __init__(self):
        try:
            config = {
                'user': MYSQL_USER,
                'password': MYSQL_PASSWORD,
                'host': "database-macroseat.cvtkgqdz8ivt.us-east-1.rds.amazonaws.com",
                'database': "macroseat",
                'port': 3306
                }
            # create connection
            self.cnxpool = pooling.MySQLConnectionPool(pool_name="tinipool", pool_size=15, pool_reset_session=True, **config)
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print("Something is wrong with your user name or password")
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print("Database does not exist")
            else:
                print(err.msg)
            exit(1)

        

        cnx = self.cnxpool.get_connection()
        cursor= cnx.cursor()
        db_exist = True
        try:
            cursor.execute("USE {}".format('macroseat'))
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_BAD_DB_ERROR:
                self.create_database(cursor)
                cnx.commit()
            else:
                current_app.logger.info(err)
                db_exist = False
        finally:
            cursor.close()
            cnx.close()
            if not db_exist:
                exit(1)
                




          
        tables=['nutris','members','food','records','intakes','plans','weight','service_user','service_nutri']
        for table in tables:
        #建立資料表
            cnx = self.cnxpool.get_connection()
            cursor= cnx.cursor()
            cursor.execute("USE {}".format('macroseat'))
            try:
                table_description = TABLES[table]
                print(f"Creating table : {table} ")
                cursor.execute(table_description)
                cnx.commit()
            except mysql.connector.Error as err: 
                print(err)
            finally:
                cursor.close()
                cnx.close() 
                
           

    @staticmethod
    def create_database(cursor):
        try:
            cursor.execute(
                "CREATE DATABASE {}".format('macroseat'))
        except mysql.connector.Error as err:
            print("Failed creating database: {}".format(err))
            exit(1)


    def get_cnx(self):
        n = 0
        cnx = None
        while n < 500: 
            try:
                cnx = self.cnxpool.get_connection()
                current_app.logger.info('n:'+str(n))
                break
            except mysql.connector.Error as err: 
                current_app.logger.info('cannot get mysql connection from connection pool.')
                n+=1
                time.sleep(0.1)   
        if not cnx:
            return "error"
        elif cnx.is_connected():  
            current_app.logger.info('get connection success')  
            return cnx


db = DataBase()

#------- redis---------#
class RedisWrapper:
    def __init__(self):
        self.redis_instance = redis.Redis(host=CACHE_REDIS_HOST_,port=6379,decode_responses=True)

redis_db = RedisWrapper()


#------- mongodb --------#
class MongoWrapper:
    def __init__(self):
        self.client = MongoClient(
            f"mongodb+srv://{MONGODB_URL_}/?retryWrites=true&w=majority")
        self.db = self.client.macroseat

mongo_db = MongoWrapper()




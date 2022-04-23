import mysql.connector
from mysql.connector import errorcode
from mysql.connector import pooling
from config import MYSQL_PASSWORD
from config import MYSQL_USER
from model.connection import Auth_connection
from model.connection import Food_connection
from model.connection import Plan_connection
from model.connection import Record_connection
from model.connection import Diet_connection
from model.connection import Weight_connection

TABLES = {}
#members
TABLES['members'] = (
    "CREATE TABLE IF NOT EXISTS `members` ("
    "  `member_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `name` varchar(255) NOT NULL,"
    "  `email` varchar(255) NOT NULL,"
    "  `hash_password` varchar(255) NOT NULL,"
    "  `signup_date` bigint NOT NULL," #discuss with ta
    "  `age` int ,"
    "  `height` float,"
    "  `weight` float,"
    "  `habit` int,"
    "  `target` int,"
    "  `sex` int,"
    "  `initial` boolean,"
    "  PRIMARY KEY (`member_id`),"
    "  UNIQUE KEY(`email`)"
    ")")

#food store house
TABLES['food_house'] = (
    "CREATE TABLE IF NOT EXISTS `food_house` ("
    "  `food_id` bigint NOT NULL AUTO_INCREMENT,"
    "  `member_id` bigint,"
    "  `food_name` varchar(255) NOT NULL,"
    "  `protein` float(4,1) NOT NULL," #g
    "  `fat` float(4,1) NOT NULL," #g
    "  `carbs` float(4,1) NOT NULL," #g
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
    "  `protein` float(4,1) NOT NULL," #g
    "  `fat` float(4,1) NOT NULL," #g
    "  `carbs` float(4,1) NOT NULL," #g
    "  `amount` float(4,1) NOT NULL," #g
    "  `member_id` bigint NOT NULL," 
    "  PRIMARY KEY (`intake_id`),"
    "  FOREIGN KEY(`record_id`) REFERENCES records(`record_id`) ON DELETE CASCADE ON UPDATE CASCADE"
    ")")  

#diet plans (4/19 checked)
TABLES['diet_plans'] = (
    "CREATE TABLE IF NOT EXISTS `diet_plans` ("
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
TABLES['weight_records'] = (
    "CREATE TABLE IF NOT EXISTS `weight_records` ("
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
            self.cnxpool = pooling.MySQLConnectionPool(pool_name="tinipool", pool_size=5, **config)
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print("Something is wrong with your user name or password")
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print("Database does not exist")
            else:
                print(err.msg)
            exit(1)

        '''   
        #tables=['food_house','records','intakes','diet_plans','weight_records']
        tables=['weight_records']
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

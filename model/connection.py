import mysql.connector
from flask import current_app


#base class
#class Connection:
#    def __init__(self,cnx):
#        self.cnx = cnx

                 

class Auth_connection():
    @staticmethod
    def check_if_member_exist(cnx,email,identity):
        result,msg=None,None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        if identity ==1:
            query = "SELECT name FROM members WHERE email=%(email)s"
        elif identity == 2:
            query = "SELECT name FROM nutris WHERE email=%(email)s"            
        try:
            cursor.execute(query, {'email': email})
            result = cursor.fetchone()
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:
                return "error"
            elif result:
                return True
            else:
                return False

    @staticmethod 
    def insert_new_member(cnx,name,email,hash_password,identity,date):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        if identity==1:
            query = "INSERT INTO members VALUES (DEFAULT,%(name)s,%(email)s,%(password)s,%(date)s,null,null,null,null,null,null,true,%(identity)s)"
            input_data = {'date':date,'name': name, 'email': email, 'password': hash_password,'identity':identity}
        elif identity==2:
            query = "INSERT INTO nutris VALUES (DEFAULT,%(name)s,%(email)s,%(password)s,%(identity)s)"
            input_data = {'name': name, 'email': email, 'password': hash_password,'identity':identity}
        try:
            cursor.execute(query, input_data)
            cnx.commit()
            result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:    
                return "error"
            elif result:
                return True 

    @staticmethod
    def confirm_member_information(cnx,email,identity):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        if identity==1:
            query = "SELECT member_id, hash_password, name, initial, identity FROM members WHERE email=%(email)s"
        elif identity==2:
            query = "SELECT nutri_id, hash_password, name,identity  FROM nutris WHERE email=%(email)s"    
        input_data = {'email': email}
        try:
            cursor.execute(query, input_data)
            result = cursor.fetchone()          
        except mysql.connector.Error as err:
            msg = err.msg
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return result #member existed
            else:
                return False #there is no this member     

    @staticmethod
    def retrieve_member_information(cnx,id,identity):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        if identity ==1:
            query = "SELECT member_id, name, email, height, weight, target, identity, initial FROM members WHERE member_id=%(id)s"
        elif identity == 2:
            query = "SELECT nutri_id, name, email, identity FROM nutris WHERE nutri_id=%(id)s"
        input_data = {'id': id}
        try:
            cursor.execute(query, input_data)
            result = cursor.fetchone()          
        except mysql.connector.Error as err:
            msg = err.msg
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return result 
 
    @staticmethod 
    def update_member_info(cnx,input,id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "UPDATE members SET gender = %(gender)s, height = %(height)s, weight=%(weight)s, habit=%(habit)s,target=%(target)s,age=%(age)s WHERE member_id=%(id)s" 
        input_data = {'gender':input["gender"],"height": round(input["height"],1), "weight": round(input["weight"],1), 
        'habit': input["habit"], 'target':input["target"],"age":input["age"],"id":id}
        try:
            cursor.execute(query, input_data)
            cnx.commit()
            result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:   
                return "error"
            elif result:
                return True   

    @staticmethod
    def change_initial_state(cnx,email):
        msg = None
        cursor = cnx.cnx.cursor()
        cursor.execute("USE {}".format('macroseat'))
        query = "UPDATE members SET initial = %(initial)s WHERE email=%(email)s" 
        input_data = {'initial': False,"email": email}
        try:
            cursor.execute(query, input_data)
            cnx.commit()
            result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:   
                return "error"
            elif result:
                return True   

class Food_connection():
    @staticmethod
    def insert_new_food(cnx,request_data,user_id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "INSERT INTO food VALUES (DEFAULT,%(member_id)s,%(food_name)s,%(protein)s,%(fat)s,%(carbs)s)"
        input_data = {'member_id': user_id, 'food_name': request_data["food_name"], 'protein': request_data["protein"], 'fat':request_data["fat"], 'carbs':request_data["carbs"]}
        try:
            cursor.execute(query, input_data)
            cnx.commit()
            result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return result 

    @staticmethod
    def delete_food(cnx,food_id,user_id):
        result, msg = None, None
        cursor = cnx.cursor(buffered=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "DELETE FROM food WHERE food_id = %(food_id)s AND member_id=%(member_id)s" 
        input_data = {'food_id':food_id,"member_id": user_id}
        try:
            cursor.execute(query, input_data)
            result = cursor.rowcount
            cnx.commit()
            if result!=1: #food doesn;t exist or doesn't belong to member
                result = False 
            else: 
                result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return True 
            elif not result:
                return False  

    @staticmethod
    def get_my_food_info(cnx,page,user_id):
        msg,food_data,nextPage,result = None,None,None,None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            query = ("SELECT food_id, food_name, protein, fat, carbs from "
            "food WHERE member_id = %(member_id)s ORDER BY food_id DESC LIMIT %(st)s, 11 ")
            cursor.execute(query,{"member_id":user_id,'st':int(page)*10})
            food_data = cursor.fetchall() #might be empty []   
            #check if next page
            try:
                next_item = food_data[10]
                nextPage = int(page)+1
            except:
                nextPage = None      
            result={
                    "nextPage":nextPage,
                    "data":food_data[:10] #return the first 10 data
                    }  
        except mysql.connector.Error as err:
            msg = err.msg      
        finally:
            cursor.close()
            cnx.close()   
            if msg:
                return "error"
            else:
                return result        

    @staticmethod            
    def get_public_food_info(cnx,keyword,page):
        msg,food_data, nextPage = None,None,None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            keyword_query = ("SELECT food_id, food_name, protein, fat, carbs from "
            "food WHERE MATCH(`food_name`) AGAINST( %(food)s IN NATURAL LANGUAGE MODE ) LIMIT %(st)s, 21 ") 
            cursor.execute(keyword_query,{"food":keyword,'st':int(page)*20})
            food_data = cursor.fetchall() #might be empty []  
            #check if next page
            try:
                next_item = food_data[20]
                nextPage = int(page)+1
            except:
                nextPage = None  
            result={
                    "nextPage":nextPage,
                    "data":food_data[:20],#return the first 20 data
                    }  
        except mysql.connector.Error as err:
            msg = err.msg      
        finally:
            cursor.close()
            #self.cnx.close()   
            if msg:
                return "error"
            else:
                return result   

class Plan_connection():

    @staticmethod
    def insert_new_diet_plan(cnx,request_data,user_id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "INSERT INTO plans VALUES (DEFAULT,%(create_at)s,%(member_id)s,%(protein)s,%(fat)s,%(carbs)s,%(plan_calories)s,%(plan_name)s)"
        input_data = {'member_id': user_id, 'create_at' : request_data["create_at"] ,'plan_name': request_data.get("plan_name") ,'plan_calories': request_data["plan_calories"], 'protein': request_data["protein"], 'fat':request_data["fat"], 'carbs':request_data["carbs"]}
        try:
            cursor.execute(query, input_data)
            cnx.commit()
            result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return result 

    @staticmethod
    def update_diet_info(cnx,input,user_id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "UPDATE plans SET plan_calories = %(plan_calories)s, protein = %(protein)s , fat = %(fat)s , carbs=%(carbs)s WHERE plan_id = %(plan_id)s AND member_id = %(member_id)s" 
        input_data = {'member_id': user_id, 'plan_calories':input["plan_calories"],'plan_id':input["plan_id"],"protein": input["protein"],"fat":input["fat"],"carbs":input["carbs"]}
        try:
            cursor.execute(query, input_data)
            count = cursor.rowcount
            cnx.commit()
            if count==0:
                result = False
            else:    
                result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:   
                return "error"
            elif result:
                return True   
            elif not result:
                return False    

    @staticmethod
    def delete_diet(cnx,plan_id,user_id):
        result, msg = None, None
        cursor = cnx.cursor(buffered=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "DELETE FROM plans WHERE plan_id = %(plan_id)s AND member_id=%(member_id)s" 
        input_data = {'plan_id':plan_id,"member_id": user_id}
        try:
            cursor.execute(query, input_data)
            result = cursor.rowcount
            cnx.commit()
            if result==0: #either plan doesn't exist or doesn't belong to member
                result = False 
            else: 
                result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:   
                return "error"
            elif result == True:
                return True  
            elif result == False:
                return False 

    @staticmethod
    def get_diet_info(cnx,page,user_id):
        msg,diet_data,nextPage,result = None,None,None,None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            query = ("SELECT plan_id, plan_name, plan_calories,protein, fat, carbs from "
            "plans WHERE member_id = %(member_id)s ORDER BY plan_id DESC LIMIT %(st)s, 11") #member_id foreign key is non-clustered index
            cursor.execute(query,{ "member_id" : user_id, 'st':int(page)*10 })
            diet_data = cursor.fetchall() #might be empty []    
            #check if next page
            try:
                next_item = diet_data[10]
                nextPage = int(page)+1
            except:
                nextPage = None  

            result={
                    "nextPage":nextPage,
                    "plans":diet_data[:10] #return the first 10 data 
                    }  
        except mysql.connector.Error as err:
            msg = err.msg      
        finally:
            cursor.close()
            #self.cnx.close()   
            if msg:
                return "error"
            else:
                return result        

class Record_connection():

    @staticmethod
    def insert_new_record(cnx,request_data,user_id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "INSERT INTO records VALUES (DEFAULT,%(create_at)s,%(member_id)s,%(protein)s,%(fat)s,%(carbs)s,%(plan_calories)s)"
        input_data = {'member_id': user_id, 'create_at' : request_data["create_at"] ,'plan_calories': request_data["plan_calories"], 'protein': request_data["protein"], 'fat':request_data["fat"], 'carbs':request_data["carbs"]}
        try:
            cursor.execute(query, input_data)
            cnx.commit()
            result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return True 

    @staticmethod
    def update_record(cnx,input,user_id): 
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query = "UPDATE records SET plan_calories = %(plan_calories)s, protein = %(protein)s , fat = %(fat)s , carbs=%(carbs)s WHERE record_id = %(record_id)s AND member_id = %(member_id)s" 
        input_data = {'member_id': user_id, 'record_id':input["record_id"],"protein": input["protein"],"fat":input["fat"],"carbs":input["carbs"], "plan_calories":input["plan_calories"]}
        try:
            cursor.execute(query, input_data)
            count = cursor.rowcount
            cnx.commit()
            if count==0:
                result = False
            else:    
                result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:    
                return "error"
            elif result:
                return True   
            elif not result:
                return False    
 
    @staticmethod
    def get_record_info(cnx,datetimestamp,user_id):
        msg,record = None,None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            query = ("SELECT s1.record_id, s1.plan_calories, s1.protein AS record_protein, s1.fat AS record_fat, s1.carbs AS record_carbs,"
            "s2.intake_id, s2.food_name, s2.protein, s2.fat, s2.carbs, s2.amount from records as s1"
            " left join intakes as s2 on s1.record_id = s2.record_id WHERE s1.member_id = %(member_id)s AND s1.create_at = %(time)s") #member_id foreign key is non-clustered index
            cursor.execute(query,{"member_id":user_id,"time":datetimestamp})
            record = cursor.fetchall() #might be none    
        except mysql.connector.Error as err:
            msg = err.msg      
        finally:
            cursor.close()
            #self.cnx.close()   
            if msg:
                return "error"
            else:
                return record 

class Diet_connection():
    
    @staticmethod
    def insert_new_diet(cnx,request_data,user_id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query1 = "SELECT member_id FROM records WHERE record_id = %(record_id)s"
        query2 = "INSERT INTO intakes VALUES (DEFAULT,%(record_id)s,%(food_name)s,%(protein)s,%(fat)s,%(carbs)s,%(amount)s)"
        query3 = "SELECT intake_id FROM intakes WHERE record_id = %(record_id)s ORDER BY intake_id DESC LIMIT 0,1"
        input_data = {'record_id': request_data["record_id"], 
                      'food_name' : request_data["food_name"] , 
                      'protein': request_data["protein"], 
                      'fat':request_data["fat"], 
                      'carbs':request_data["carbs"], 
                      'amount':request_data["amount"],
                      }
        try:
            cursor.execute(query1, {"record_id": request_data["record_id"]})
            confirm_id = cursor.fetchone()
            if not confirm_id or confirm_id["member_id"] != user_id: #表示該紀錄代號不存在或該紀錄代號不屬於此會員
                result = False
            else:
                cursor.execute(query2, input_data)
                cnx.commit()
                cursor.execute(query3, {"record_id": request_data["record_id"]})
                intake_id = cursor.fetchone()
                result = intake_id
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return result #return the newest intake_id
            else:
                return False    

    @staticmethod
    def delete_diet(cnx,intake_id,user_id,record_id): 
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query1 = "SELECT member_id FROM records WHERE record_id = %(record_id)s"
        query2 = "DELETE FROM intakes WHERE intake_id = %(intake_id)s AND record_id = %(record_id)s" 
        input_data = {'intake_id':intake_id, 'record_id':record_id}
        try:
            cursor.execute(query1, {"record_id":record_id})
            confirm_id = cursor.fetchone()
            if not confirm_id or confirm_id["member_id"] != user_id: #表示該紀錄代號不存在或該紀錄代號不屬於此會員
                result = False
            else:
                cursor.execute(query2, input_data)
                cnx.commit()
                result = cursor.rowcount
                if result!=1: #the intake doesn't exist or doesn't belong to member
                    result = False 
                else: 
                    result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:   
                return "error"
            elif result:
                return True  
            elif not result:
                return False     
 
    @staticmethod
    def get_diet_info(cnx,datetimestamp,user_id):
        msg,record = None,None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            query = ("SELECT s1.record_id,"
            "s2.food_name, s2.protein, s2.fat, s2.carbs, s2.amount from records as s1"
            " left join intakes as s2 on s1.record_id = s2.record_id WHERE s1.member_id = %(member_id)s AND s1.create_at = %(time)s") #member_id foreign key is non-clustered index
            cursor.execute(query,{"member_id":user_id,"time":datetimestamp})
            record = cursor.fetchall() #might be none    
        except mysql.connector.Error as err:
            msg = err.msg      
        finally:
            cursor.close()
            #self.cnx.close()   
            if msg:
                return "error"
            else:
                return record                 


class Weight_connection():

    @staticmethod
    def insert_new_weight(cnx,input,user_id):
        result, msg = None, None
        cursor = cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        query1 = "SELECT weight_id FROM weight WHERE member_id = %(member_id)s AND create_at = %(create_at)s"
        query2 = "INSERT INTO weight VALUES (DEFAULT,%(create_at)s,%(member_id)s,%(weight)s)"
        input_data = {'member_id': user_id, 'create_at':input['create_at'], 'weight':input["weight"]}
        try:
            #confirm if weight record a;ready existed
            cursor.execute(query1,{"member_id":user_id,"create_at":input['create_at']})
            result = cursor.fetchall()
            if len(result) != 0: #if existed then can't add 
                result = False
            else:    
                cursor.execute(query2, input_data)
                cnx.commit()
                result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return True  

    @staticmethod
    def update_weight(cnx,input,user_id): 
        result, msg = None, None
        cursor = cnx.cursor()
        cursor.execute("USE {}".format('macroseat'))
        query = "UPDATE weight SET weight = %(new_weight)s WHERE member_id = %(member_id)s AND create_at = %(create_at)s" 
        input_data = {'member_id': user_id, 'create_at':input["create_at"], "new_weight":input["new_weight"]}
        try:
            cursor.execute(query, input_data)
            count = cursor.rowcount
            cnx.commit()
            if count==0:
                result = False
            else:    
                result = True
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return True 
            elif not result:
                return False    
 
    @staticmethod
    def get_weight_info(cnx,start_date,end_date,user_id):
        msg,record = None,None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            query = ("SELECT create_at, weight "
            "from weight WHERE member_id = %(member_id)s AND (create_at BETWEEN %(start_date)s AND %(end_date)s) ORDER BY create_at")
            cursor.execute(query,{"member_id":user_id,"start_date":start_date,"end_date":end_date})
            record = cursor.fetchall() #might be none    
        except mysql.connector.Error as err:
            msg = err.msg      
        finally:
            cursor.close()
            #self.cnx.close()   
            if msg:
                return "error"
            else:
                return record    


class Notify_connection():

    @staticmethod
    def check_if_subscribe(cnx,identity,subcsription,id_):
        msg,result = None, None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            if identity == 1:
                cursor.execute("SELECT auth,p256dh,endpoint,expirationTime from service_user WHERE auth = %(auth)s",{"auth":subcsription["keys"]["auth"]})
            else:
                cursor.execute("SELECT auth,p256dh,endpoint,expirationTime from service_nutri WHERE auth = %(auth)s",{"auth":subcsription["keys"]["auth"]})    
            data = cursor.fetchone()
            if data:
                if data["p256dh"] == subcsription["keys"]["p256dh"] and data["endpoint"] == subcsription["endpoint"] and data["expirationTime"] == subcsription["expirationTime"]:
                    current_app.logger.info('User already subscribed!')
                    result = {
						"status": "success"
					}			
            else:
                insert_data = {
                    "id": id_,
					"auth" : subcsription["keys"]["auth"],
					"p256dh" : subcsription["keys"]["p256dh"],
					"endpoint" : subcsription["endpoint"],
					"expirationTime" : subcsription["expirationTime"]
				}
                if identity == 1:
                    cursor.execute("INSERT INTO service_user VALUES(%(auth)s,%(id)s,%(p256dh)s,%(endpoint)s,%(expirationTime)s)",insert_data)	
                    cnx.commit()
                else:
                    cursor.execute("INSERT INTO service_nutri VALUES(%(auth)s,%(id)s,%(p256dh)s,%(endpoint)s,%(expirationTime)s)",insert_data)	
                    cnx.commit()
                current_app.logger.info('User newly subscribed!')    
                result = {
						"status": "success"
					    }
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg:  
                return "error"
            elif result:
                return result 

    @staticmethod
    def get_subscription_info(cnx,id_,identity):
        msg,result = None, None
        cursor= cnx.cursor(dictionary=True)
        cursor.execute("USE {}".format('macroseat'))
        try:
            if identity == 1:
                cursor.execute("SELECT auth,p256dh,endpoint,expirationTime from service_user WHERE member_id= %(id)s",{"id":id_})
            else:
                cursor.execute("SELECT auth,p256dh,endpoint,expirationTime from service_nutri WHERE nutri_id = %(id)s",{"id":id_})    
            data = cursor.fetchall()
            if data:
                result = data		
        except mysql.connector.Error as err:
            msg = err.msg
            cnx.rollback()
        finally:
            cursor.close()
            #self.cnx.close()
            if msg: 
                return "error"
            elif result:
                return result
        



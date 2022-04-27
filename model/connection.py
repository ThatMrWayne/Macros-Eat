import mysql.connector


#base class
class Connection:
    def __init__(self,cnx):
        self.cnx = cnx

                 

class Auth_connection(Connection):
    def check_if_member_exist(self,email,identity):
        result,msg=None,None
        cursor = self.cnx.cursor(dictionary=True)
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
            self.cnx.close()
            if msg:
                return "error"
            elif result:
                return True
            else:
                return False

    def insert_new_member(self,name,email,hash_password,identity,date):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        if identity==1:
            query = "INSERT INTO members VALUES (DEFAULT,%(name)s,%(email)s,%(password)s,%(date)s,null,null,null,null,null,null,true,%(identity)s)"
            input_data = {'date':date,'name': name, 'email': email, 'password': hash_password,'identity':identity}
        elif identity==2:
            query = "INSERT INTO nutris VALUES (DEFAULT,%(name)s,%(email)s,%(password)s,%(identity)s)"
            input_data = {'name': name, 'email': email, 'password': hash_password,'identity':identity}
        try:
            cursor.execute(query, input_data)
            self.cnx.commit()
            result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #新增會員失敗  
                return "error"
            elif result:
                return True #新增會員成功


    def confirm_member_information(self,email,identity):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        if identity==1:
            query = "SELECT member_id, hash_password, name, initial, identity FROM members WHERE email=%(email)s"
        elif identity==2:
            query = "SELECT nutri_id, hash_password, name,identity  FROM nutris WHERE email=%(email)s"    
        input_data = {'email': email}
        try:
            cursor.execute(query, input_data)
            result = cursor.fetchone()          
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #查詢失敗
                return "error"
            elif result:
                return result #有此會員
            else:
                return False #根本沒有這個會員      

    def retrieve_member_information(self,id,identity):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        #2022/4/8: members要加一欄idendity,要另外加一個新表:營養師
        if identity ==1:
            query = "SELECT member_id, name, email, height, weight, target, identity, initial FROM members WHERE member_id=%(id)s"
        elif identity == 2:
            query = "SELECT nutri_id, name, email, identity FROM nutris WHERE nutri_id=%(id)s"

        input_data = {'id': id}
        try:
            cursor.execute(query, input_data)
            result = cursor.fetchone()          
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #查詢失敗
                return "error"
            elif result:
                return result #查詢成功
 
    def update_member_info(self,input,id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query = "UPDATE members SET gender = %(gender)s, height = %(height)s, weight=%(weight)s, habit=%(habit)s,target=%(target)s,age=%(age)s WHERE member_id=%(id)s" 
        input_data = {'gender':input["gender"],"height": round(input["height"],1), "weight": round(input["weight"],1), 
        'habit': input["habit"], 'target':input["target"],"age":input["age"],"id":id}
        try:
            cursor.execute(query, input_data)
            self.cnx.commit()
            result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #更新會員資料失敗  
                return "error"
            elif result:
                return True #更新會員資料成功  

    def change_initial_state(self,email):
        msg = None
        cursor = self.cnx.cursor()
        query = "UPDATE members SET initial = %(initial)s WHERE email=%(email)s" 
        input_data = {'initial': False,"email": email}
        try:
            cursor.execute(query, input_data)
            self.cnx.commit()
            result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #更新intial失敗  
                return "error"
            elif result:
                return True #更新intial成功   

class Food_connection(Connection):
    def insert_new_food(self,request_data,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query = "INSERT INTO food VALUES (DEFAULT,%(member_id)s,%(food_name)s,%(protein)s,%(fat)s,%(carbs)s)"
        input_data = {'member_id': user_id, 'food_name': request_data["food_name"], 'protein': request_data["protein"], 'fat':request_data["fat"], 'carbs':request_data["carbs"]}
        try:
            cursor.execute(query, input_data)
            self.cnx.commit()
            result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #新增食物失敗
                return "error"
            elif result:
                return True #新增食物成功

    def delete_food(self,food_id,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(buffered=True)
        query = "DELETE FROM food WHERE food_id = %(food_id)s AND member_id=%(member_id)s" 
        input_data = {'food_id':food_id,"member_id": user_id}
        try:
            cursor.execute(query, input_data)
            result = cursor.rowcount
            print(result)
            self.cnx.commit()
            if result!=1: #要馬食物不存在或該食物不屬於會員
                result = False 
            else: #可以刪除
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #刪除食物資料失敗  
                return "error"
            elif result:
                return True #刪除食物資料成功  
            elif not result:
                return False  #刪除食物資料失敗

    def get_my_food_info(self,page,user_id):
        msg,food_data,nextPage = None,None,None
        cursor= self.cnx.cursor(dictionary=True)
        try:
            query = ("SELECT food_id, food_name, protein, fat, carbs from "
            "food WHERE member_id = %(member_id)s ORDER BY food_id LIMIT %(st)s, 11 ")
            cursor.execute(query,{"member_id":user_id,'st':int(page)*10})
            food_data = cursor.fetchall() #可能是空的[]   
            #查看有沒有下一頁
            try:
                next_item = food_data[10]
                nextPage = int(page)+1
            except:
                nextPage = None      

            result={
                    "nextPage":nextPage,
                    "data":food_data[:10] #回傳前10筆就好
                    }  
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg      
        finally:
            cursor.close()
            self.cnx.close()   
            if msg:
                return "error"
            else:
                return result        
                
    def get_public_food_info(self,keyword):
        msg,food_data = None,None
        cursor= self.cnx.cursor(dictionary=True)
        try:
            keyword_query = ("SELECT food_id, food_name, protein, fat, carbs from "
            "food WHERE MATCH(`food_name`) AGAINST( %(food)s IN NATURAL LANGUAGE MODE )") 
            cursor.execute(keyword_query,{"food":keyword})
            food_data = cursor.fetchall() #可能是空的[]
   
            result={
                    "data":food_data
                    }  
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg      
        finally:
            cursor.close()
            self.cnx.close()   
            if msg:
                return "error"
            else:
                return result   

class Plan_connection(Connection):
    def insert_new_diet_plan(self,request_data,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query = "INSERT INTO plans VALUES (DEFAULT,%(create_at)s,%(member_id)s,%(protein)s,%(fat)s,%(carbs)s,%(plan_calories)s,%(plan_name)s)"
        input_data = {'member_id': user_id, 'create_at' : request_data["create_at"] ,'plan_name': request_data.get("plan_name") ,'plan_calories': request_data["plan_calories"], 'protein': request_data["protein"], 'fat':request_data["fat"], 'carbs':request_data["carbs"]}
        try:
            cursor.execute(query, input_data)
            self.cnx.commit()
            result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #新增飲食計畫失敗
                return "error"
            elif result:
                return True #新增飲食計畫成功

    def update_diet_info(self,input,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query = "UPDATE plans SET plan_calories = %(plan_calories)s, protein = %(protein)s , fat = %(fat)s , carbs=%(carbs)s WHERE plan_id = %(plan_id)s AND member_id = %(member_id)s" 
        input_data = {'member_id': user_id, 'plan_calories':input["plan_calories"],'plan_id':input["plan_id"],"protein": input["protein"],"fat":input["fat"],"carbs":input["carbs"]}
        try:
            cursor.execute(query, input_data)
            count = cursor.rowcount
            self.cnx.commit()
            if count==0:
                result = False
            else:    
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #更新飲食計畫失敗  
                return "error"
            elif result:
                return True #更新飲食計畫成功  
            elif not result:
                return False    

    def delete_diet(self,plan_id,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(buffered=True)
        query = "DELETE FROM plans WHERE plan_id = %(plan_id)s AND member_id=%(member_id)s" 
        input_data = {'plan_id':plan_id,"member_id": user_id}
        try:
            cursor.execute(query, input_data)
            result = cursor.rowcount
            self.cnx.commit()
            if result==0: #要馬飲食計畫不存在或該飲食計畫不屬於會員
                result = False 
            else: #可以刪除
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #刪除飲食計畫失敗  
                return "error"
            elif result == True:
                return True #刪除飲食計畫成功  
            elif result == False:
                return False  #刪除飲食計畫失敗

    def get_diet_info(self,user_id):
        msg,diet_data = None,None
        cursor= self.cnx.cursor(dictionary=True)
        try:
            query = ("SELECT plan_id, plan_name, plan_calories,protein, fat, carbs from "
            "plans WHERE member_id = %(member_id)s") #member_id foreign key is non-clustered index
            cursor.execute(query,{"member_id":user_id})
            diet_data = cursor.fetchall() #可能是空的[]    
            result={
                    "plans":diet_data 
                    }  
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg      
        finally:
            cursor.close()
            self.cnx.close()   
            if msg:
                return "error"
            else:
                return result        

class Record_connection(Connection):
    def insert_new_record(self,request_data,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query = "INSERT INTO records VALUES (DEFAULT,%(create_at)s,%(member_id)s,%(protein)s,%(fat)s,%(carbs)s,%(plan_calories)s)"
        input_data = {'member_id': user_id, 'create_at' : request_data["create_at"] ,'plan_calories': request_data["plan_calories"], 'protein': request_data["protein"], 'fat':request_data["fat"], 'carbs':request_data["carbs"]}
        try:
            cursor.execute(query, input_data)
            self.cnx.commit()
            result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #新增紀錄失敗
                return "error"
            elif result:
                return True #新增紀錄成功

    def update_record(self,input,user_id): 
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query = "UPDATE records SET plan_calories = %(plan_calories)s, protein = %(protein)s , fat = %(fat)s , carbs=%(carbs)s WHERE member_id = %(member_id)s AND create_at = %(create_at)s" 
        input_data = {'member_id': user_id, 'create_at':input["create_at"],"protein": input["protein"],"fat":input["fat"],"carbs":input["carbs"], "plan_calories":input["plan_calories"]}
        try:
            cursor.execute(query, input_data)
            count = cursor.rowcount
            self.cnx.commit()
            if count==0:
                result = False
            else:    
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #更新紀錄失敗  
                return "error"
            elif result:
                return True #更新紀錄成功  
            elif not result:
                return False    
 
    def get_record_info(self,datetimestamp,user_id):
        msg,record = None,None
        cursor= self.cnx.cursor(dictionary=True)
        try:
            query = ("SELECT s1.record_id, s1.plan_calories, s1.protein AS record_protein, s1.fat AS record_fat, s1.carbs AS record_carbs,"
            "s2.intake_id, s2.food_name, s2.protein, s2.fat, s2.carbs, s2.amount from records as s1"
            " left join intakes as s2 on s1.record_id = s2.record_id WHERE s1.member_id = %(member_id)s AND s1.create_at = %(time)s") #member_id foreign key is non-clustered index
            cursor.execute(query,{"member_id":user_id,"time":datetimestamp})
            record = cursor.fetchall() #可能是none    
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg      
        finally:
            cursor.close()
            self.cnx.close()   
            if msg:
                return "error"
            else:
                return record 

class Diet_connection(Connection):
    def insert_new_diet(self,request_data,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query1 = "SELECT member_id FROM records WHERE record_id = %(record_id)s"
        query2 = "INSERT INTO intakes VALUES (DEFAULT,%(record_id)s,%(food_name)s,%(protein)s,%(fat)s,%(carbs)s,%(amount)s,%(member_id)s)"
        input_data = {'record_id': request_data["record_id"], 
                      'food_name' : request_data["food_name"] , 
                      'protein': request_data["protein"], 
                      'fat':request_data["fat"], 
                      'carbs':request_data["carbs"], 
                      'amount':request_data["amount"],
                      'member_id': user_id
                      }
        try:
            cursor.execute(query1, {"record_id": request_data["record_id"]})
            confirm_id = cursor.fetchone()
            if not confirm_id or confirm_id["member_id"] != user_id: #表示該紀錄代號不存在或該紀錄代號不屬於此會員
                result = False
            else:
                cursor.execute(query2, input_data)
                self.cnx.commit()
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #新增飲食失敗
                return "error"
            elif result:
                return True #新增飲食成功
            else:
                return False    

    def delete_diet(self,intake_id,user_id): 
        result, msg = None, None
        cursor = self.cnx.cursor()
        query = "DELETE FROM intakes WHERE intake_id = %(intake_id)s AND member_id = %(member_id)s" 
        input_data = {'intake_id':intake_id, 'member_id':user_id}
        try:
            cursor.execute(query, input_data)
            result = cursor.rowcount
            print(result)
            self.cnx.commit()
            if result!=1: #飲食紀錄不存在或飲食紀錄不屬於該會員
                result = False 
            else: #可以刪除
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #刪除飲食資料失敗  
                return "error"
            elif result:
                return True #刪除飲食資料成功  
            elif not result:
                return False  #刪除飲食資料失敗    
 
    def get_diet_info(self,datetimestamp,user_id):
        msg,record = None,None
        cursor= self.cnx.cursor(dictionary=True)
        try:
            query = ("SELECT s1.record_id,"
            "s2.food_name, s2.protein, s2.fat, s2.carbs, s2.amount from records as s1"
            " left join intakes as s2 on s1.record_id = s2.record_id WHERE s1.member_id = %(member_id)s AND s1.create_at = %(time)s") #member_id foreign key is non-clustered index
            cursor.execute(query,{"member_id":user_id,"time":datetimestamp})
            record = cursor.fetchall() #可能是none    
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg      
        finally:
            cursor.close()
            self.cnx.close()   
            if msg:
                return "error"
            else:
                return record                 

class Weight_connection(Connection):
    def insert_new_weight(self,input,user_id):
        result, msg = None, None
        cursor = self.cnx.cursor(dictionary=True)
        query1 = "SELECT weight_id FROM weight WHERE member_id = %(member_id)s AND create_at = %(create_at)s"
        query2 = "INSERT INTO weight VALUES (DEFAULT,%(create_at)s,%(member_id)s,%(weight)s)"
        input_data = {'member_id': user_id, 'create_at':input['create_at'], 'weight':input["weight"]}
        try:
            #先確認該日有無體重紀錄
            cursor.execute(query1,{"member_id":user_id,"create_at":input['create_at']})
            result = cursor.fetchall()
            if len(result) != 0: #如果已經有就不能新增
                result = False
            else:    
                cursor.execute(query2, input_data)
                self.cnx.commit()
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #新增體重失敗
                return "error"
            elif result:
                return True #新增體重成功  

    def update_weight(self,input,user_id): 
        result, msg = None, None
        cursor = self.cnx.cursor()
        query = "UPDATE weight SET weight = %(new_weight)s WHERE member_id = %(member_id)s AND create_at = %(create_at)s" 
        input_data = {'member_id': user_id, 'create_at':input["create_at"], "new_weight":input["new_weight"]}
        try:
            cursor.execute(query, input_data)
            count = cursor.rowcount
            self.cnx.commit()
            if count==0:
                result = False
            else:    
                result = True
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg
            self.cnx.rollback()
        finally:
            cursor.close()
            self.cnx.close()
            if msg:  #更新體重失敗  
                return "error"
            elif result:
                return True #更新體重成功  
            elif not result:
                return False    
 
    def get_weight_info(self,start_date,end_date,user_id):
        msg,record = None,None
        cursor= self.cnx.cursor(dictionary=True)
        try:
            query = ("SELECT create_at, weight "
            "from weight WHERE member_id = %(member_id)s AND (create_at BETWEEN %(start_date)s AND %(end_date)s) ORDER BY create_at")
            cursor.execute(query,{"member_id":user_id,"start_date":start_date,"end_date":end_date})
            record = cursor.fetchall() #可能是none    
        except mysql.connector.Error as err:
            print(err)
            msg = err.msg      
        finally:
            cursor.close()
            self.cnx.close()   
            if msg:
                return "error"
            else:
                return record                  
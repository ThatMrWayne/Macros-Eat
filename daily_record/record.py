import time
import json
from datetime import datetime
from flask import request
from flask import Blueprint
from flask import jsonify 
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import db
from model import redis_db
from utils import Utils_obj
from flask import current_app
from model import Record_connection



record = Blueprint('record', __name__,static_folder='static',static_url_path='/record')


#decorator for /api/reocrds route
def jwt_required_for_record():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except:
                print('access_token已失效 或 request根本沒有JWT')
                return jsonify({"error":True,"message":"拒絕存取"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper




def verify_record_info(input):
    result=True
    if (type(input["protein"]) != int ) or (input["protein"]<0): #%
        result = False
    elif (type(input["fat"]) != int ) or (input["fat"]<0): #%
        result = False
    elif (type(input["carbs"]) != int ) or (input["carbs"]<0): #%
        result = False   
    elif (type(input["plan_calories"]) != int ) or (input["plan_calories"]<0):
        result = False             
    elif  input["protein"]+input["fat"]+input["carbs"]!=100:
        result = False 
    elif (type(input["record_id"]) != int):
        result = False       
    return result     


def verify_add_record_info(input):
    result=True
    if (type(input["protein"]) != int ) or (input["protein"]<0): #%
        result = False
    elif (type(input["fat"]) != int ) or (input["fat"]<0): #%
        result = False
    elif (type(input["carbs"]) != int ) or (input["carbs"]<0): #%
        result = False   
    elif (type(input["plan_calories"]) != int ) or (input["plan_calories"]<0):
        result = False             
    elif  input["protein"]+input["fat"]+input["carbs"]!=100:
        result = False     
    return result 


def organize_record_data(data):
    first_row = data[0]
    result={
        "day_record":{
            "record_id": first_row["record_id"],
            "plan_calories": first_row["plan_calories"],
            "protein": first_row["record_protein"], #%
            "fat": first_row["record_fat"], #%
            "carbs": first_row["record_carbs"] #%
        },
        "food_record":None,
    }
    if first_row["food_name"]: #代表有飲食紀錄
        result["food_record"]=[]
        for row in data:
            temp = {
                "intake_id": row["intake_id"],
                "food_name": row["food_name"],
                "protein": row["protein"], #g
                "fat": row["fat"], #g
                "carbs": row["carbs"], #g
                "amount": row["amount"] #g
            }
            result["food_record"].append(temp)
    return result    

    




def handle_add_record(request):
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗,沒有json檔"}
            return jsonify(response_msg), 400 
        labels = ["create_at","plan_calories","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗,新增資料不齊全"}
            return jsonify(response_msg), 400 
        verify_result = verify_add_record_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"新增紀錄失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 
        connection = db.get_cnx() 
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = Record_connection.insert_new_record(connection,request_data,user_id)
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True:  #insert successfully, clear corresponded cache
                timestamp = request_data["create_at"]
                redis_key = f'get_my_record{user_id}'
                redis_db.redis_instance.hdel(redis_key,str(timestamp))
                response_msg={"ok": True}
                return jsonify(response_msg), 201 
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500       


#(day record + intake record)
def handle_get_record(datetimestamp,user_id):
    connection = db.get_cnx()  
    if connection != "error":
        data = Record_connection.get_record_info(connection,datetimestamp,user_id)
        if data == "error":
            response_msg={
                          "error":True,
                          "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else:  
            if not data: #there is no record
                return jsonify({"day_record":None,"food_record":None}), 200
            else: #there is record with/without intake record
                result = organize_record_data(data)
                return jsonify(result), 200                      
    else:
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500    
            

def handle_update_record(request):
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        labels = ["record_id","plan_calories","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗,更新資料不完整"}
            return jsonify(response_msg), 400
        verify_result = verify_record_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"更新失敗,更新資料不正確"}  
            return jsonify(response_msg), 400
        connection = db.get_cnx()  
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = Record_connection.update_record(connection,input,user_id)
            if result == "error": 
                response_msg={
                              "error":True,
                              "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: #update successfully, clear corresponded cache
                timestamp = request_data["create_at"]
                redis_key = f'get_my_record{user_id}'
                redis_db.redis_instance.hdel(redis_key,str(timestamp))
                response_msg={ "ok":True }
                return jsonify(response_msg), 200
            else:
                response_msg={
                            "error":True,
                            "message":"該日紀錄不存在"}  
                return jsonify(response_msg), 400    
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500     
    





@record.route('/api/records', methods=["GET","POST","PATCH"])
@jwt_required_for_record()
def records():
    if request.method == "POST": 
        add_record_result = handle_add_record(request)
        return add_record_result
    elif request.method == "PATCH": 
        update_record_result = handle_update_record(request)
        return update_record_result
    elif request.method == "GET": 
        datetimestamp = request.args.get('datetime')
        if not datetimestamp or not datetimestamp.isdigit():
            return jsonify({
                            "error": True,
                            "message": "未提供日期或時間戳錯誤"
                            }), 400   
        else:
            user_id = Utils_obj.get_member_id_from_jwt(request)                    
            redis_key = f'get_my_record{user_id}' # e.g => get_my_record18
            high = datetime.now().timestamp()
            low = int(high - (86400*7))
            if low <= int(datetimestamp)/1000 <= high: #only within 7 days in cache
                try:
                    start = time.perf_counter()
                    r = redis_db.redis_instance.hget(redis_key,str(datetimestamp))
                    if r: #if there is data in redis
                        data = json.loads(r)
                        result = jsonify(data), 200  
                        end_a = time.perf_counter()
                        current_app.logger.info(f"record cache hits!=>time consuming:{end_a-start} s")
                    else:  #if not in redis , get from mysql and then put in redis 
                        result = handle_get_record(datetimestamp,user_id)
                        if result[0].status_code == 200: #如果result成功,才存入redis
                            data = {str(datetimestamp) : result[0].get_data()} #result[0].get_data()已是byte string
                            redis_db.redis_instance.hset(redis_key, mapping = data)
                            current_app.celery.send_task('task.delmyrecordCache',args=[redis_key,datetimestamp],countdown=600) 
                            end_b = time.perf_counter()
                            current_app.logger.info(f"record cache miss!=>time consuming:{end_b-start} s")                            
                except: #if redis is down, get from mysql 
                    result = handle_get_record(datetimestamp,user_id) 
            else:
                current_app.logger.info(f"get record without cache.")       
                result = handle_get_record(datetimestamp,user_id)
            return result
        
        
        

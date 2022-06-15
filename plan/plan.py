import time
import json
import datetime
from flask import request
from flask import Blueprint
from flask import make_response
from flask import jsonify 
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import db
from model import redis_db
from utils import Utils_obj
from flask import current_app
from model import Plan_connection



plan = Blueprint('plan',__name__,static_folder='static',static_url_path='/plan')

#decorator for /api/diet-plans route
def jwt_required_for_plan():
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



def verify_diet_info(input):
    result=True
    if (type(input["protein"]) != int ) or (input["protein"]<0):
        result = False
    elif (type(input["fat"]) != int ) or (input["fat"]<0):
        result = False
    elif (type(input["carbs"]) != int ) or (input["carbs"]<0):
        result = False   
    elif (type(input["plan_calories"]) != int ) or (input["plan_calories"]<0):
        result = False             
    elif  input["protein"]+input["fat"]+input["carbs"]!=100:
        result = False   
    elif (type(input["create_at"])!= int ):
        result = False     
    return result     






def handle_add_diet_plan():
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"新增飲食計畫失敗"}
            return jsonify(response_msg), 400
        labels = ["create_at","plan_calories","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增飲食計畫失敗"}
            return jsonify(response_msg), 400 
        verify_result = verify_diet_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"新增飲食計畫失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 
        connection = db.get_cnx()  
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt()
             #轉成台灣時區
            gmtTimeDelta = datetime.timedelta(hours=8)
            gmtTZObject = datetime.timezone(gmtTimeDelta,name="GMT")
            d = datetime.datetime.fromtimestamp(request_data["create_at"]).astimezone(gmtTZObject)
            s = d.strftime("%Y/%m/%d %H:%M:%S")
            plan_name = "saved plan at " + s
            request_data["plan_name"] = plan_name
            result = Plan_connection.insert_new_diet_plan(connection,request_data,user_id)
            if result == "error": #
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result: #update successfullt,clear corresponded cache
                redis_key = f'get_my_plan{user_id}'
                redis_db.redis_instance.delete(redis_key)
                response_msg={"ok": True} #"plan_id": result["plan_id"], "plan_name": result["plan_name"]}
                return jsonify(response_msg), 201  
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    
def handle_delete_diet_plan():
        plan_id = request.args.get("plan_id")
        if not plan_id:
            response_msg={
                          "error":True,
                          "message":"刪除失敗,沒有給plan id"}
            return jsonify(response_msg), 400 
        connection = db.get_cnx()    
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt()
            result = Plan_connection.delete_diet(connection,plan_id,user_id) 
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #delete successfully,clear out corresponded cache
                    redis_key = f'get_my_plan{user_id}'
                    redis_db.redis_instance.delete(redis_key)
                    response_msg={ "ok": True }
                    return jsonify(response_msg), 204 
            else:
                response_msg={
                            "error":True,
                            "message":"plan_id不屬於此會員或此plan_id不存在"}
                return jsonify(response_msg), 400                  
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}              
            return jsonify(response_msg), 500       
def handle_update_diet_plan():
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        labels = ["plan_id","plan_calories","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        verify_result = verify_diet_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"更新資料錯誤"}  
            return jsonify(response_msg), 400
        connection = db.get_cnx() 
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt()
            result = Plan_connection.update_diet_info(connection,input,user_id)
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: 
                response_msg={ "ok":True }
                return jsonify(response_msg), 200
            else:
                response_msg={
                            "error":True,
                            "message":"plan_id不屬於此會員或此plan_id不存在"}  
                return jsonify(response_msg), 400     
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500  
def handle_get_diet_plans(page,user_id):
    connection = db.get_cnx()    
    if connection != "error":          
        data = Plan_connection.get_diet_info(connection,page,user_id)
        if data == "error":
            response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else:   
            return jsonify(data), 200                        
    else:
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500 







@plan.route('/api/plans', methods=["GET","POST","DELETE"])
@jwt_required_for_plan()
def plans():
    if request.method == "POST": 
        add_diet_plan_result = handle_add_diet_plan()
        return add_diet_plan_result
    elif request.method == "DELETE": 
        delete_diet_result = handle_delete_diet_plan()
        return delete_diet_result
    elif request.method == "GET": 
        page = request.args.get('page')
        if not page or not page.isdigit():
            response_msg={
                        "nextPage":None,
                        "data":[]}
            result=make_response(response_msg,200)  
        elif page.isdigit(): 
            user_id = Utils_obj.get_member_id_from_jwt()
            redis_key = f'get_my_plan{user_id}' # e.g => get_my_plan18
            try:
                start = time.perf_counter()
                r = redis_db.redis_instance.hget(redis_key,str(page))
                if r: 
                    data = json.loads(r)
                    result = jsonify(data), 200  
                    end_a = time.perf_counter()
                    current_app.logger.info(f"plan cache hits!=>time consuming:{end_a-start} s")
                else:  
                    result = handle_get_diet_plans(page,user_id)
                    if result[0].status_code == 200: 
                        data = result[0].get_data() #result[0].get_data() is byte string
                        redis_db.redis_instance.hset(redis_key,str(page), data)
                        current_app.logger.info("task sended!")
                        current_app.celery.send_task('task.delmyplanCache',args=[redis_key,page],countdown=600)
                        end_b = time.perf_counter()      
                        current_app.logger.info(f"plan cache miss!=>time consuming:{end_b-start} s")                             
            except: 
                result = handle_get_diet_plans(page,user_id) 
        return result





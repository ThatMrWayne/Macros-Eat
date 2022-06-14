import time
import json
from flask import request
from flask import Blueprint
from flask import make_response
from flask import jsonify 
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import db
from model import redis_db
#from model.connection import Connection
from utils import Utils_obj
from flask import current_app
from model import Food_connection



food = Blueprint('food', __name__,static_folder='static',static_url_path='/food')


#decorator for /api/my-food route
def jwt_required_for_food():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except:
                print('access_token已失效 或 request根本沒有JWT')
                return jsonify( { "error" : True , "message" : "拒絕存取" } ), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def verify_food_info(input):
    result=True
    if (type(input["protein"]) not in [float,int]) or (input["protein"]<0):
        result = False
    elif (type(input["fat"]) not in [float,int]) or (input["fat"]<0):
        result = False
    elif (type(input["carbs"]) not in [float,int]) or (input["carbs"]<0):
        result = False 
    elif (type(input["food_name"])!= str):
        result = False    
    return result     


def handle_add_food(request):
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"新增食物失敗"}
            return jsonify(response_msg), 400 
        labels = ["food_name","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增食物失敗"}
            return jsonify(response_msg), 400 
        verify_result = verify_food_info(input)
        if verify_result == False:
            response_msg={
                          "error":True,
                          "message":"新增資料有誤"}  
            return jsonify(response_msg), 400 
        connection = db.get_food_cnx() 
        #if isinstance(connection,Connection): 
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = Food_connection.insert_new_food(connection,request_data,user_id)
            connection.close()
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"伺服器內部錯誤，新增失敗"}
                return jsonify(response_msg), 500
            elif result: #add successfully,clear corresponded cache
                redis_key = f'get_my_food{user_id}'
                redis_db.redis_instance.delete(redis_key)
                response_msg={"ok": True}
                return jsonify(response_msg), 201 
        #elif connection == "error": 
        else:    
            response_msg={
                        "error":True,
                        "message":"伺服器內部錯誤，新增失敗"}          
            return jsonify(response_msg), 500    
def handle_delete_food(request):
        food_id = request.args.get("food_id")
        if not food_id:
            response_msg={
                          "error":True,
                          "message":"刪除失敗,沒有給food id"}
            return jsonify(response_msg), 400 
        connection = db.get_food_cnx()   
        #if isinstance(connection,Connection): 
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = Food_connection.delete_food(connection,food_id,user_id) 
            connection.close()
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"伺服器內部錯誤，資料刪除失敗"}
                return jsonify(response_msg), 500 
            elif result: #delete successfully, clear corresponded cache
                    redis_key = f'get_my_food{user_id}'
                    redis_db.redis_instance.delete(redis_key)
                    response_msg={ "ok": True }
                    return jsonify(response_msg), 204
            else:
                response_msg={
                            "error":True,
                            "message":"food_id不屬於此會員或此food_id不存在"}
                return jsonify(response_msg), 400                 
        #elif connection == "error": 
        else:
            response_msg={
                        "error":True,
                        "message":"伺服器內部錯誤，資料刪除失敗"}              
            return jsonify(response_msg), 500    
def handle_get_my_food_data(page,user_id):
    connection = db.get_food_cnx() 
    #if isinstance(connection,Connection):   
    if connection != "error":           
        data = Food_connection.get_my_food_info(connection,page,user_id) 
        connection.close()
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"伺服器內部錯誤，資料取得失敗"}
            return jsonify(response_msg), 500          
        else:
            return jsonify(data), 200                       
    #elif connection == "error":  
    else:
        response_msg={
                "error":True,
                "message":"伺服器內部錯誤，資料取得失敗"}
        return jsonify(response_msg), 500    
def handle_get_public_food_data(request):
    connection = db.get_food_cnx() 
    #if isinstance(connection,Connection): 
    if connection != "error":  
        page = request.args.get('page')
        keyword = request.args.get('keyword')  
        if not keyword or not page:
            return jsonify({"data":[],"nextPage":None}), 200         
        data = Food_connection.get_public_food_info(connection,keyword,page)
        connection.close()
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"伺服器內部錯誤，資料取得失敗"}
            return jsonify(response_msg), 500          
        else:  
            return jsonify(data), 200                      
    #elif connection == "error": 
    else:
        response_msg={
                "error":True,
                "message":"伺服器內部錯誤，資料取得失敗"}
        return jsonify(response_msg), 500    
            





@food.route('/api/my-food', methods=["GET","POST","PATCH","DELETE"])
@jwt_required_for_food()
def foods():
    if request.method == "POST": 
        add_food_result = handle_add_food(request)
        return add_food_result
    elif request.method == "DELETE": 
        delete_food_result = handle_delete_food(request)
        return delete_food_result
    elif request.method == "GET": 
        page = request.args.get('page')
        if not page or not page.isdigit():
            response_msg={
                        "nextPage":None,
                        "data":[]}
            result = make_response(response_msg,200)  
        elif page.isdigit(): 
            user_id = Utils_obj.get_member_id_from_jwt(request) #get_my_food{user_id} as cache key
            redis_key = f'get_my_food{user_id}' # e.g => get_my_food18
            try:
                start = time.perf_counter()
                r = redis_db.redis_instance.hget(redis_key,str(page))
                if r: #if in redis 
                    data = json.loads(r)
                    result = jsonify(data), 200  
                    end_a = time.perf_counter()
                    current_app.logger.info(f"food cache hits!=>time consuming:{end_a-start} s")
                else:  #get from mysql and save in redis
                    result = handle_get_my_food_data(page,user_id)
                    if result[0].status_code == 200: #if result,then save in redis
                        data = result[0].get_data() #result[0].get_data() is byte string
                        redis_db.redis_instance.hset(redis_key,str(page), data)
                        current_app.logger.info("task sended!")
                        current_app.celery.send_task('task.delmyfoodCache',args=[redis_key,page],countdown=600) 
                        end_b = time.perf_counter()      
                        current_app.logger.info(f"food cache miss!=>time consuming:{end_b-start} s")                      
            except: #if redis is down, get from mysql
                result = handle_get_my_food_data(page,user_id)  
        return result            




 
@food.route('/api/public-food', methods=["GET"])
@jwt_required_for_food()
def public_food():
    get_food_result = handle_get_public_food_data(request)
    return get_food_result




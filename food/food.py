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
from model.connection import Connection
from utils import Utils_obj
from cache import cache
from flask import current_app
#from celery_factory.celery_tasks import del_myfood_cache



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
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"新增食物失敗"}
            return jsonify(response_msg), 400 #api test ok
        labels = ["food_name","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        #如果有傳json檔,但裡面根本沒有需要的更新資料
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增食物失敗"}
            return jsonify(response_msg), 400 #api test ok
        #後端也要驗證正不正確 防止有人不是從瀏覽器
        verify_result = verify_food_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"新增食物失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 #api test ok
        #取得連線物件
        connection = db.get_food_cnx() #取得食物倉庫相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.insert_new_food(request_data,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result: #如果成功新增食物,要把cache對應資料刪掉
                redis_key = f'get_my_food{user_id}'
                redis_db.redis_instance.delete(redis_key)
                response_msg={"ok": True,"food_id":result["food_id"]}
                return jsonify(response_msg), 201 #api test ok
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    
def handle_delete_food(request):
        food_id = request.args.get("food_id")
        if not food_id:
            response_msg={
                          "error":True,
                          "message":"刪除失敗,沒有給food id"}
            return jsonify(response_msg), 400 #api test ok
        connection = db.get_food_cnx()    #取得食物倉庫相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.delete_food(food_id,user_id) 
            if result == "error": #代表刪除食物資料失敗
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #表示刪除食物資料成功,要把cache對應資料刪掉
                    redis_key = f'get_my_food{user_id}'
                    redis_db.redis_instance.delete(redis_key)
                    response_msg={ "ok": True }
                    return jsonify(response_msg), 204 #api test ok
            else:
                response_msg={
                            "error":True,
                            "message":"food_id不屬於此會員或此food_id不存在"}
                return jsonify(response_msg), 400 #api test ok                
        elif connection == "error": #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}              
            return jsonify(response_msg), 500    
def handle_get_my_food_data(page,user_id):
    connection = db.get_food_cnx() #取得景點相關操作的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線          
        data = connection.get_my_food_info(page,user_id) 
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else:
            return jsonify(data), 200                       
    elif connection == "error":  #如果沒有順利取得連線
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500    
def handle_get_public_food_data(request):
    connection = db.get_food_cnx() #取得景點相關操作的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線
        keyword = request.args.get('keyword')  
        if not keyword:
            current_app.logger.info("沒有keyword")
            return jsonify({"data":[]}), 200         
        data = connection.get_public_food_info(keyword)
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else:  
            return jsonify(data), 200           #api test ok             
    elif connection == "error":  #如果沒有順利取得連線
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500    
            





#要驗證JWT
@food.route('/api/my-food', methods=["GET","POST","PATCH","DELETE"])
@jwt_required_for_food()
def foods():
    if request.method == "POST": #如果是POST,代表要新增食物
        add_food_result = handle_add_food(request)
        return add_food_result
    elif request.method == "DELETE": #如果是delete,代表要刪除食物
        delete_food_result = handle_delete_food(request)
        return delete_food_result
    elif request.method == "GET": #如果是GET,代表要取得食物分頁資料
        page = request.args.get('page')
        #如果沒有給page或是page給的不是是數字形式，gg
        if not page or not page.isdigit():
            response_msg={
                        "nextPage":None,
                        "data":[]}
            result = make_response(response_msg,200)  
        elif page.isdigit(): 
            user_id = Utils_obj.get_member_id_from_jwt(request) #用get_my_food{user_id}當cache key
            redis_key = f'get_my_food{user_id}' # e.g => get_my_food18
            try:
                start = time.perf_counter()
                r = redis_db.redis_instance.hget(redis_key,str(page))
                if r: #如果redis有資料
                    data = json.loads(r)
                    result = jsonify(data), 200  
                    end_a = time.perf_counter()
                    current_app.logger.info(f"food cache hits!=>time consuming:{end_a-start} s")
                else:  #如果redis沒資料,就要去mysql拿,再存入redi,要send一個background task 2分鐘後刪除
                    result = handle_get_my_food_data(page,user_id)
                    if result[0].status_code == 200: #如果result成功,才存入redis
                        data = result[0].get_data() #result[0].get_data()已是byte string
                        redis_db.redis_instance.hset(redis_key,str(page), data)
                        current_app.logger.info("task sended!")
                        current_app.celery.send_task('task.delmyfoodCache',args=[redis_key,page],countdown=600) 
                        end_b = time.perf_counter()      
                        current_app.logger.info(f"food cache miss!=>time consuming:{end_b-start} s")                      
            except: #如果redis掛掉,就要去mysql拿
                result = handle_get_my_food_data(page,user_id)  
        return result            





#這個是用來在新增食物紀錄時,在search bar 搜尋時on the fly search
@food.route('/api/public-food', methods=["GET"])
@jwt_required_for_food()
@cache.cached(timeout=30, query_string=True)
def public_food():
    get_food_result = handle_get_public_food_data(request)
    return get_food_result



'''
@food.route("/testc1")
def testc():
    print("calling long celery task")
    result = current_app.celery.send_task('celery_tasks.test1',countdown=10)
    #r = result.get()
    #print("芹菜結果:",r)
    return "長芹菜ok"

@food.route("/testc2")
def testc2():
    print("calling short celery task")
    result = current_app.celery.send_task('celery_tasks.test2',countdown=5)
    #r = result.get()
    #print("芹菜結果:",r)
    return "短芹菜ok"
'''    
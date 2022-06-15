from flask import request
from flask import Blueprint
from flask import jsonify 
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import db
from model import redis_db
from utils import Utils_obj
from model import Diet_connection

diet = Blueprint('diet', __name__,static_folder='static',static_url_path='/record')


#decorator for /api/intakes route
def jwt_required_for_intake():
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



def organize_diet_data(data):
    first_row = data[0]
    result={}
    if first_row["food_name"]: #means there is food record
        result["food_record"]=[]
        for row in data:
            temp = {
                "food_name": row["food_name"],
                "protein": row["protein"], #g
                "fat": row["fat"], #g
                "carbs": row["carbs"], #g
                "amount": row["amount"] #g
            }
            result["food_record"].append(temp)
    return result    

def verify_diet(input):
    result=True
    if (type(input["protein"]) not in [float,int] ) or (input["protein"]<0): #g
        result = False
    elif (type(input["fat"]) not in [float,int] ) or (input["fat"]<0): #g
        result = False
    elif (type(input["carbs"]) not in [float,int] ) or (input["carbs"]<0): #g
        result = False   
    elif (type(input["amount"]) not in [float,int] ) or (input["amount"]<0):
        result = False    
    elif (type(input["record_id"])!= int) or (type(input["food_name"]) != str):
        result = False             
    return result     




def handle_get_diet():
    connection = db.get_cnx() 
    if connection != "error":     
        user_id = Utils_obj.get_member_id_from_jwt()
        datetimestamp = request.args.get('datetime')  
        if not datetimestamp or not datetimestamp.isdigit():
            return jsonify({
                            "error": True,
                            "message": "未提供日期或時間戳錯誤"
                            }), 400     
        data = Diet_connection.get_diet_info(connection,datetimestamp,user_id)
        if data == "error":
            response_msg={
                          "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else:  
            if not data: 
                return jsonify({"food_record":None})
            else: #means record existed (with/without food record)
                result = organize_diet_data(data)
                return jsonify(result), 200                      
    else:
        response_msg={
                      "error":True,
                      "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500       
def handle_add_diet():
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        labels = ["record_id","food_name","protein","fat","carbs","amount"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        verify_result = verify_diet(input)
        if verify_result == False:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 
        connection = db.get_cnx() 
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt()
            result = Diet_connection.insert_new_diet(connection,request_data,user_id)
            if result == "error": 
                response_msg={
                              "error":True,
                              "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result:  #add successfully, needs to delete corresponded cache
                timestamp = request_data["create_at"]
                redis_key = f'get_my_record{user_id}'
                redis_db.redis_instance.hdel(redis_key,str(timestamp))
                response_msg={"ok": True, "intake_id": result["intake_id"]}
                return jsonify(response_msg), 201 
            else:
                response_msg={
                              "error":True,
                              "message":"該紀錄代號不存在或該紀錄代號不屬於此會員"}  
                return jsonify(response_msg), 400 
        else: 
            response_msg={
                          "error":True,
                          "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500       
def handle_delete_diet():
        intake_id = request.args.get("intake_id")
        record_id = request.args.get("record_id")
        timestamp = request.args.get("datetime")
        if not intake_id or not timestamp or not record_id:
            response_msg={
                          "error":True,
                          "message":"刪除失敗,沒有給intake_id or datetime or record_id"}
            return jsonify(response_msg), 400 
        connection = db.get_cnx()  
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt()
            result = Diet_connection.delete_diet(connection,intake_id,user_id,record_id) 
            if result == "error": 
                response_msg={
                              "error":True,
                              "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #delete successfull, update corresponded cache 
                    redis_key = f'get_my_record{user_id}'
                    redis_db.redis_instance.hdel(redis_key,str(timestamp))
                    response_msg={ "ok": True }
                    return jsonify(response_msg), 204 
            else:
                response_msg={
                              "error":True,
                              "message":"此intake_id不存在或不屬於該會員"}
                return jsonify(response_msg), 400                
        else:
            response_msg={
                          "error":True,
                          "message":"不好意思,資料庫暫時有問題,維修中"}              
            return jsonify(response_msg), 500    





@diet.route('/api/intakes', methods=["GET","POST","DELETE"])
@jwt_required_for_intake()
def intakes():
    if request.method == "POST": 
        add_record_result = handle_add_diet()
        return add_record_result
    elif request.method == "DELETE": 
        delete_diet_result = handle_delete_diet()
        return delete_diet_result
    elif request.method == "GET": 
        get_diet_result = handle_get_diet()
        return get_diet_result

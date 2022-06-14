from flask import request
from flask import Blueprint
from flask import jsonify 
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import db
#from model.connection import Connection
from utils import Utils_obj
from model import Weight_connection

weight = Blueprint('weight', __name__,static_folder='static',static_url_path='/weight')


#decorator for /api/weight route
def jwt_required_for_weight():
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

def handle_get_weight(request):
    start_date = request.args.get("sdate")
    end_date = request.args.get("edate")
    if (not start_date) or (not end_date) or (not start_date.isdigit()) or (not end_date.isdigit()):
        return jsonify({
                    "error": True,
                    "message": "未提供日期或日期格式錯誤"
                }), 400
    connection = db.get_weight_cnx() 
    #if isinstance(connection,Connection):
    if connection != "error":
        user_id = Utils_obj.get_member_id_from_jwt(request)    
        data = Weight_connection.get_weight_info(connection,start_date,end_date,user_id)
        connection.close()
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else:  
            if not data: #no weight record
                return jsonify({"weight_record":None})
            else: 
                result = {"weight_record":data}
                return jsonify(result), 200                  
    #elif connection == "error":  
    else:
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500                  

def handle_update_weight(request):
        try:
            request_data = request.get_json()
            print(request_data)
            print(type(request_data))
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            print("更新失敗,缺少更新資料")              
            return jsonify(response_msg), 400
        labels = ["create_at","new_weight"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗,更新資料不完整"}
            print("更新失敗,更新資料不完整")
            return jsonify(response_msg), 400
        if  (type(input["new_weight"]) not in [int, float]) or (input["new_weight"] > 200) or (input["new_weight"]<30):
            response_msg={
                          "error":True,
                          "message":"更新失敗,體重不正確"}              
            return jsonify(response_msg), 400
        connection = db.get_weight_cnx() 
        #if isinstance(connection,Connection): 
        if connection != "error":    
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = Weight_connection.update_weight(connection,input,user_id)
            connection.close()
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: 
                response_msg={"ok": True}
                return jsonify(response_msg), 200
            else:
                response_msg={
                            "error":True,
                            "message":"該日體重不存在"}             
                return jsonify(response_msg), 400    
        #elif connection == "error":  
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500     
        

def handle_add_weight(request):
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        labels = ["create_at","weight"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        if (type(input["weight"]) not in [int, float]) or (input["weight"] > 200) or (input["weight"]<30):
            response_msg={
                          "error":True,
                          "message":"更新失敗,體重不正確"}
            return jsonify(response_msg), 400
        connection = db.get_weight_cnx()
        # if isinstance(connection,Connection): 
        if connection != "error":
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = Weight_connection.insert_new_weight(connection,input,user_id)
            connection.close()
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: 
                response_msg={"ok": True}
                return jsonify(response_msg), 201 
            else:
                response_msg={
                            "error":True,
                            "message":"已有該日紀錄"}
                return jsonify(response_msg), 400
        #elif connection == "error":  
        else:
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    






@weight.route('/api/weight', methods=["GET","POST","PATCH"])
@jwt_required_for_weight()
def records():
    if request.method == "POST": 
        add_weight_result = handle_add_weight(request)
        return add_weight_result
    elif request.method == "PATCH": 
        update_weight_result = handle_update_weight(request)
        return update_weight_result
    elif request.method == "GET":
        get_weight_result = handle_get_weight(request)
        return get_weight_result
from flask import request
from flask import Blueprint
from flask import make_response
from flask import jsonify 
from flask_jwt_extended import create_access_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended import decode_token
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from model import db
from model.connection import Connection
from utils import Utils_obj

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
    connection = db.get_weight_cnx() #取得體重相關的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線
        user_id = Utils_obj.get_member_id_from_jwt(request)    
        data = connection.get_weight_info(start_date,end_date,user_id)
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else: #取得資料成功  
            if not data: #代表沒有體重紀錄
                return jsonify({"weight_record":None})
            else: #代表有體重紀錄
                result = {"weight_record":data}
                return jsonify(result), 200   #                   
    elif connection == "error":  #如果沒有順利取得連線
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500                  



def handle_update_weight(request):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        labels = ["create_at","new_weight"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        #如果有傳json檔,但裡面根本沒有需要的更新資料
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗,更新資料不完整"}
            return jsonify(response_msg), 400
        #後端也要更新的資料正不正確 防止有人不是從瀏覽器更新
        if  (type(input["new_weight"]) not in [int, float]) or (input["new_weight"] > 200) or (input["new_weight"]<30):
            response_msg={
                          "error":True,
                          "message":"更新失敗,體重不正確"}
            return jsonify(response_msg), 400
        #取得連線物件
        connection = db.get_weight_cnx() #取得體重操作相關的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.update_weight(input,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: #更新成功
                response_msg={ "ok":True }
                return jsonify(response_msg), 200
            else:
                response_msg={
                            "error":True,
                            "message":"該日體重不存在"}  
                return jsonify(response_msg), 400    
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500     
        

def handle_add_weight(request):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        labels = ["create_at","weight"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        #如果有傳json檔,但裡面根本沒有需要的更新資料
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        #後端也要驗證正不正確 防止有人不是從瀏覽器
        if (type(input["weight"]) not in [int, float]) or (input["weight"] > 200) or (input["weight"]<30):
            response_msg={
                          "error":True,
                          "message":"更新失敗,體重不正確"}
            return jsonify(response_msg), 400
        #取得連線物件
        connection = db.get_weight_cnx() #取得體重操作相關的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.insert_new_weight(input,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: 
                response_msg={"ok": True}
                return jsonify(response_msg), 201 #api test ok
            else:
                response_msg={
                            "error":True,
                            "message":"已有該日紀錄"}
                return jsonify(response_msg), 400
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    





#要驗證JWT
@weight.route('/api/weight', methods=["GET","POST","PATCH"])
@jwt_required_for_weight()
def records():
    if request.method == "POST": #如果是POST,代表要新增日紀錄
        add_weight_result = handle_add_weight(request)
        return add_weight_result
    elif request.method == "PATCH": #如果是patch,代表要更新當日體重
        update_weight_result = handle_update_weight(request)
        return update_weight_result
    elif request.method == "GET": #如果是GET,代表要取得體重紀錄列表
        get_weight_result = handle_get_weight(request)
        return get_weight_result
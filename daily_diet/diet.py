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
from daily_record import record
from model import db
from model.connection import Connection
from utils import Utils_obj

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
    if first_row["food_name"]: #代表有飲食紀錄
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








def handle_get_diet(request):
    connection = db.get_daily_diet_cnx() #取得飲食紀錄操作相關的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線
        user_id = Utils_obj.get_member_id_from_jwt(request)
        datetimestamp = request.args.get('datetime')  
        if not datetimestamp or not datetimestamp.isdigit():
            return jsonify({
                            "error": True,
                            "message": "未提供日期或時間戳錯誤"
                            }), 400     
        data = connection.get_diet_info(datetimestamp,user_id)
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else: #取得資料成功  
            if not data: #代表當日沒有紀錄
                return jsonify({"food_record":None})
            else: #代表有當日紀錄,但不一定有飲食紀錄
                result = organize_diet_data(data)
                return jsonify(result), 200   #                   
    elif connection == "error":  #如果沒有順利取得連線
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500       

def handle_add_diet(resuest):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        labels = ["record_id","food_name","protein","fat","carbs","amount"]
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
        verify_result = verify_diet(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"新增紀錄失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 
        #取得連線物件
        connection = db.get_daily_diet_cnx() #取得飲食紀錄操作相關的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.insert_new_diet(request_data,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result: 
                response_msg={"ok": True, "intake_id": result["intake_id"]}
                return jsonify(response_msg), 201 #api test ok
            else:
                response_msg={
                            "error":True,
                            "message":"該紀錄代號不存在或該紀錄代號不屬於此會員"}  
                return jsonify(response_msg), 400 
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500       

def handle_delete_diet(request):
        intake_id = request.args.get("intake_id")
        if not intake_id:
            response_msg={
                          "error":True,
                          "message":"刪除失敗,沒有給intake_id"}
            return jsonify(response_msg), 400 
        connection = db.get_daily_diet_cnx()   #取得飲食紀錄相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.delete_diet(intake_id,user_id) 
            if result == "error": #代表刪除飲食資料失敗
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #表示刪除飲食資料成功
                    response_msg={ "ok": True }
                    return jsonify(response_msg), 200 #api test ok
            else:
                response_msg={
                            "error":True,
                            "message":"此intake_id不存在或不屬於該會員"}
                return jsonify(response_msg), 400 #api test ok                
        elif connection == "error": #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}              
            return jsonify(response_msg), 500    




#要驗證JWT
@diet.route('/api/intakes', methods=["GET","POST","DELETE"])
@jwt_required_for_intake()
def intakes():
    if request.method == "POST": #如果是POST,代表要新增吃的紀錄
        add_record_result = handle_add_diet(request)
        return add_record_result
    elif request.method == "DELETE": #如果是delete,代表要刪除吃的紀錄
        delete_diet_result = handle_delete_diet(request)
        return delete_diet_result
    elif request.method == "GET": #如果是GET,代表要取得當日吃的紀錄)
        get_diet_result = handle_get_diet(request)
        return get_diet_result

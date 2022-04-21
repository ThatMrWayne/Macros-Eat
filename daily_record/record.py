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

record = Blueprint('record', __name__,static_folder='static',static_url_path='/record')


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
    return result     


def organize_record_data(data):
    first_row = data[0]
    result={
        "day_record":{
            "record_id": first_row["record_id"],
            "plan_calories": first_row["plan_calories"],
            "protein": first_row["protein"], #%
            "fat": first_row["fat"], #%
            "carb": first_row["carb"] #%
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
                "carb": row["carb"], #g
                "amount": row["amount"] #g
            }
            result["food_record"].append(temp)
    return result    

    






def handle_add_record(request):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"新增紀錄失敗"}
            return jsonify(response_msg), 400 
        labels = ["plan_calories","protein","fat","carbs"]
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
        verify_result = verify_record_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"新增紀錄失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 
        #取得連線物件
        connection = db.get_daily_record_cnx() #取得每日紀錄操作相關的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.insert_new_record(request_data,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: 
                response_msg={"ok": True}
                return jsonify(response_msg), 201 #api test ok
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500       


#取得使用者的日紀錄＋取得飲食紀錄
def handle_get_record(request):
    connection = db.get_daily_record_cnx() #取得每日紀錄操作相關的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線
        user_id = Utils_obj.get_member_id_from_jwt(request)
        datetimestamp = request.args.get('datetime')  
        if not datetimestamp or not datetimestamp.isdigit():
            return jsonify({
                            "error": True,
                            "message": "未提供日期或時間戳錯誤"
                            }), 400     
        data = connection.get_record_info(datetimestamp,user_id)
        if data == "error":
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500          
        else: #取得資料成功  
            if not data: #代表當日沒有紀錄
                return jsonify({"day_record":None,"food_record":None})
            else: #代表有當日紀錄,但不一定有飲食紀錄
                result = organize_record_data(data)
                return jsonify(result), 200   #                   
    elif connection == "error":  #如果沒有順利取得連線
        response_msg={
                "error":True,
                "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500    
            


def handle_update_record(request):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        labels = ["plan_calories","protein","fat","carbs"]
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
        verify_result = verify_record_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"更新失敗,更新資料不正確"}  
            return jsonify(response_msg), 400
        #取得連線物件
        connection = db.get_daily_record_cnx() #取得每日紀錄操作相關的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.update_record(input,user_id)
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
                            "message":"該日紀錄不存在"}  
                return jsonify(response_msg), 400    
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500     
    




#要驗證JWT
@record.route('/api/reocrds', methods=["GET","POST","PATCH"])
def records():
    if request.method == "POST": #如果是POST,代表要新增日紀錄
        add_record_result = handle_add_record(request)
        return add_record_result
    elif request.method == "PATCH": #如果是patch,代表要更新日紀錄
        update_record_result = handle_update_record(request)
        return update_record_result
    elif request.method == "GET": #如果是GET,代表要取得日紀錄(包括當日吃的紀錄)
        get_record_result = handle_get_record(request)
        return get_record_result

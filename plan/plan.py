import json
import re
import datetime
from flask import request
from flask import Blueprint
from flask import make_response
from flask import jsonify 
from flask_jwt_extended import create_access_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended import decode_token
from functools import wraps
from model import db
from model.connection import Connection
from utils import Utils_obj



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











def handle_add_diet_plan(request):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"新增飲食計畫失敗"}
            return jsonify(response_msg), 400
        labels = ["create_at","plan_calories","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        #如果有傳json檔,但裡面根本沒有需要的更新資料
        if None in input.values():    
            response_msg={
                          "error":True,
                          "message":"新增飲食計畫失敗"}
            return jsonify(response_msg), 400 
        #後端也要驗證正不正確 防止有人不是從瀏覽器
        verify_result = verify_diet_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"新增飲食計畫失敗,新增資料有誤"}  
            return jsonify(response_msg), 400 
        #取得連線物件
        connection = db.get_diet_plan_cnx() #取得飲食計畫相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.insert_new_diet_plan(request_data,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: 
                response_msg={"ok": True}
                return jsonify(response_msg), 201 
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    
def handle_delete_diet_plan(request):
        plan_id = request.args.get("plan_id")
        if not plan_id:
            response_msg={
                          "error":True,
                          "message":"刪除失敗,沒有給plan id"}
            return jsonify(response_msg), 400 
        connection = db.get_diet_plan_cnx()    #取得飲食計畫相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.delete_diet(plan_id,user_id) 
            if result == "error": #代表刪除食物資料失敗
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #表示刪除飲食計畫成功
                    response_msg={ "ok": True }
                    return jsonify(response_msg), 204 
            else:
                response_msg={
                            "error":True,
                            "message":"plan_id不屬於此會員或此plan_id不存在"}
                return jsonify(response_msg), 400                 
        elif connection == "error": #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}              
            return jsonify(response_msg), 500       
def handle_update_diet_plan(request):
     #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        labels = ["plan_id","plan_calories","protein","fat","carbs"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        #如果有傳json檔,但裡面根本沒有需要的更新資料
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗,缺少更新資料"}
            return jsonify(response_msg), 400
        #後端也要更新的資料正不正確 防止有人不是從瀏覽器更新
        verify_result = verify_diet_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"更新資料錯誤"}  
            return jsonify(response_msg), 400
        #取得連線物件
        connection = db.get_diet_plan_cnx() #取得飲食計畫相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.update_diet_info(input,user_id)
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
                            "message":"plan_id不屬於此會員或此plan_id不存在"}  
                return jsonify(response_msg), 400    
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500  
def handle_get_diet_plans(request):
    connection = db.get_diet_plan_cnx() #取得飲食計畫相關操作的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線
        page = request.args.get('page')
        #如果沒有給page或是page給的不是是數字形式，gg
        if not page or not page.isdigit():
            response_msg={
                        "nextPage":None,
                        "data":[]}
            res=make_response(response_msg,200)  
        elif page.isdigit(): 
            user_id = Utils_obj.get_member_id_from_jwt(request)             
            data = connection.get_diet_info(page,user_id)
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



#要驗證JWT
@plan.route('/api/plans', methods=["GET","POST","PATCH","DELETE"])
@jwt_required_for_plan()
def plans():
    if request.method == "POST": #如果是POST,代表要新增飲食計畫
        add_diet_plan_result = handle_add_diet_plan(request)
        return add_diet_plan_result
    elif request.method == "PATCH": #如果是PATCH,代表要更新飲食計畫 
        update_diet_plans = handle_update_diet_plan(request)
        return update_diet_plans
    elif request.method == "DELETE": #如果是delete,代表要刪除飲食計畫
        delete_diet_result = handle_delete_diet_plan(request)
        return delete_diet_result
    elif request.method == "GET": #如果是GET,代表要取得食物飲食計畫列表
        diet_plans = handle_get_diet_plans(request)
        return diet_plans

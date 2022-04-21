import json
from pickle import FALSE
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
from werkzeug.security import generate_password_hash, check_password_hash
from model import db
from model.connection import Connection
from utils import Utils_obj

auth = Blueprint('authen', __name__,static_folder='static',static_url_path='/auth')


#decorator for /api/user route
def jwt_required_for_user():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            if request.method == 'GET': #如果是GET,代表要取得當前登入使用者資料,要驗證JWT
                try:
                    verify_jwt_in_request()
                except:
                    print('access_token已失效 或 request根本沒有JWT')
                    return jsonify({"data":None}), 200
            return fn(*args, **kwargs)
        return decorator
    return wrapper


#驗證註冊帳密格式function
def verify_signup_info(email,password):
    emailRegex = re.compile(r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+')
    passwordRegex = re.compile(r'^(?=\w{8,16}$)(?=(?:[^A-Z]*[A-Z]){3})(?=[^a-z]*[a-z])(?=[^\d]*\d).*')
    if not re.fullmatch(emailRegex, email) or not re.fullmatch(passwordRegex,password):
        return False
    else:
        return True    

#驗證更新資訊function
def verify_update_info(input):
    result = None
    if (not type(input["sex"]) is int) or (not 0<=input["sex"]<=1):
        print(input["sex"])
        print(type(input["sex"]))
        print('a')
        result = False
    elif (not type(input["height"]) in [int, float] ) or (not 60<=input["height"]<=250):
        print('b')
        print(type(input["height"]))
        result = False
    elif (not type(input["weight"]) in [int, float] )  or (not 11<=input["weight"]<=200):
        print('c')
        result = False    
    elif (not type(input["habit"]) is int) or (not 1<=input["habit"]<=4):
        print('d')
        result = False  
    elif (not type(input["target"]) is int) or (not 0<=input["target"]<=2):
        print('e')
        result = False    
    elif (not type(input["age"]) is int) or (not 12<=input["age"]<=100):
        print('e')
        result = False     
    else:
        result = True
    return result        


           




def handle_signup(request):
        #前端送過來的是json檔
        try:
            request_data = request.get_json()
            print(request_data)
        except:    
            #如果POST過來根本沒有json檔
            response_msg={
                          "error":True,
                          "message":"註冊失敗" }
            return jsonify(response_msg), 400  #api test ok
        name = request_data.get("name")
        email = request_data.get("email")
        password = request_data.get("password")
        signup_date = request_data.get("signup_date")
        #如果有傳json檔,但裡面根本沒有name,email,pawword
        if not name or not email or not password or not signup_date:
            response_msg={
                          "error":True,
                          "message":"註冊失敗"}
            return jsonify(response_msg), 400  #api test ok
        #後端也要驗證一次信箱密碼正不正確 防止有人不是從瀏覽器註冊
        verify_result = verify_signup_info(email,password)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"信箱或密碼輸入格式錯誤"}  
            return jsonify(response_msg), 400     #api test ok
        #取得連線物件
        connection = db.get_auth_cnx() #取得驗證登入註冊相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            result = connection.check_if_member_exist(email)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: #如果檢查回傳結果是true代表已經有一樣的email了
                response_msg={
                            "error":True,
                            "message":"此email已經被註冊,請重新輸入"}
                return jsonify(response_msg), 400 #api test ok
            else: #如果檢查回傳結果是false代表可以註冊
                #先對密碼做hash
                hash_password = generate_password_hash(password)
                #新增會員資料
                connection = db.get_auth_cnx() #要在拿一次因為每次執行完都會把cnx丟回去
                result = connection.insert_new_member(signup_date,name, email, hash_password)
                if result == "error": #如果回傳結果是"error",代表資料庫insert時發生錯誤
                    response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                    return jsonify(response_msg), 500
                elif result == True: #如果檢查回傳結果是true代表新增會員到資料庫成功
                    response_msg={ "ok":True }
                    return jsonify(response_msg), 200 #api test ok
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    
def handle_signin(request):
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"登入失敗"} 
            return jsonify(response_msg), 400 #api test ok
        email = request_data.get("email")
        password = request_data.get("password")
        if not email or not password: #如果沒有給email或password,失敗
            response_msg={
                          "error":True,
                          "message":"登入失敗"} #api test ok
            return jsonify(response_msg), 400
        connection = db.get_auth_cnx()    #取得驗證登入註冊相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            result = connection.confirm_member_information(email) #先確認有沒有這個email帳號 
            if result == "error": #代表查詢失敗
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #表示有此會員
                #接著檢查密碼
                check_result = check_password_hash(result["hash_password"],password)
                if check_result:
                    #產生JWT_token
                    access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"]}),expires_delta=datetime.timedelta(days=5))
                    #要查看是不是第一次登入
                    if result["initial"]==1:
                        #再把initial改成false
                        connection = db.get_auth_cnx() 
                        change_initial = connection.change_initial_state(email)   
                        if change_initial == True:
                            response_msg = {"ok":True,"initial":True}                      
                        else:
                            response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                            return jsonify(response_msg), 500 
                    else:
                        response_msg = {"ok":True,"initial":False}    
                    res = make_response(json.dumps(response_msg,ensure_ascii=False),200)
                    res.headers["access_token"] = access_token #把jwt塞在response header
                    return res  #api test ok
                else:
                    response_msg={
                            "error":True,
                            "message":"登入失敗，密碼輸入錯誤"}
                    return jsonify(response_msg), 400 #api test ok
            else:  #表示沒有這個會員
                response_msg={
                            "error":True,
                            "message":"無此會員，請輸入正確的信箱"}
                return jsonify(response_msg), 400 #api test ok
        elif connection == "error": #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
            res=make_response(response_msg,500)               
            return jsonify(response_msg), 500    
def handle_get_user_data(request):
    connection = db.get_auth_cnx() #取得驗證登入註冊相關操作的自定義connection物件
    if isinstance(connection,Connection): #如果有順利取得連線
        user_id = Utils_obj.get_member_id_from_jwt(request) #使用utils物件的靜態方法取得jwt裡的資訊
        result = connection.retrieve_member_information(user_id) 
        if result == "error":
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500 
        elif isinstance(result,dict):
            return jsonify({"data":result}) ,200 #api test ok
    elif connection == "error":
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500    
def handle_update_user_data(request):
      #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗"}
            return jsonify(response_msg), 400 #api test ok
        labels = ["sex","height","weight","habit","target","age"]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        #如果有傳json檔,但裡面根本沒有需要的更新資料
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗"}
            return jsonify(response_msg), 400 #api test ok
        #後端也要更新的資料正不正確 防止有人不是從瀏覽器更新
        verify_result = verify_update_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"更新資料錯誤"}  
            return jsonify(response_msg), 400 #api test ok
        #取得連線物件
        connection = db.get_auth_cnx() #取得驗證登入註冊相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            user_id = Utils_obj.get_member_id_from_jwt(request)
            result = connection.update_member_info(input,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: #更新成功
                response_msg={ "ok":True }
                return jsonify(response_msg), 200 #api test ok
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    





@auth.route('/api/users', methods=["GET","PUT"])
#@jwt_required_for_user()
def user():
    if request.method == "GET": #如果是GET,代表要取得當前登入使用者資料,要驗證JWT
        get_user_data_result = handle_get_user_data(request)
        return get_user_data_result
    elif request.method == "PUT": #如果是PUT,代表要更新當前登入使用者資料,要驗證JWT
        update_user_data_result = handle_update_user_data(request)
        return update_user_data_result    


@auth.route('/api/users/signup',methods=["POST"])
def signup():
    signup_result = handle_signup(request)
    return signup_result

@auth.route('/api/users/signin',methods=["POST"])
def signin():
    signin_result = handle_signin(request)
    return signin_result

@auth.route('/api/users/signout',methods=["DELETE"])
def signout():
    return jsonify({"ok":True}), 200 #api test ok    
import json
import re
import datetime
from flask import request
from flask import session
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
from model import redis_db
from model import Connection
from utils import Utils_obj


auth = Blueprint('authen', __name__,static_folder='static',static_url_path='/auth')


#decorator for /api/users route
def jwt_required_for_user():
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
    if (not type(input["gender"]) is int) or (not 0<=input["gender"]<=1):
        result = False
    elif (not type(input["height"]) in [int, float] ) or (not 30<=input["height"]<=230):
        print('b')
        print(type(input["height"]))
        result = False
    elif (not type(input["weight"]) in [int, float] )  or (not 30<=input["weight"]<=500):
        print('c')
        result = False    
    elif (not type(input["habit"]) is int) or (not 1<=input["habit"]<=4):
        print('d')
        result = False  
    elif (not type(input["target"]) is int) or (not 1<=input["target"]<=3):
        print('e')
        result = False    
    elif (not type(input["age"]) is int) or (not 13<=input["age"]<=80):
        print('e')
        result = False     
    else:
        result = True
    return result        


#計算推薦飲食function
def calc_plan(input):
    bmr =(10 * round(input["weight"],1)) + (6.25 * round(input["height"],1)) - (5 * input["age"])
    if input["gender"] == 0:
        bmr = bmr - 161
    elif input["gender"] == 1:
        bmr = bmr + 5
    pal = {1:1.2,2:1.375,3:1.55,4:1.725}    
    calo_degree = {1:0.8,2:1,3:1.2}
    tdee = bmr * pal[input["habit"]]
    calos = int(tdee * calo_degree[input["target"]])
    create_at = int(datetime.datetime.now().timestamp()) 
    #轉成台灣時區
    gmtTimeDelta = datetime.timedelta(hours=8)
    gmtTZObject = datetime.timezone(gmtTimeDelta,name="GMT")
    d = datetime.datetime.fromtimestamp(create_at).astimezone(gmtTZObject)
    s = d.strftime("%Y/%m/%d %H:%M:%S")
    plan_name = "recommended plan at " + s
    recommended = {
                    "plan_name": plan_name,
                    "create_at": create_at,
                    "plan_calories": calos,
                    "protein": 40,
                    "fat": 30,
                    "carbs":30
                    }
    return recommended










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
        identity = request_data.get("identity")
        if identity ==1:
            signup_date = request_data.get("signup_date")
        else: #代表是註冊成營養師
            signup_date = None
        #如果有傳json檔,但裡面根本沒有name,email,pawword
        if not name or not email or not password:
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
            result = connection.check_if_member_exist(email,identity)
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
                result = connection.insert_new_member(name, email, hash_password,identity,signup_date)
                if result == "error": #如果回傳結果是"error",代表資料庫insert時發生錯誤
                    response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                    return jsonify(response_msg), 500
                elif result == True: #如果檢查回傳結果是true代表新增會員到資料庫成功,
                    response_msg={ "ok":True }
                    return jsonify(response_msg), 201 #api test ok
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
        identity = request_data.get("identity")
        if not email or not password: #如果沒有給email或password,失敗
            response_msg={
                          "error":True,
                          "message":"登入失敗"} #api test ok
            return jsonify(response_msg), 400
        connection = db.get_auth_cnx()    #取得驗證登入註冊相關操作的自定義connection物件
        if isinstance(connection,Connection): #如果有順利取得連線
            result = connection.confirm_member_information(email,identity) #先確認有沒有這個email帳號 
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
                    if identity ==1 and result["initial"]==1: #表示是第一次登入
                        data = json.dumps(
                                {"room_id" : 0,
                                "name" : result["name"],
                                "record_socketid": [0],
                                "socket_id" : [0],
                                "status" : 0	
                                })
                        redis_db.redis_instance.hsetnx("user",str(result["member_id"]),data)
                        access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"],'name':result["name"],'identity':identity,'initial':True}),expires_delta=datetime.timedelta(days=15))
                        response_msg = {"ok":True,"initial":True}
                    elif identity ==1 and result["initial"]==0: #表示不是第一次登入
                        data =json.dumps(
                                {"room_id" : 0,
                                "name" : result["name"],
                                "record_socketid": [0],
                                "socket_id" : [0],
                                "status" : 0	
                                })
                        redis_db.redis_instance.hsetnx("user",str(result["member_id"]),data)
                        access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"],'name':result["name"],'identity':identity,'initial':False}),expires_delta=datetime.timedelta(days=15))
                        session.permanent = True
                        session["id"] = result["member_id"] #在登入的時候就給cookie
                        response_msg = {"ok":True,"initial":False}                      
                    elif identity ==2: #5/14  營養師登入後,要存入營養師資料到redis,準備給諮詢用
                        data = json.dumps(
                                {"room_id" : 0,
                                "name" : result["name"],
                                "socket_id" : [0],
                                "status" : 0	
                                })
                        redis_db.redis_instance.hsetnx("nutri",str(result["nutri_id"]),data)
                        session.permanent = True
                        session["id"] = result["nutri_id"]
                        access_token = create_access_token(identity=json.dumps({'email':email,'id':result["nutri_id"],'name':result["name"],'identity':identity}),expires_delta=datetime.timedelta(days=15))
                        response_msg = {"ok":True,"initial":None}
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
        user_identity = Utils_obj.get_member_identity_from_jwt(request)
        result = connection.retrieve_member_information(user_id,user_identity) 
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
def handle_update_user_data(request): #update會員資料的時候就要一併產生推薦飲食計畫
      #前端送過來的是json檔
        try:
            request_data = request.get_json()
        #如果POST過來根本沒有json檔
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗"}
            return jsonify(response_msg), 400 #api test ok
        labels = ["gender","height","weight","habit","target","age",]
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
            email = Utils_obj.get_email_from_jwt(request)
            name = Utils_obj.get_member_name_from_jwt(request)
            result = connection.update_member_info(input,user_id)
            if result == "error": #如果檢查回傳結果是"error",代表資料庫query時發生錯誤
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中a"}
                return jsonify(response_msg), 500
            elif result == True: #更新成功
                response_msg={ "ok":True }
                #計算推薦飲食並存入資料庫
                recommended_plan = calc_plan(input)
                connection = db.get_diet_plan_cnx()
                insert_plan = connection.insert_new_diet_plan(recommended_plan,user_id)
                if insert_plan == "error":
                    response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中b"}
                    return jsonify(response_msg), 500 
                elif insert_plan:
                    print('新增推薦計畫成功')
                #查看jwt裡的initial如果=true,代表是第一次更新資料
                initial = Utils_obj.get_member_initial_from_jwt(request) 
                if initial == True:
                    connection = db.get_auth_cnx() 
                    change_initial = connection.change_initial_state(email)   
                    if change_initial == True:
                        session.permanent = True
                        session["id"] = user_id #第一次更新資料成功才給cookie(存一個cookie 給之後disconnect用) 
                        session["remind"] = "yes"
                        #送一個新的JWT
                        new_access_token = create_access_token(identity=json.dumps({'email':email,'id':user_id,'name':name,'identity':1,'initial':False}),expires_delta=datetime.timedelta(days=15))  
                        res = make_response(json.dumps(response_msg,ensure_ascii=False),200)
                        res.headers["access_token"] = new_access_token #把jwt塞在response header     
                        return res         
                    else:
                        response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中c"}
                        return jsonify(response_msg), 500                   
                return jsonify(response_msg), 200 #api test ok
        elif connection == "error":  #如果沒有順利取得連線
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中d"}          
            return jsonify(response_msg), 500    





@auth.route('/api/users', methods=["GET","PUT"])
@jwt_required_for_user()
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
    del session["id"]
    return jsonify({"ok":True}), 200 #api test ok    
        
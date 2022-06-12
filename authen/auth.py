import json
import re
import datetime
from flask import request
from flask import session
from flask import Blueprint
from flask import make_response
from flask import jsonify 
from flask_jwt_extended import create_access_token
from flask_jwt_extended import verify_jwt_in_request
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


def verify_signup_info(email,password):
    emailRegex = re.compile(r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+')
    if not re.fullmatch(emailRegex, email) :
        return False
    else:
        return True    


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
        try:
            request_data = request.get_json()
            print(request_data)
        except:    
            #if there is no json file 
            response_msg={
                          "error":True,
                          "message":"註冊失敗" }
            return jsonify(response_msg), 400  
        name = request_data.get("name")
        email = request_data.get("email")
        password = request_data.get("password")
        identity = request_data.get("identity")
        if identity ==1:
            signup_date = request_data.get("signup_date")
        else: 
            signup_date = None
        if not name or not email or not password:
            response_msg={
                          "error":True,
                          "message":"註冊失敗"}
            return jsonify(response_msg), 400  
        #verify again 
        verify_result = verify_signup_info(email,password)
        if verify_result == False:
            response_msg={
                          "error":True,
                          "message":"信箱或密碼輸入格式錯誤"}  
            return jsonify(response_msg), 400     
        #get connection object
        connection = db.get_auth_cnx() 
        if isinstance(connection,Connection): 
            result = connection.check_if_member_exist(email,identity)
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True: #true means same email has been used
                response_msg={
                            "error":True,
                            "message":"This email has been signed up. Please use another one."}
                return jsonify(response_msg), 400
            else: #false means able to sign up
                #hash password
                hash_password = generate_password_hash(password)
                #add new member data
                connection = db.get_auth_cnx() 
                result = connection.insert_new_member(name, email, hash_password,identity,signup_date)
                if result == "error": 
                    response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                    return jsonify(response_msg), 500
                elif result == True:
                    response_msg={ "ok":True }
                    return jsonify(response_msg), 201 
        elif connection == "error":  #if can't get connection
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
            return jsonify(response_msg), 400 
        email = request_data.get("email")
        password = request_data.get("password")
        identity = request_data.get("identity")
        if not email or not password:
            response_msg={
                          "error":True,
                          "message":"登入失敗"} 
            return jsonify(response_msg), 400
        connection = db.get_auth_cnx()  
        if isinstance(connection,Connection): 
            #confirm if email existed
            result = connection.confirm_member_information(email,identity)
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
            elif result: #means member exist,check password 
                check_result = check_password_hash(result["hash_password"],password)
                if check_result:
                    #generate JWT token
                    if identity ==1 and result["initial"]==1: #means sign in first time
                        data = json.dumps(
                                          {"room_id" : 0,
                                           "name" : result["name"],
                                           "socket_id" : [0],
                                           "status" : 0	
                                         })
                        redis_db.redis_instance.hsetnx("user",str(result["member_id"]),data)
                        access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"],'name':result["name"],'identity':identity,'initial':True}),expires_delta=datetime.timedelta(days=15))
                        response_msg = {"ok":True,"initial":True}
                    elif identity ==1 and result["initial"]==0: #means not firsttime sing in
                        data =json.dumps(
                                         {"room_id" : 0,
                                          "name" : result["name"],
                                          "socket_id" : [0],
                                          "status" : 0	
                                        })
                        redis_db.redis_instance.hsetnx("user",str(result["member_id"]),data)
                        access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"],'name':result["name"],'identity':identity,'initial':False}),expires_delta=datetime.timedelta(days=15))
                        session.permanent = True
                        session["id"] = result["member_id"] 
                        response_msg = {"ok":True,"initial":False}                      
                    elif identity ==2: # nutritionist
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
                    res.headers["access_token"] = access_token #put JWT in header
                    return res 
                else:
                    response_msg={
                                  "error":True,
                                  "message":"Password is not correct."}
                    return jsonify(response_msg), 400 
            else:  #means there is no this member
                response_msg={
                              "error":True,
                              "message":"Member not found. Please confirm."}
                return jsonify(response_msg), 400
        elif connection == "error": 
            response_msg={
                          "error":True,
                          "message":"不好意思,資料庫暫時有問題,維修中"}
            res=make_response(response_msg,500)               
            return jsonify(response_msg), 500    
def handle_get_user_data(request):
    connection = db.get_auth_cnx() 
    if isinstance(connection,Connection): 
        user_id = Utils_obj.get_member_id_from_jwt(request) 
        user_identity = Utils_obj.get_member_identity_from_jwt(request)
        result = connection.retrieve_member_information(user_id,user_identity) 
        if result == "error":
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500 
        elif isinstance(result,dict):
            return jsonify({"data":result}) ,200 
    elif connection == "error":
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500    
def handle_update_user_data(request): 
      #while update memeber data,generate recommended plan
        try:
            request_data = request.get_json()
        except:
            response_msg={
                          "error":True,
                          "message":"更新失敗"}
            return jsonify(response_msg), 400 
        labels = ["gender","height","weight","habit","target","age",]
        input = {}
        for label in labels:
            input[label] = request_data.get(label)
        if None in input.values():
            response_msg={
                          "error":True,
                          "message":"更新失敗"}
            return jsonify(response_msg), 400 
        verify_result = verify_update_info(input)
        if verify_result == False:
            response_msg={
                            "error":True,
                            "message":"更新資料錯誤"}  
            return jsonify(response_msg), 400 
        connection = db.get_auth_cnx() 
        if isinstance(connection,Connection): 
            user_id = Utils_obj.get_member_id_from_jwt(request)
            email = Utils_obj.get_email_from_jwt(request)
            name = Utils_obj.get_member_name_from_jwt(request)
            result = connection.update_member_info(input,user_id)
            if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500
            elif result == True:
                response_msg={ "ok":True }
                #calculate recommended plan and insert in db 
                recommended_plan = calc_plan(input)
                connection = db.get_diet_plan_cnx()
                insert_plan = connection.insert_new_diet_plan(recommended_plan,user_id)
                if insert_plan == "error":
                    response_msg={
                                  "error":True,
                                  "message":"不好意思,資料庫暫時有問題,維修中"}
                    return jsonify(response_msg), 500 
                #chekc the initial value in JWT ,if true means update first time
                initial = Utils_obj.get_member_initial_from_jwt(request) 
                if initial == True:
                    connection = db.get_auth_cnx() 
                    change_initial = connection.change_initial_state(email)   
                    if change_initial == True:
                        session.permanent = True
                        #when update first time successfully,set cookie 
                        session["id"] = user_id 
                        session["remind"] = "yes"
                        #generate a new JWT
                        new_access_token = create_access_token(identity=json.dumps({'email':email,'id':user_id,'name':name,'identity':1,'initial':False}),expires_delta=datetime.timedelta(days=15))  
                        res = make_response(json.dumps(response_msg,ensure_ascii=False),200)
                        res.headers["access_token"] = new_access_token  
                        return res         
                    else:
                        response_msg={
                                      "error":True,
                                      "message":"不好意思,資料庫暫時有問題,維修中"}
                        return jsonify(response_msg), 500                   
                return jsonify(response_msg), 200 
        elif connection == "error":  
            response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題維修中"}          
            return jsonify(response_msg), 500    





@auth.route('/api/users', methods=["GET","PUT"])
@jwt_required_for_user()
def user():
    if request.method == "GET": 
        get_user_data_result = handle_get_user_data(request)
        return get_user_data_result
    elif request.method == "PUT": 
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
    try:
        del session["id"]
    except:
        print('no session id')    
    return jsonify({"ok":True}), 200   
        
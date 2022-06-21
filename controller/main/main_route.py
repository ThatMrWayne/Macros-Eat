import json
import datetime
from model import redis_db
from flask import current_app
from flask import Blueprint
from flask import session
from flask import jsonify
from flask import request
from flask import render_template 
from flask import make_response
from model import Auth_connection
from flask_jwt_extended import create_access_token

main = Blueprint('main',__name__,template_folder="templates")

@main.route("/")
def index():
	return render_template("index.html")

@main.route("/record")
def record():
	remind = session.get("remind")
	if remind:
		del session["remind"]
		return render_template("record.html",remind = remind)
	else:
		return render_template("record.html",remind = "no")


@main.route("/helper")
def helper():
	return render_template("helper.html")

@main.route("/again")
def again():
	return render_template("openagain.html")


@main.route("/privacy")
def privacy():
	return render_template("privacy.html")		

@main.route("/terms")
def terms():
	return render_template("terms.html")	


@main.route('/login/google')
def google_login():
    redirect_uri = "https://www.macroseat.xyz/callback"
    return current_app.oauth.google.authorize_redirect(redirect_uri)    


@main.route('/callback')
def authorize():
    token = current_app.oauth.google.authorize_access_token()
    userinfo = token.get('userinfo')
    email = userinfo["email"]
    name = userinfo["name"]
    initial=0	 
    result = Auth_connection.confirm_member_information(email,1) 
    if result == "error": 
                response_msg={
                            "error":True,
                            "message":"不好意思,資料庫暫時有問題,維修中"}
                return jsonify(response_msg), 500 
    elif result: 
        if result["hash_password"] != "123": #表示已經用這個email註冊過,不能再用一樣的email goole登入
            response_msg={
                            "error":True,
                            "message":"This email has been signed up. Please use another one."}
            return jsonify(response_msg), 400 			
        else:
            if result["initial"]==1: #代表還沒填資料
                initial=1	
            session["temp"]=1					
    else: #表示沒有此會員,第一次用google登入,插到會員資料庫
        result_ = Auth_connection.insert_new_member(name, email,"123",1,0)		
        if result_ == "error": #如果回傳結果是"error",代表資料庫insert時發生錯誤
            response_msg={
							"error":True,
							"message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500 							
        elif result_ == True: #如果檢查回傳結果是true代表新增會員到資料庫成功,
            initial=1
            session["temp"]=1
    return render_template("callback.html",email=email,initial = initial)    



@main.route("/token",methods=["POST"])
def get_jwt():
    try:
        temp = session["temp"]
        request_data = request.get_json()
    except:
        response_msg={
                    "error":True,
                    "message":"登入失敗"} 
        return jsonify(response_msg), 400 
    email = request_data.get("email")
    initial = request_data.get("initial")			
    result = Auth_connection.confirm_member_information(email,1) #先確認有沒有這個email帳號 
    if result == "error": #代表查詢失敗
        current_app.logger.info("查詢失敗")
        response_msg={
            "error":True,
            "message":"不好意思,資料庫暫時有問題,維修中"}
        del session["temp"]	
        return jsonify(response_msg), 500 
    elif result: 
        if result["hash_password"] != "123": #表示已經用這個email註冊過,不能再用一樣的email goole登入
            current_app.logger.info("這個email註冊過")
            response_msg={
                        "error":True,
                        "message":"This email has been signed up. Please use another one."}
            del session["temp"]		
            return jsonify(response_msg), 400
        else:  #成功,可以拿jwt
            current_app.logger.info("成功")
            del session["temp"]
            if initial == 1:
                access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"],'name':result["name"],'identity':1,'initial':True}),expires_delta=datetime.timedelta(days=15))		
            else:
                session.permanent = True
                session["id"] = result["member_id"] #在登入的時候就給cookie
                access_token = create_access_token(identity=json.dumps({'email':email,'id':result["member_id"],'name':result["name"],'identity':1,'initial':False}),expires_delta=datetime.timedelta(days=15))		
            data = json.dumps(
                                {"room_id" : 0,
                                "name" : result["name"],
                                "socket_id" : [0],
                                "status" : 0	
                                })
            redis_db.redis_instance.hsetnx("user",str(result["member_id"]),data)	
    else:
        response_msg={
                    "error":True,
                    "message":"登入失敗"} 
        del session["temp"]					
        return jsonify(response_msg), 400 			
      
    res = make_response(json.dumps({"ok":True},ensure_ascii=False),200)
    res.headers["access_token"] = access_token #把jwt塞在response header
    return res 
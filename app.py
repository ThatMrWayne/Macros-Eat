import time
import logging
from datetime import datetime
import threading
from flask import *
from flask_jwt_extended import JWTManager
from flask_jwt_extended import decode_token
from flask_socketio import SocketIO
from flask_socketio import send, emit, join_room
from werkzeug.wrappers import Request, Response
from authen import auth_blueprint
from food import food_blueprint
from daily_record import record_blueprint
from daily_diet import diet_blueprint
from plan import plan_blueprint
from weight import weight_blueprint
from message import message_blueprint
import config
from model import db
from model import redis_db
from cache import cache
from celery_factory.make_celery import make_celery
#import celery_factory.celery_tasks



app=Flask(__name__,static_folder="static",static_url_path="/")
#config for flask object
app.config.from_object(config.DevelopmentConfig)

celery_obj = make_celery(app)
app.celery = celery_obj


# flask caching part 
cache.init_app(app)


app.register_blueprint(auth_blueprint)
app.register_blueprint(food_blueprint)
app.register_blueprint(record_blueprint)
app.register_blueprint(plan_blueprint)
app.register_blueprint(diet_blueprint)
app.register_blueprint(weight_blueprint)
app.register_blueprint(message_blueprint)

jwt = JWTManager(app)
socketio = SocketIO(app)


"""
class AuthMiddleWare:
	def __init__(self, app):
		self.app = app

	def __call__(self, environ, start_response):
		print('this is authmiddleare')
		request = Request(environ)
		result = None
		verify = None
		with app.app_context():
			if request.path in ['/api/public-food','/api/my-food'] or (request.path=='/api/users'):
				verify = True
				print("verifying JWT...")
				try:
					token = request.headers.get("AUTHORIZATION").split(" ")[1]
					t = decode_token(token)
					result = True
				except:
					print('access_token已失效 或 request根本沒有JWT')
					result = False
		if verify:
			if result:
				return self.app(environ,start_response) 	  							
			else:
					res = Response(response = json.dumps({"error":True,"message":"拒絕存取"}), status=403, content_type="application/json")
					return res(environ, start_response)
		else:
			return self.app(environ,start_response)	
"""

class TestMiddleWare:
	def __init__(self, app):
		self.app = app
	def __call__(self, environ, start_response):
		print('this is test middleware ')
		return self.app(environ,start_response)



app.wsgi_app = TestMiddleWare(app.wsgi_app)
socketio = SocketIO(app)




@app.route("/")
def index():
	return render_template("index.html")

@app.route("/record")
def record():
	remind = session.get("remind")
	if remind:
		del session["remind"]
		return render_template("record.html",remind = remind)
	else:
		return render_template("record.html",remind = "no")


@app.route("/helper")
def helper():
	return render_template("helper.html")









#-----------socketIO event handler ---------#


#-----------------使用者-----------------#

#使用者登出
@socketio.on('user_log_out',namespace='/user')
def user_close():
	user_id = session["id"]
	raw_user_data = redis_db.redis_instance.hget("user",str(user_id))
	process_user_data = json.loads(raw_user_data)
	process_user_data["status"] = 0
	process_user_data["room_id"] = 0
	if process_user_data["socket_id"] != [0]:
		for socket_id in process_user_data["socket_id"]: #通知其他分頁都要一起登出
			if socket_id != request.sid:
				socketio.emit("sync_user_out",namespace='/user',to=socket_id)
	if process_user_data["record_socketid"] != [0]:
		for record_socketid in process_user_data["record_socketid"]: #通知其他分頁都要一起登出
			if record_socketid != request.sid:
				socketio.emit("sync_user_out",namespace='/user',to=record_socketid)			
	process_user_data["socket_id"] = [0]
	process_user_data["record_socketid"] = [0]
	redis_db.redis_instance.hset("user",str(user_id),json.dumps(process_user_data))	
	#通知所有在nutri namepace的營養師使用者下線
	socketio.emit('update_user_status',{"user_id":str(user_id)},namespace="/nutri")
	


#user connect驗證
@socketio.on('connect',namespace='/user')
def auth_connect_(auth):
	try:
		from_record = auth["record"]
		print("開始囉")
		decode_JWT = decode_token(auth["token"])
		data=json.loads(decode_JWT["sub"]) 
		current_user_id = data["id"] #從jwt取得使用者id,identity,name去渲染使用者
		current_user_name = data["name"]
		user_data = {"member_id":current_user_id,"name":current_user_name}
		raw_user_data = redis_db.redis_instance.hget("user",str(current_user_id))
		#要看的是status
		process_user_data = json.loads(raw_user_data)
		if process_user_data["status"] == 1 :  #代表已經上線了
			room_id = process_user_data["room_id"]
			if from_record == 1: #如果是從主紀錄頁面連線
				old_record_socketid = process_user_data["record_socketid"]
				old_record_socketid.append(request.sid)
			else:	
				old_socket_id = process_user_data["socket_id"]
				if old_socket_id != [0]:
					old_socket_id.append(request.sid)
				else:
					process_user_data["socket_id"] = [request.sid]	
			join_room(room_id)
			redis_db.redis_instance.hset("user",str(current_user_id),json.dumps(process_user_data))
		else : #代表正常上線
			room_id = request.sid
			process_user_data["room_id"] = room_id
			if from_record == 1: #如果是從主紀錄頁面連線
				process_user_data["record_socketid"] = [room_id]
			else:
				process_user_data["socket_id"] = [room_id]
			process_user_data["status"] = 1
			redis_db.redis_instance.hset("user",str(current_user_id),json.dumps(process_user_data))
		#先試看看去redis的user_history拿資料(是set)
		user_history = redis_db.redis_instance.smembers("u"+str(current_user_id))
		print(user_history)
		print(type(user_history))
		#拿營養師在redis資料
		nutri  =  redis_db.redis_instance.hgetall("nutri") #return value is dictionary,but pay attention
		if user_history: #代表使用者有跟贏養師對話過
			user_history_list = list(i for i in user_history)
			print(user_history_list)
			data_for_user = {}
			for nutri_id in nutri.keys():
				if nutri_id in user_history_list:
					print(json.loads(nutri[str(nutri_id)]))
					message_status = json.loads(redis_db.redis_instance.hget("message_status",str(current_user_id)+"a"+str(nutri_id)))
					data_for_user[str(nutri_id)] = {
						"name" : json.loads(nutri[str(nutri_id)])["name"],
						"status" : json.loads(nutri[str(nutri_id)])["status"],
						"user_read" : message_status["user_read"]
					}
					try:
						temp = message_status["user_unread"]	
						data_for_user[str(nutri_id)]["user_unread"] = temp
					except:
						data_for_user[str(nutri_id)]["user_unread"]= -1
				else:
					data_for_user[nutri_id] = { 
						"name" : json.loads(nutri[nutri_id])["name"],
						"status" : json.loads(nutri[nutri_id])["status"],
						"user_read" : -1,
						"user_unread" : -1,
						}	
		else: #代表使用者還沒有跟營養師對話過
			data_for_user = {}
			for nutri_id in nutri.keys():
				data_for_user[nutri_id] = { 
					"name" : json.loads(nutri[nutri_id])["name"],
					"status" : json.loads(nutri[nutri_id])["status"],
					"user_read" : -1,
					"user_unread" : -1,
				}
			print("嘿嘿")	
		#認證通過，傳回去給使用者顯示		
		socketio.emit('authentication_pass',{"user_data":user_data,"nutri_for_user":data_for_user},namespace='/user',to=request.sid) 
		#通知所有在nutri namepace的營養師使用者上線
		socketio.emit('update_user_status',{"user_id":str(current_user_id)},namespace="/nutri")
	except:
		emit("authencation_fail")	
				

#----給營養師的訊息-----#
@socketio.on('message_to_nutri',namespace='/user')
def msg_to_nutri_(payload): #payload={"message":message,"receiver":receiver,"token":jwt}
	try:
		print('嘿嘿嘿嘿')
		decode_JWT = decode_token(payload["token"])
		data=json.loads(decode_JWT["sub"]) 
		user_name = data["name"]
		user_id = session["id"]
		nutri_id = payload["receiver"] #string
		key = str(user_id)+"a"+str(nutri_id)
		#馬上決定訊息時間,把訊息物件存到mongodb用send_task做
		message = payload["message"]
		message_time = round((datetime.now().timestamp())*1000)
		message_obj={"time":message_time,
					"msg":message,
					"by":"u"+str(user_id),
					"to":"n"+str(nutri_id)}
		current_app.celery.send_task('task.push_message',args=[key,message_obj]) #1
		#訊息存入redis list	
		redis_db.redis_instance.rpush(key,json.dumps(message_obj))	 #6
		if redis_db.redis_instance.llen(key) > 50: #如果大於100筆					 
			redis_db.redis_instance.lpop(key) #從左邊pop掉一個	
		#不管怎麼樣馬上回傳給傳訊息者
		user_room_id = 	json.loads(redis_db.redis_instance.hget("user",str(user_id)))["room_id"] #馬上回傳給傳訊者,需要room_id
		socketio.emit('show_self_message',{"message":message,"time":message_time},namespace='/user',to=user_room_id) #2
		#首先去redis看營養師是否在線
		print('再線否')
		nutri_data = json.loads(redis_db.redis_instance.hget("nutri",nutri_id))
		status = redis_db.redis_instance.hget("message_status", key)
		print(type(status))
		print("status:",status)
		if nutri_data["status"] == 1: #如果營養師在線,傳出去
			socketio.emit('show_user_message',{"message":message,"time":message_time,"name":user_name,"user_id":user_id},namespace='/nutri',to=nutri_data["room_id"]) #3
			if status: #如果redis有對話紀錄狀態,更新使用者的已讀時間
				print('123')
				status = json.loads(status)
				status["user_read"] = message_time
				redis_db.redis_instance.hset("message_status", key, json.dumps(status))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('task.update_user_read',args=[key,message_time]) #4
				print('jjj')
			else: #更新使用者的已讀時間
				print('456')
				redis_db.redis_instance.hset("message_status", key, json.dumps({"user_read" : message_time}))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('task.update_user_read',args=[key,message_time]) #4
				print('kkk')
		else: #營養師不在線,馬上更新redis
			if status: #如果redis有對話紀錄狀態
				status = json.loads(status)
				status["nutri_unread"] = message_time
				status["user_read"] = message_time
				redis_db.redis_instance.hset("message_status", key, json.dumps(status))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('task.update_read_unread',args=[key,message_time]) #5
			else:
				redis_db.redis_instance.hset("message_status", key,json.dumps({"nutri_unread" : message_time,"user_read" : message_time}) )
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('task.update_read_unread',args=[key,message_time]) #5
		#最後user和nutri的history in redis (是set in redis)
		redis_db.redis_instance.sadd("u"+str(user_id),nutri_id) #7
		redis_db.redis_instance.sadd("n"+str(nutri_id),user_id) #8
		#和user和nutri的history存到mongodb
		current_app.celery.send_task('task.update_history_list',args=[int(user_id),int(nutri_id)]) #9
	except:
		emit("authencation_fail")	
	

#----- 更新使用者的"已讀時間" ----#
@socketio.on('update_user_read',namespace="/user")
def update_user_read_(payload):
	#payload = { "nutri_id" : data["nutri_id"],"time" : data["time"]}
	#先更新redis裡面message_status的user_read
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	status = redis_db.redis_instance.hget("message_status",key)
	status = json.loads(status)
	status["user_read"] = payload["time"]
	redis_db.redis_instance.hset("message_status",key,json.dumps(status))
	#再send_task給mongodb做message_history的user_read更新
	current_app.celery.send_task('task.update_user_read',args=[key,payload["time"]])

#----- 更新使用者的"未讀時間" ----#
@socketio.on('update_user_unread',namespace="/user")
def update_user_unread_(payload):
	#payload = { "nutri_id" : data["nutri_id"],"time" : data["time"]}
	#先更新redis裡面message_status的user_unread
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	status = redis_db.redis_instance.hget("message_status",key)
	status = json.loads(status)
	status["user_unread"] = payload["time"]
	redis_db.redis_instance.hset("message_status",key,json.dumps(status))
	#再send_task給mongodb做message_history的user_unread更新
	current_app.celery.send_task('task.update_user_unread',args=[key,payload["time"]])



#----- 更新使用者的"已讀時間"和"未讀時間" ----#
@socketio.on('update_user_read_unread',namespace="/user")
def update_user_read_unread_(payload):
	#payload = {"user_read":nutritionist[nutri_id]["user_read"],"user_unread":-1,"nutri_id":on_which_nutri}}
	#先更新redis裡面message_status的user_read和user_unread
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	status = redis_db.redis_instance.hget("message_status",key)
	status = json.loads(status)
	status["user_unread"] = -1
	status["user_read"] = payload["user_read"]
	redis_db.redis_instance.hset("message_status",key,json.dumps(status))
	#再send_task給mongodb做message_history的user_unread更新
	current_app.celery.send_task('task.update_user_read_unread',args=[key,payload["user_read"],-1])








#-------------------營養師--------------------#

#營養師登出
@socketio.on('nutri_log_out',namespace='/nutri')
def nutri_close():
	nutri_id = session["id"]
	raw_nutri_data = redis_db.redis_instance.hget("nutri",str(nutri_id))
	process_nutri_data = json.loads(raw_nutri_data)
	process_nutri_data["status"] = 0
	process_nutri_data["room_id"] = 0
	for socket_id in process_nutri_data["socket_id"]: #通知其他分頁都要一起登出
		if socket_id != request.sid:
			socketio.emit("sync_nutri_out",namespace='/nutri',to=socket_id)		
	process_nutri_data["socket_id"] = [0]
	redis_db.redis_instance.hset("nutri",str(nutri_id),json.dumps(process_nutri_data))	
	#通知所有在user namepace的營養師使用者下線
	socketio.emit('update_nutri_status',{"nutri_id":str(nutri_id)},namespace="/user")






@socketio.on('connect',namespace='/nutri')
def auth_connect_nutri(auth):
	try:
		decode_JWT = decode_token(auth["token"])
		data=json.loads(decode_JWT["sub"]) 
		current_nutri_id = data["id"] #從jwt取得營養師id,name去渲染營養師
		current_nutri_name = data["name"]
		nutri_data = {"nutri_id":current_nutri_id,"name":current_nutri_name}
		raw_nutri_data = redis_db.redis_instance.hget("nutri",str(current_nutri_id)) #一定會有營養師在redis的資料,因為在登入的時候就先存好了
		#要看的是status
		process_nutri_data = json.loads(raw_nutri_data)
		if process_nutri_data["status"] == 1: #代表已經有開著諮詢頁面了
			room_id = process_nutri_data["room_id"]
			old_socket_id = process_nutri_data["socket_id"]
			old_socket_id.append(request.sid)
			join_room(room_id)
			redis_db.redis_instance.hset("nutri",str(current_nutri_id),json.dumps(process_nutri_data))
		else: #代表正常上線開啟諮詢頁面
			room_id = request.sid
			process_nutri_data["room_id"] = room_id 
			process_nutri_data["socket_id"] = [room_id]
			process_nutri_data["status"] = 1
			redis_db.redis_instance.hset("nutri",str(current_nutri_id),json.dumps(process_nutri_data))
		#先試看看去redis的nutri_history拿資料(是set)
		nutri_history = redis_db.redis_instance.smembers("n"+str(current_nutri_id))
		#拿使用者在redis資料
		user  =  redis_db.redis_instance.hgetall("user") #return value is dictionary
		if nutri_history: #代表贏養師有跟使用者對話過
			data_for_nutri = {}
			for user_id in list(int(i) for i in nutri_history):
				message_status = json.loads(redis_db.redis_instance.hget("message_status",str(user_id)+"a"+str(current_nutri_id)))
				data_for_nutri[str(user_id)] = {
					"name" : json.loads(user[str(user_id)])["name"],
					"status" : json.loads(user[str(user_id)])["status"],
					"nutri_read" : message_status["nutri_read"],
					"nutri_unread" : message_status["nutri_unread"],
				}
				try:
					temp = message_status["nutri_read"]
					data_for_nutri[str(user_id)]["nutri_read"]=  temp
				except:
					data_for_nutri[str(user_id)]["nutri_read"]=  -1	
		else: #代表營養師還沒有跟使用者對話過
			data_for_nutri = {}
		#認證通過，傳回去給營養師顯示		
		socketio.emit('authentication_pass',{"nutri_data":nutri_data,"user_for_nutri":data_for_nutri},namespace='/nutri',to=request.sid) 
		#通知所有在user namepace的營養師使用者上線
		socketio.emit('update_nutri_status',{"nutri_id":str(current_nutri_id),"name":current_nutri_name},namespace="/user")
	except:
		emit("authencation_fail")


#----- 更新營養師的"已讀時間" ----#
@socketio.on('update_nutri_read',namespace="/nutri")
def update_nutri_read_(payload):
	#payload = { "user_id" : data["user_id"],"time" : data["time"]}
	#先更新redis裡面message_status的nutri_read
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	status = redis_db.redis_instance.hget("message_status",key)
	status = json.loads(status)
	status["nutri_read"] = payload["time"]
	redis_db.redis_instance.hset("message_status",key,json.dumps(status))
	#再send_task給mongodb做message_history的nutri_read更新
	current_app.celery.send_task('task.update_nutri_read',args=[key,payload["time"]]) 
	
#----- 更新營養師的"未讀時間" ------#
@socketio.on('update_nutri_unread',namespace="/nutri")
def update_nutri_unread_(payload):
	#payload = { "user_id" : data["user_id"],"time" : data["time"]}
	#先更新redis裡面message_status的nutri_unread
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	status = redis_db.redis_instance.hget("message_status",key)
	status = json.loads(status)
	status["nutri_unread"] = payload["time"]
	redis_db.redis_instance.hset("message_status",key,json.dumps(status))
	#再send_task給mongodb做message_history的nutri_unread更新
	current_app.celery.send_task('task.update_nutri_unread',args=[key,payload["time"]]) 




#----給使用者的訊息-----#
@socketio.on('message_to_user',namespace='/nutri')
def msg_to_user_(payload): #payload={"message":message,"receiver":receiver,"token":jwt}
	try:
		decode_JWT = decode_token(payload["token"])
		data=json.loads(decode_JWT["sub"]) 
		nutri_name = data["name"]
		nutri_id = session["id"]
		user_id = payload["receiver"] #string
		key = str(user_id)+"a"+str(nutri_id)
		#馬上決定訊息時間,把訊息物件存到mongodb用send_task做
		message = payload["message"]
		message_time = round((datetime.now().timestamp())*1000)
		message_obj={"time":message_time,
					"msg":message,
					"by":"n"+str(nutri_id),
					"to":"u"+str(user_id)}
		current_app.celery.send_task('task.push_message',args=[key,message_obj]) #1
		#訊息存入redis list	
		redis_db.redis_instance.rpush(key,json.dumps(message_obj))	 #6 (先存最新的100條)
		if redis_db.redis_instance.llen(key) > 50: #如果大於100筆					 
			redis_db.redis_instance.lpop(key) #從左邊pop掉一個
		#不管怎麼樣馬上回傳給傳訊息者
		nutri_room_id = json.loads(redis_db.redis_instance.hget("nutri",str(nutri_id)))["room_id"] #馬上回傳給傳訊者,需要room_id
		socketio.emit('show_self_message',{"message":message,"time":message_time},namespace='/nutri',to=nutri_room_id) #2
		#首先去redis看使用者是否在線
		user_data = json.loads(redis_db.redis_instance.hget("user",user_id))
		status = redis_db.redis_instance.hget("message_status", key)
		if user_data["status"] == 1: #如果使用者在線,傳出去(要再看socket_id裡有沒有,有才傳)
			if user_data["socket_id"] != [0]:
				socketio.emit('show_nutri_message',{"message":message,"time":message_time,"name":nutri_name,"nutri_id":nutri_id},namespace='/user',to=user_data["room_id"]) #3
				#如果redis有對話紀錄狀態,更新營養師的已讀時間 (應該說一定已經有status,因為是使用者先傳訊息給營養師)
				status = json.loads(status)
				status["nutri_read"] = message_time
				redis_db.redis_instance.hset("message_status", key, json.dumps(status))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('task.update_nutri_read',args=[key,message_time]) #4
			else: #代表使用者只有開著主紀錄畫面(很像不在線)
				#如果redis有對話紀錄狀態(應該說一定已經有status,因為是使用者先傳訊息給營養師)
				status = json.loads(status)
				status["user_unread"] = message_time
				status["nutri_read"] = message_time
				redis_db.redis_instance.hset("message_status", key, json.dumps(status))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('task.update_unread_read',args=[key,message_time]) #5
		else: #使用者不在線,馬上更新redis
            #如果redis有對話紀錄狀態(應該說一定已經有status,因為是使用者先傳訊息給營養師)
			status = json.loads(status)
			status["user_unread"] = message_time
			status["nutri_read"] = message_time
			redis_db.redis_instance.hset("message_status", key, json.dumps(status))
			#redis一更新完,馬上send_task給mongodb
			current_app.celery.send_task('task.update_unread_read',args=[key,message_time]) #5
		#最後user和nutri的history in redis (是set in redis)和user和nutri的history存到mongodb
		#這邊不用再存一次,因為使用者一傳就已經新增紀錄了
	except:
		emit("authencation_fail")


#----- 更新營養師的"已讀時間"和"未讀時間" ----#
@socketio.on('update_nutri_read_unread',namespace="/nutri")
def update_nutri_read_unread_(payload):
	#payload = {"nutri_read":user[user_id]["nutri_read"],"nutri_unread":-1,"user_id":on_which_user}
	#先更新redis裡面message_status的user_read和user_unread
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	status = redis_db.redis_instance.hget("message_status",key)
	status = json.loads(status)
	status["nutri_unread"] = -1
	status["nutri_read"] = payload["nutri_read"]
	redis_db.redis_instance.hset("message_status",key,json.dumps(status))
	#再send_task給mongodb做message_history的user_unread更新
	current_app.celery.send_task('task.update_nutri_read_unread',args=[key,payload["nutri_read"],-1])








#------------------------------#
@app.route("/test")
def f():
	current_app.celery.send_task('task.test_insert',args=["x",1])
	return 'ok'



@app.route("/getfood")
def food():
	#print(time.time())
	print("get food!")
	food = request.args.get("food")
	n = 0
	c = None
	while n<1000:
		try:
			c = db.cnxpool.get_connection()
			print(c)
			break
		except:
			n+=1
			time.sleep(0.1)
	if c:		
		time.sleep(0.2)
		c.close()
		result={"data":1}
		print(threading.current_thread().name)
		#print(time.time())
		return jsonify(result), 200
	else:
		print(c)
		return jsonify({"error":True}), 200	
	
'''
@app.route("/thread")
def t():
	start = time.perf_counter()
	result=[]
	time.sleep(1)
	end = time.perf_counter()

	result.append(end-start)
	result.append(os.getpid())
	result.append(threading.current_thread().ident)

	return ' '.join([str(e) for e in result])
'''

@app.route("/range")
def r():
	return render_template("range.html")
#-------------------------------------------------#






if __name__ == "__main__":
	gunicorn_logger = logging.getLogger('gunicorn.error')
	app.logger.handlers = gunicorn_logger.handlers
	app.logger.setLevel(gunicorn_logger.level)



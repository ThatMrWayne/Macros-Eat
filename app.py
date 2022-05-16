import time
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
import config
from model import db
from model import redis_db
from model import mongo_db
from cache import cache
from celery_factory.make_celery import make_celery




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
#socketio = SocketIO(app)


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
#user connect驗證
@socketio.on('connect',namespace='/user')
def auth_connect(auth):
	try:
		print("開始囉")
		decode_JWT = decode_token(auth["token"])
		data=json.loads(decode_JWT["sub"]) 
		current_user_id = data["id"] #從jwt取得使用者id,identity,name去渲染使用者
		current_user_name = data["name"]
		user_data = {"member_id":current_user_id,"name":current_user_name}
		raw_user_data = redis_db.redis_instance.hget("user",str(current_user_id))
		#要看的是status
		process_user_data = json.loads(raw_user_data)
		print(process_user_data)
		print(type(process_user_data))
		if process_user_data["status"] == 1 :  #代表已經有開著諮詢頁面了
			room_id = process_user_data["room_id"]
			old_socket_id = process_user_data["socket_id"]
			old_socket_id.append(request.sid)
			join_room(room_id)
			data = {str(current_user_id) : json.dumps(process_user_data)}
			redis_db.redis_instance.hset("user",mapping = data)
		else : #代表正常上線開啟諮詢頁面
			room_id = request.sid
			process_user_data["room_id"] = room_id
			process_user_data["socket_id"] = [room_id]
			process_user_data["status"] = 1
			data = {str(current_user_id) : json.dumps(process_user_data)}
			redis_db.redis_instance.hset("user",mapping = data)
		#先試看看去redis的user_history拿資料(是set)
		user_history = redis_db.redis_instance.smembers(str(current_user_id))
		#拿營養師在redis資料
		nutri  =  redis_db.redis_instance.hgetall("nutri") #return value is dictionary,but pay attention
		if user_history: #代表使用者有跟贏養師對話過
			data_for_user = {}
			for nutri_id in list(int(i) for i in user_history):
				message_status = json.loads(redis_db.redis_instance.hget("message_status",str(current_user_id)+"a"+str(nutri_id)))
				data_for_user[str(nutri_id)] = {
					"name" : nutri[str(nutri_id)]["name"],
					"status" : nutri[str(nutri_id)]["status"],
					"user_read" : message_status["user_read"],
					"user_unread" : message_status["user_unread"],
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
		socketio.emit('authentication_pass',{"user_data":user_data,"nutri_for_user":data_for_user},namespace='/user',to=room_id) 
		#通知所有在nutri namepace的營養師使用者上線
		socketio.emit('update_user_status',{"user_id":str(current_user_id)},namespace="/nutri")
	except:
		emit("authencation_fail")	
				

#----給營養師的訊息-----#
@socketio.on('message_to_nutri',namespace='/user')
def msg_to_nutri(payload):
	try:
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
		current_app.celery.send_task('celery_tasks.pushMessage',args=[key,message_obj]) #1
		#不管怎麼樣馬上回傳給傳訊息者
		user_room_id = 	json.loads(redis_db.redis_instance.hget("user",str(user_id)))["room_id"] #馬上回傳給傳訊者,需要room_id
		socketio.emit('show_self_message',{"message":message,"time":message_time},namespace='/user',to=user_room_id) #2
		#首先去redis看營養師是否在線
		nutri_data = json.loads(redis_db.redis_instance.hget("nutri",nutri_id))
		status = redis_db.redis_instance.hget("message_status", key)
		if nutri_data["status"] == 1: #如果營養師在線,傳出去
			socketio.emit('show_user_message',{"message":message,"time":message_time,"name":user_name,"user_id":user_id},namespace='/nutri',to=nutri_data["room_id"]) #3
			if status: #如果redis有對話紀錄狀態,更新使用者的已讀時間
				status = json.loads(status)
				status["user_read"] = message_time
				redis_db.redis_instance.hset("message_status", key, json.dumps(status))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('celery_tasks.updateUserRead',args=[key,message_time]) #4
			else: #更新使用者的已讀時間
				new_status = {key : {
					"user_read" : message_time
				}}
				redis_db.redis_instance.hset("message_status", mapping=new_status)
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('celery_tasks.updateUserRead',args=[key,message_time]) #4
		else: #營養師不在線,馬上更新redis
			if status: #如果redis有對話紀錄狀態
				status = json.loads(status)
				status["nutri_unread"] = message_time
				status["user_read"] = message_time
				redis_db.redis_instance.hset("message_status", key, json.dumps(status))
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('celery_tasks.updateUReadNUnread',args=[key,message_time]) #5
			else:
				new_status = {key : {
					"nutri_unread" : message_time,
					"user_read" : message_time
				}}
				redis_db.redis_instance.hset("message_status", mapping=new_status)
				#redis一更新完,馬上send_task給mongodb
				current_app.celery.send_task('celery_tasks.updateUReadNUnread',args=[key,message_time]) #5
		#訊息存入redis list	
		redis_db.redis_instance.rpush(key,json.dumps(message_obj))	 #6
		#最後user和nutri的history in redis (是set in redis)
		redis_db.redis_instance.sadd("u"+str(user_id),nutri_id) #7
		redis_db.redis_instance.sadd("n"+str(nutri_id),user_id) #8
		#和user和nutri的history存到mongodb
		current_app.celery.send_task('celery_tasks.updateHistoryList',args=[int(user_id),int(nutri_id)]) #9
	except:
		emit("authencation_fail")	
	

















#-------------------營養師--------------------#
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
			data = {str(current_nutri_id) : json.dumps(process_nutri_data)}
			redis_db.redis_instance.hset("nutri",mapping = data)
		else: #代表正常上線開啟諮詢頁面
			room_id = request.sid
			process_nutri_data["room_id"] = room_id 
			process_nutri_data["socket_id"] = [room_id]
			process_nutri_data["status"] = 1
			data = {str(current_nutri_id) : json.dumps(process_nutri_data)}
			redis_db.redis_instance.hset("nutri",mapping = data)
		#先試看看去redis的nutri_history拿資料(是set)
		nutri_history = redis_db.redis_instance.smembers(str(current_nutri_id))
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
		else: #代表營養師還沒有跟使用者對話過
			data_for_nutri = {}
		#認證通過，傳回去給營養師顯示		
		socketio.emit('authentication_pass',{"nutri_data":nutri_data,"user_for_nutri":data_for_nutri},namespace='/nutri',to=room_id) 
		#通知所有在user namepace的營養師使用者上線
		socketio.emit('update_nutri_status',{"nutri_id":str(current_nutri_id)},namespace="/user")
	except:
		emit("authencation_fail")


#----- 更新營養師的"已讀時間" ----#
@socketio.on('update_nutri_read',namespace="/nutri")
def update_nutri_read(payload):
	#payload = { "user_id" : data["user_id"],"time" : data["time"]}
	#先更新redis裡面message_status的nutri_read
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	status = json.loads(redis_db.redis_instance.hget("message_status",key))
	status["nutri_read"] = payload["time"]
	redis_db.redis_instance.hset("message_status",key,status)
	#再send_task給mongodb做message_history的nutri_read更新
	current_app.celery.send_task('celery_tasks.updateNutriRead',args=[key,payload["time"]]) 
	
#----- 更新營養師的"未讀時間" ------#
@socketio.on('update_nutri_unread',namespace="/nutri")
def update_nutri_unread(payload):
	#payload = { "user_id" : data["user_id"],"time" : data["time"]}
	#先更新redis裡面message_status的nutri_unread
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	status = json.loads(redis_db.redis_instance.hget("message_status",key))
	status["nutri_unread"] = payload["time"]
	redis_db.redis_instance.hset("message_status",key,status)
	#再send_task給mongodb做message_history的nutri_unread更新
	current_app.celery.send_task('celery_tasks.updateNutriUnRead',args=[key,payload["time"]]) 








#------------------------------#
@app.route("/test")
def f():
	return render_template("test.html")



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

















#if __name__ == "__main__":
	#app.run(port=3100,host='0.0.0.0')
    #socketio.run(app,port=3100,threaded=False)    
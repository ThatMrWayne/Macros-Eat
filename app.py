import datetime
import logging as logg
from flask import *
from model import redis_db
from model import Notify_connection
from flask_socketio import emit
from flask_socketio import SocketIO
from controller import create_app
from flask_jwt_extended import decode_token
from controller.notification import trigger_push


app = create_app()

# Flask_socketio 
socketio = SocketIO(app,cors_allowed_origins='*',ping_timeout=20)


#-----------socketIO event handler ---------#
#-----------------使用者-----------------#

#使用者登出下線
@socketio.on("user_log_out",namespace="/user")
def user_close():
	print('使用者登出')
	user_id = session["id"]
	raw_user_data = redis_db.redis_instance.hget("user",str(user_id))
	process_user_data = json.loads(raw_user_data)
	process_user_data["status"] = 0
	process_user_data["room_id"] = 0
	process_user_data["socket_id"] = [0]
	redis_db.redis_instance.hset("user",str(user_id),json.dumps(process_user_data))	
	#通知所有在nutri namepace的營養師使用者下線
	socketio.emit('update_user_status',{"user_id":str(user_id),"status":0},namespace="/nutri")
	

#使用者關掉tab下線
@socketio.on("disconnect",namespace="/user")
def user_close_tab():
	print('使用者關掉分頁下線')
	#因為登出下線頁面reload的時候一樣會觸發disconnect
	user_id = session["id"]
	raw_user_data = redis_db.redis_instance.hget("user",str(user_id))
	process_user_data = json.loads(raw_user_data)
	#所以要通知所有在nutri namepace的營養師使用者下線
	current_app.logger.info("關掉tab"+json.dumps(process_user_data["socket_id"]))
	if request.sid in process_user_data["socket_id"]:  #代表是關掉helper頁面
		process_user_data = json.loads(raw_user_data)
		process_user_data["socket_id"] = [0]
		process_user_data["status"] = 0
		process_user_data["room_id"] = 0
		redis_db.redis_instance.hset("user",str(user_id),json.dumps(process_user_data))
		socketio.emit('update_user_status',{"user_id":str(user_id),"status":0},namespace="/nutri")
	#else:
	#	print("已經是登出下線X")






#user connect驗證
@socketio.on("connect",namespace="/user")
def auth_connect_(auth):
	send_pass=False
	try:
		decode_JWT = decode_token(auth["token"])
		data=json.loads(decode_JWT["sub"]) 
		current_user_id = data["id"] #從jwt取得使用者id,identity,name去渲染使用者
		current_user_name = data["name"]
		user_data = {"member_id":current_user_id,"name":current_user_name}
		raw_user_data = redis_db.redis_instance.hget("user",str(current_user_id))
		#要看的是status
		process_user_data = json.loads(raw_user_data)
		if process_user_data["status"] == 1 :  #代表已經上線了
			emit("open_again")  #代表已經有開著諮詢頁面了,不給再開
		else : #代表正常上線
			room_id = request.sid
			process_user_data["room_id"] = room_id
			process_user_data["socket_id"] = [room_id]
			send_pass = True
			process_user_data["status"] = 1
			current_app.logger.info("正常上線"+json.dumps(process_user_data["socket_id"]))
			redis_db.redis_instance.hset("user",str(current_user_id),json.dumps(process_user_data))
			#通知所有在nutri namepace的營養師使用者上線
			socketio.emit('update_user_status',{"user_id":str(current_user_id),"status":1},namespace="/nutri")
		#先試看看去redis的user_history拿資料(是set)
		user_history = redis_db.redis_instance.smembers("u"+str(current_user_id))
		#拿營養師在redis資料
		nutri  =  redis_db.redis_instance.hgetall("nutri") #return  is dictionary,but pay attention value is string
		if user_history: #代表使用者有跟贏養師對話過
			user_history_list = list(i for i in user_history)
			data_for_user = {}
			for nutri_id in nutri.keys():
				if nutri_id in user_history_list:
					message_status = redis_db.redis_instance.hgetall("m"+str(current_user_id)+"a"+str(nutri_id))#return is dictionary,but pay attention value is string
					data_for_user[str(nutri_id)] = {
						"name" : json.loads(nutri[str(nutri_id)])["name"],
						"status" : json.loads(nutri[str(nutri_id)])["status"],
						"user_read" : int(message_status["user_read"])
					}
					try:
						temp = int(message_status["user_unread"])	
						data_for_user[str(nutri_id)]["user_unread"] = temp
					except:
						data_for_user[str(nutri_id)]["user_unread"]= -1
					try:
						temp_ = int(message_status["user_unread_count"])
						data_for_user[str(nutri_id)]["unread_count"] = temp_
					except:
						data_for_user[str(nutri_id)]["unread_count"] = 0
				else:
					data_for_user[nutri_id] = { 
						"name" : json.loads(nutri[nutri_id])["name"],
						"status" : json.loads(nutri[nutri_id])["status"],
						"user_read" : -1,
						"user_unread" : -1,
						"unread_count": 0
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
		#認證通過，傳回去給使用者顯示
		if send_pass:		
			socketio.emit('authentication_pass',{"user_data":user_data,"nutri_for_user":data_for_user},namespace='/user',to=request.sid) 
	except:
		emit("authencation_fail")	
				

#----給營養師的訊息-----#
@socketio.on('message_to_nutri',namespace='/user')
def msg_to_nutri_(payload): #payload={"message":message,"receiver":receiver,"token":jwt}
	try:
		decode_JWT = decode_token(payload["token"])
		data=json.loads(decode_JWT["sub"]) 
		user_name = data["name"]
		user_id = session["id"]
		nutri_id = payload["receiver"] #string
		key = str(user_id)+"a"+str(nutri_id) 
		message_status_key  = "m"+key
		#馬上決定訊息時間,把訊息物件存到mongodb用send_task做
		message = payload["message"]
		message_time = round((datetime.datetime.now().timestamp())*1000)
		message_obj={"time":message_time,
					"msg":message,
					"by":"u"+str(user_id),
					"to":"n"+str(nutri_id)}
		current_app.celery.send_task('task.push_message',args=[key,message_obj]) #1
		#不管怎麼樣馬上回傳給傳訊息者
		socketio.emit('show_self_message',{"message":message,"time":message_time},namespace='/user',to=request.sid) #2
		#訊息存入redis list	
		#首先去redis看營養師是否在線
		pipe = redis_db.redis_instance.pipeline()
		pipe.zadd(key,{json.dumps(message_obj):message_time})
		pipe.hget("nutri",nutri_id)
		res = pipe.execute()
		nutri_data = json.loads(res[1])
		#status = res[2]
		if nutri_data["status"] == 1: #如果營養師在線,傳出去
			socketio.emit('show_user_message',{"message":message,"time":message_time,"name":user_name,"user_id":user_id},namespace='/nutri',to=nutri_data["room_id"]) #3
		else: #營養師不在線,馬上更新redis
			pipe = redis_db.redis_instance.pipeline()
			pipe.hset(message_status_key,"nutri_unread",message_time)
			pipe.hincrby(message_status_key,"nutri_unread_count",1)
			pipe.execute()
			current_app.celery.send_task('task.update_nutri_unread',args=[key,message_time]) #5	
			current_app.celery.send_task('task.incr_nutri_unread_count',args=[key])
		#最後user和nutri的history in redis (是set in redis)
		redis_db.redis_instance.sadd("u"+str(user_id),nutri_id) #7
		redis_db.redis_instance.sadd("n"+str(nutri_id),user_id) #8
		#和user和nutri的history存到mongodb
		current_app.celery.send_task('task.update_history_list',args=[int(user_id),int(nutri_id)]) #9
		if redis_db.redis_instance.zcard(key) > 50: #如果大於50筆					 
			redis_db.redis_instance.zpopmin(key) #從pop掉value最小,時間最早的那筆訊息
		#web notification
		result = Notify_connection.get_subscription_info(int(nutri_id),2)
		if result == "error":
			current_app.logger.info('從資料庫取得subscription資料時出錯')
		else:
			res = trigger_push(
				result,
				"Message received~",
				f"Got a new message from {user_name}."
			)
			current_app.logger.info(res)
	except:
		emit("authencation_fail")	
	

#----- 更新使用者的"已讀時間" ----#
@socketio.on('update_user_read',namespace="/user")
def update_user_read_(payload):
	#payload = { "nutri_id" : data["nutri_id"],"time" : data["time"]}
	#先send_task給mongodb做message_history的user_read更新
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	message_status_key  = "m"+ key
	current_app.celery.send_task('task.update_user_read',args=[key,payload["time"]])
	#再更新redis裡面message_status的user_read
	redis_db.redis_instance.hset(message_status_key,"user_read",payload["time"])	

#----- 更新使用者的"未讀時間" ----#
@socketio.on('update_user_unread',namespace="/user")
def update_user_unread_(payload):
	#payload = { "nutri_id" : data["nutri_id"],"time" : data["time"]}
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	message_status_key  = "m"+ key
	#先send_task給mongodb做message_history的user_unread更新
	current_app.celery.send_task('task.update_user_unread',args=[key,payload["time"]])
	#再更新redis裡面message_status的user_unread
	redis_db.redis_instance.hset(message_status_key,"user_unread",payload["time"])


# ------ 更新使用者的未讀數量 -------#
@socketio.on('update_user_unread_cnt',namespace="/user")
def update_user_unread_cnt(payload):
	#payload = {"nutri_id":data["nutri_id"],"count":nutritionist[String(data["nutri_id"])]["unread_count"]}
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	message_status_key  = "m"+ key
	#先send_task給mongodb做message_history的user_unread_count更新
	current_app.celery.send_task('task.update_user_unread_count',args=[key,payload["count"]])
	#再更新redis裡面message_status的user_unread
	redis_db.redis_instance.hset(message_status_key,"user_unread_count",str(payload["count"]))







#----- 更新使用者的"已讀時間"和"未讀時間" ----#
@socketio.on('update_user_read_unread',namespace="/user")
def update_user_read_unread_(payload):
	#payload = {"user_read":nutritionist[nutri_id]["user_read"],"user_unread":-1,"nutri_id":on_which_nutri}}
	#先更新redis裡面message_status的user_read和user_unread
	user_id = session["id"]
	key = str(user_id) + "a" + str(payload["nutri_id"])
	message_status_key  = "m"+ key
	redis_db.redis_instance.hset(message_status_key,mapping={"user_read":payload["user_read"],"user_unread":-1})
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
	process_nutri_data["socket_id"] = [0]
	redis_db.redis_instance.hset("nutri",str(nutri_id),json.dumps(process_nutri_data))	
	#通知所有在user namepace的營養師使用者下線
	socketio.emit('update_nutri_status',{"nutri_id":str(nutri_id),"status":0},namespace="/user")


#營養師關掉tab下線
@socketio.on("disconnect",namespace="/nutri")
def nutri_close_tab():
	print('營養師關掉分頁下線')
	#因為登出下線頁面reload的時候一樣會觸發disconnec
	nutri_id = session["id"]
	raw_nutri_data = redis_db.redis_instance.hget("nutri",str(nutri_id))
	process_nutri_data = json.loads(raw_nutri_data)
	#if request.sid not in  process_nutri_data["socket_id"]:
	#	print("已經是登出下線Y")
	#else:	
	if request.sid in process_nutri_data["socket_id"]:	
		#要通知所有在user namepace的營養師使用者下線
		process_nutri_data["socket_id"] = [0]
		process_nutri_data["status"] = 0
		process_nutri_data["room_id"] = 0
		socketio.emit('update_nutri_status',{"nutri_id":str(nutri_id),"status":0},namespace="/user")
		redis_db.redis_instance.hset("nutri",str(nutri_id),json.dumps(process_nutri_data))




@socketio.on('connect',namespace='/nutri')
def auth_connect_nutri(auth):
	send_pass = False
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
			emit('open_again')
		else: #代表正常上線開啟諮詢頁面
			room_id = request.sid
			process_nutri_data["room_id"] = room_id 
			process_nutri_data["socket_id"] = [room_id]
			process_nutri_data["status"] = 1
			redis_db.redis_instance.hset("nutri",str(current_nutri_id),json.dumps(process_nutri_data))
			#通知所有在user namepace的使用者上線
			socketio.emit('update_nutri_status',{"nutri_id":str(current_nutri_id),"name":current_nutri_name,"status":1},namespace="/user")
			send_pass = True
		#先試看看去redis的nutri_history拿資料(是set)
		nutri_history = redis_db.redis_instance.smembers("n"+str(current_nutri_id))
		#拿使用者在redis資料
		user  =  redis_db.redis_instance.hgetall("user") #return value is dictionary
		if nutri_history: #代表贏養師有跟使用者對話過
			data_for_nutri = {}
			for user_id in list(int(i) for i in nutri_history):
				message_status = redis_db.redis_instance.hgetall("m"+str(user_id)+"a"+str(current_nutri_id))
				data_for_nutri[str(user_id)] = {
					"name" : json.loads(user[str(user_id)])["name"],
					"status" : json.loads(user[str(user_id)])["status"],
					"nutri_unread" : int(message_status["nutri_unread"]),
					"unread_count": int(message_status["nutri_unread_count"])
				}
				try:
					temp = int(message_status["nutri_read"])
					data_for_nutri[str(user_id)]["nutri_read"]=  temp
				except:
					data_for_nutri[str(user_id)]["nutri_read"]=  -1	
		else: #代表營養師還沒有跟使用者對話過
			data_for_nutri = {}
		#認證通過，傳回去給營養師顯示	
		if send_pass: 	
			socketio.emit('authentication_pass',{"nutri_data":nutri_data,"user_for_nutri":data_for_nutri},namespace='/nutri',to=request.sid) 
	except:
		emit("authencation_fail")


#----- 更新營養師的"已讀時間" ----#
@socketio.on('update_nutri_read',namespace="/nutri")
def update_nutri_read_(payload):
	#payload = { "user_id" : data["user_id"],"time" : data["time"]}
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	message_status_key  = "m"+ key
	#先send_task給mongodb做message_history的nutri_read更新
	current_app.celery.send_task('task.update_nutri_read',args=[key,payload["time"]]) 
	#再更新redis裡面message_status的nutri_read
	redis_db.redis_instance.hset(message_status_key,"nutri_read",payload["time"])
	
#----- 更新營養師的"未讀時間" ------#
@socketio.on('update_nutri_unread',namespace="/nutri")
def update_nutri_unread_(payload):
	#payload = { "user_id" : data["user_id"],"time" : data["time"]}
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	message_status_key  = "m"+ key
	#先send_task給mongodb做message_history的nutri_unread更新
	current_app.celery.send_task('task.update_nutri_unread',args=[key,payload["time"]])
	#再更新redis裡面message_status的nutri_unread
	redis_db.redis_instance.hset(message_status_key,"nutri_unread",payload["time"])



# ------ 更新營養師的未讀數量 -------#
@socketio.on('update_nutri_unread_cnt',namespace="/nutri")
def update_nutri_unread_cnt(payload):
	#payload = {"user_id":data["user_id"],"count":user[String(data["user_id"])]["unread_count"]}
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	message_status_key  = "m"+ key
	#先send_task給mongodb做message_history的nutri_unread_count更新
	current_app.celery.send_task('task.update_nutri_unread_count',args=[key,payload["count"]])
	#再更新redis裡面message_status的nutri_unread
	redis_db.redis_instance.hset(message_status_key,"nutri_unread_count",str(payload["count"]))





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
		message_status_key  = "m"+key
		#馬上決定訊息時間,把訊息物件存到mongodb用send_task做
		message = payload["message"]
		message_time = round((datetime.datetime.now().timestamp())*1000)
		message_obj={"time":message_time,
					"msg":message,
					"by":"n"+str(nutri_id),
					"to":"u"+str(user_id)}
		current_app.celery.send_task('task.push_message',args=[key,message_obj]) #1
		#不管怎麼樣馬上回傳給傳訊息者
		socketio.emit('show_self_message',{"message":message,"time":message_time},namespace='/nutri',to=request.sid)
		pipe = redis_db.redis_instance.pipeline()
		pipe.zadd(key,{json.dumps(message_obj):message_time})
		pipe.hget("user",user_id)
		res = pipe.execute()
		user_data = json.loads(res[1])
		if user_data["status"] == 1: #如果使用者在線,傳出去(要再看socket_id裡有沒有,有才傳)
			socketio.emit('show_nutri_message',{"message":message,"time":message_time,"name":nutri_name,"nutri_id":nutri_id},namespace='/user',to=user_data["room_id"]) #3
		else: #使用者不在線,馬上更新redis
			#如果redis有對話紀錄狀態(應該說一定已經有status,因為是使用者先傳訊息給營養師)
			pipe = redis_db.redis_instance.pipeline()
			pipe.hset(message_status_key,"user_unread",message_time)
			pipe.hincrby(message_status_key,"user_unread_count",1)
			pipe.execute()
			#redis一更新完,馬上send_task給mongodb
			current_app.celery.send_task('task.update_user_unread',args=[key,message_time]) #5
			current_app.celery.send_task('task.incr_user_unread_count',args=[key])
		#最後user和nutri的history in redis (是set in redis)和user和nutri的history存到mongodb
		#這邊不用再存一次,因為使用者一傳就已經新增紀錄了
		if redis_db.redis_instance.zcard(key) > 50: #如果大於50筆					 
			redis_db.redis_instance.zpopmin(key) #從pop掉value最小,時間最早的那筆訊息
		#web notification
		result = Notify_connection.get_subscription_info(int(user_id),1)
		if result == "error":
			current_app.logger.info('從資料庫取得subscription資料時出錯')
		else:
			res = trigger_push(
				result,
				"Message received~",
				f"Got a new message from {nutri_name}."
			)
			current_app.logger.info(res)
	except:
		emit("authencation_fail")


#----- 更新營養師的"已讀時間"和"未讀時間" ----#
@socketio.on('update_nutri_read_unread',namespace="/nutri")
def update_nutri_read_unread_(payload):
	#payload = {"nutri_read":user[user_id]["nutri_read"],"nutri_unread":-1,"user_id":on_which_user}
	#先更新redis裡面message_status的user_read和user_unread
	nutri_id = session["id"]
	key = str(payload["user_id"]) + "a" + str(nutri_id)
	message_status_key  = "m"+ key
	redis_db.redis_instance.hset(message_status_key,mapping={"nutri_read":payload["nutri_read"],"nutri_unread":-1})
	#再send_task給mongodb做message_history的user_unread更新
	current_app.celery.send_task('task.update_nutri_read_unread',args=[key,payload["nutri_read"],-1])




#------- 觸發顯示typing效果 -------#
@socketio.on("trigger_typing",namespace="/user")
def show_typing_user(payload):
	try:
		decode_JWT = decode_token(payload["token"])
		data=json.loads(decode_JWT["sub"]) 
		user_id = data["id"]
		nutri_id = payload["nutri_id"]
		user_name = data["name"]
		nutri_data = redis_db.redis_instance.hget("nutri",str(nutri_id))
		nutri_data = json.loads(nutri_data)
		if nutri_data["status"] == 1: #如果在線才傳
			socketio.emit("show_typing",{"user_name":user_name,"user_id":user_id },namespace="/nutri",to=nutri_data["room_id"])
	except:
		emit("authencation_fail")

#------- 觸發顯示typing效果 -------#
@socketio.on("trigger_typing",namespace="/nutri")
def show_typing_nutri(payload):
	try:
		decode_JWT = decode_token(payload["token"])
		data=json.loads(decode_JWT["sub"]) 
		nutri_id = data["id"]
		user_id = payload["user_id"]
		nutri_name = data["name"]
		user_data = redis_db.redis_instance.hget("user",str(user_id))
		user_data = json.loads(user_data)
		if user_data["status"] == 1: #如果在線才傳
			socketio.emit("show_typing",{"nutri_name":nutri_name,"nutri_id":nutri_id },namespace="/user",to=user_data["room_id"])
	except:
		emit("authencation_fail")	






if __name__ != "__main__":
	gunicorn_logger = logg.getLogger('gunicorn.error')
	app.logger.handlers = gunicorn_logger.handlers
	app.logger.setLevel(gunicorn_logger.level)



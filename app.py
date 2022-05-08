import time
import threading
from flask import *
from flask_jwt_extended import JWTManager
from flask_jwt_extended import decode_token
from flask_socketio import SocketIO
from werkzeug.wrappers import Request, Response
from authen import auth_blueprint
from food import food_blueprint
from daily_record import record_blueprint
from daily_diet import diet_blueprint
from plan import plan_blueprint
from weight import weight_blueprint
import config
from model import db



app=Flask(__name__,static_folder="static",static_url_path="/")
app.config.from_object(config.DevelopmentConfig)
app.register_blueprint(auth_blueprint)
app.register_blueprint(food_blueprint)
app.register_blueprint(record_blueprint)
app.register_blueprint(plan_blueprint)
app.register_blueprint(diet_blueprint)
app.register_blueprint(weight_blueprint)

jwt = JWTManager(app)

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








@app.route("/test")
def f():
	return render_template("test.html")



@app.route("/getfood")
def food():
	print(time.time())
	food = request.args.get("food")
	c = db.cnxpool.get_connection()
	#cursor = c.cursor(dictionary = True)
	#cursor.execute("select name from food where MATCH(name) AGAINST(%(food)s IN NATURAL LANGUAGE MODE)",{"food":food})
	#food_data = cursor.fetchall()
	#result = {"data":food_data}
	time.sleep(2)
	c.close()
	result={"data":1}
	print(threading.current_thread().ident)
	print(time.time())
	return jsonify(result), 200
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






if __name__ == "__main__":
	app.run(port=3100,host='0.0.0.0')
    #socketio.run(app,port=3100,threaded=False)    
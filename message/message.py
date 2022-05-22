import json
from flask import request
from flask import Blueprint
from flask import jsonify 
from flask import make_response
from flask import session
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import db
from model import redis_db
from model import mongo_db
from model.connection import Connection
from utils import Utils_obj
from flask import current_app



message = Blueprint('message', __name__)


def jwt_required_for_message():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except:
                print('access_token已失效 或 request根本沒有JWT')
                return jsonify( { "error" : True , "message" : "拒絕存取" } ), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper



def binary_search(target, etime):
    low = 0
    high = len(target) - 1
    while low <= high:
        mid = (low+high)//2
        guess = target[mid]
        if guess["time"] == etime:
            return mid
        elif guess["time"] > etime:
            high = mid-1
        elif guess["time"] < etime:
            low = mid+1
    return None



@message.route("/api/read-message",methods=["GET"])
@jwt_required_for_message()
def read_message():
    etime = request.args.get("etime")
    identity = request.args.get("identity")
    id = request.args.get("id")
    if not etime or not identity or not id : 
        return jsonify({"data":[]}), 200  
    elif not etime.isdigit() or not identity.isdigit() or not id.isdigit():
        return jsonify({"data":[]}), 200 
    else: 
        if int(identity) == 1: #代表是營養師要拿跟使用者的對話紀錄
            key = id+"a"+str(session["id"])
        else: #代表是使用者要拿跟營養師的對話紀錄
            key = str(session["id"]) +"a"+id   
        #先從redis拿
        try:
            messages = redis_db.redis_instance.lrange(key,0,-1)
            messages = list(json.loads(i) for i in messages)
            print(messages)
            #一次拿11筆,是不是用binary search比較快
            match_index = binary_search(messages, int(etime))
            print(match_index)
            if match_index : #代表有前11筆
                data = messages[match_index:match_index-11:-1]#從最新(時間最大)到最舊(時間最小)
                if len(data)==11:
                    return jsonify({"data":data}), 200 
            #沒有的話就要去mongodb拿
            print('去mongo拿')
            collection = mongo_db.db.message_history
            pipeline_read=[
                    {
                        "$match": {"history_id": key}
                    },

                    {
                        "$project": {
                            "message": {
                                "$filter" :{
                                    "input": "$message",
                                    "as": "message",
                                    "cond": {
                                        "$lte":["$$message.time",int(etime)],
                                    }
                                }
                            }
                        }
                    },
                    {
                        "$unwind": "$message"
                    },
                    {
                        "$sort":{
                            "message":-1,
                        }
                    },
                    {
                        "$limit":11
                    },
                    {
                        "$group":{
                            "_id":"$_id",
                            "message":{"$push":"$message"}
                        }
                    }			
                ]
            read_message = 	collection.aggregate(pipeline=pipeline_read)
            print(read_message)
            for i in read_message:
                data = i["message"] #從最新(時間最大)到最舊(時間最小)
                print(data)
            return jsonify({"data":data}), 200   
        except:
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500         
                    
                

                
@message.route("/api/unread-message",methods=["GET"])
@jwt_required_for_message()
def unread_message():
    print('未讀啊啊啊啊')
    print(request)
    stime = request.args.get("stime")
    print(stime)
    etime = request.args.get("etime")
    identity = request.args.get("identity")
    id = request.args.get("id")
    if not etime or not stime or not identity or not id : 
        return jsonify({"data":[]}), 200  
    elif not etime.isdigit() or not identity.isdigit() or not id.isdigit():
        return jsonify({"data":[]}), 200 
    elif stime!="-1" and not stime.isdigit():
        return jsonify({"data":[]}), 200     
    else: 
        if int(identity) == 1: #代表是營養師要拿跟使用者的對話紀錄
            key = id+"a"+str(session["id"])
            print(key)
        else: #代表是使用者要拿跟營養師的對話紀錄
            key = str(session["id"]) +"a"+id   
        #先從redis拿
        try: #是list不是hash
            messages = redis_db.redis_instance.lrange(key,0,-1)
            print(messages)
            print(type(messages))
            print(type(messages[0]))
            print(messages[0])
            messages = list(json.loads(i) for i in messages)
            print(messages)
            #是不是用binary search比較快
            if stime=="-1":
                end_match_index = binary_search(messages,int(etime))
                print(end_match_index)
                data = messages[end_match_index::-1]
                print("打他:",data)
                return jsonify({"data":data}), 200 
            else:    
                start_match_index = binary_search(messages, int(stime))
                end_match_index = binary_search(messages,int(etime))
                if start_match_index:
                    data = messages[end_match_index:start_match_index:-1]
                    #從最新(時間最大)到最舊(時間最小)
                    return jsonify({"data":data}), 200 
                else: #沒有的話就要去mongodb拿
                    collection = mongo_db.db.message_history
                    pipeline_unread=[
                        {
                            "$match": {"history_id": key}
                        },

                        {
                            "$project": {
                                "message": {
                                    "$filter" :{
                                        "input": "$message",
                                        "as": "message",
                                        "cond": {
                                            "$and":[
                                                {"$lte":["$$message.time",int(etime)]},
                                                {"$gt":["$$message.time",int(stime)]},
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                    unread_message = collection.aggregate(pipeline=pipeline_unread)
                    for i in unread_message:
                        data = list(reversed(i["message"])) #從最新(時間最大)到最舊(時間最小)
                    return jsonify({"data":data}), 200   
        except:
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500         
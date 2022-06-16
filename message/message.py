import json
from flask import request
from flask import Blueprint
from flask import jsonify 
from flask import session
from flask_jwt_extended import verify_jwt_in_request
from functools import wraps
from model import redis_db
from model import mongo_db




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
        if int(identity) == 1: #means nutritionist get meaasge with user 
            key = id+"a"+str(session["id"])
        else: #means user get message with nutritionist
            key = str(session["id"]) +"a"+id   
        #from redis
        try:
            messages =  redis_db.redis_instance.zrange(key,-1,int(etime),byscore=True) #return list,member is still string type
            if messages:
                data = messages[-1:-12:-1] #從最新(時間最大)到最舊(時間最小)
                if len(data)==11:
                    data = list(json.loads(i) for i in data)
                    return jsonify({"data":data}), 200
            #get from mongo
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
            for i in read_message:
                data = i["message"] #從最新(時間最大)到最舊(時間最小)
            return jsonify({"data":data}), 200   
        except:
            response_msg={
                    "error":True,
                    "message":"不好意思,資料庫暫時有問題,維修中"}
            return jsonify(response_msg), 500         
                    
                

                
@message.route("/api/unread-message",methods=["GET"])
@jwt_required_for_message()
def unread_message():
    stime = request.args.get("stime")
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
        if int(identity) == 1: #means nutritionist get unread message with user
            key = id+"a"+str(session["id"])
            print(key)
        else: #means user get unread message with nutritionist
            key = str(session["id"]) +"a"+id   
        #from redis
        try: 
            messages =  redis_db.redis_instance.zrange(key,0,-1) #return list,member is still string type
            messages = list(json.loads(i) for i in messages)
            #binary search
            if stime=="-1":
                end_match_index = binary_search(messages,int(etime))
                data = messages[end_match_index::-1]
                return jsonify({"data":data}), 200 
            else:    
                start_match_index = binary_search(messages, int(stime))
                end_match_index = binary_search(messages,int(etime))
                if start_match_index:
                    data = messages[end_match_index:start_match_index:-1]
                    #從最新(時間最大)到最舊(時間最小)
                    return jsonify({"data":data}), 200 
                else: #gry form mongo
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
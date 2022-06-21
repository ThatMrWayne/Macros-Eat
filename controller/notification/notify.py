import json
from flask import Blueprint
from flask import request
from flask import jsonify
from flask import current_app
from flask_jwt_extended import decode_token
from model import Notify_connection
from pywebpush import webpush, WebPushException

notify = Blueprint('notify',__name__)


@notify.route("/api/push-subscriptions", methods=["POST"])
def create_push_subscription():
    json_data = request.get_json()
    jwt = json_data["token"]
    decode_JWT = decode_token(jwt)
    data=json.loads(decode_JWT["sub"]) 
    id_ = data["id"] #從jwt取得id
    identity = data["identity"]
    subcsription = json.loads(json_data['subscription_json'])
    result = Notify_connection.check_if_subscribe(identity,subcsription,id_)
    if result == "error":
        response_msg={
                        "error":True,
                        "message":"不好意思,資料庫暫時有問題,維修中"}
        return jsonify(response_msg), 500
    else:
        return jsonify(result), 200


def trigger_push_notification(push_subscription, title, body):
    try:
        sub = {"endpoint":push_subscription["endpoint"],
               "expirationTime":push_subscription["expirationTime"],
               "keys":{
                   "auth":push_subscription["auth"],
                   "p256dh":push_subscription["p256dh"]
               } 
           }
        print('sub:',sub)   
        response = webpush(
            subscription_info=sub,
            data=json.dumps({"title": title, "body": body}),
            vapid_private_key=current_app.config["VAPID_PRIVATE_KEY"],
            vapid_claims={
                "sub": "mailto:{}".format(
                    current_app.config["VAPID_CLAIM_EMAIL"])
            }
        )
        return response.ok
    except WebPushException as ex:
        if ex.response and ex.response.json():
            extra = ex.response.json()
            print("Remote service replied with a {}:{}, {}",
                  extra.code,
                  extra.errno,
                  extra.message
                  )
        return False


def trigger_push_notifications_for_subscriptions(subscriptions, title, body):
    return [trigger_push_notification(subscription, title, body)
            for subscription in subscriptions]        



import json
from flask_jwt_extended import decode_token



class Utils:
    @staticmethod
    def get_member_id_from_jwt(request):
        jwt_token = request.headers.get("AUTHORIZATION").split(" ")[1]
        decode_jwt = decode_token(jwt_token)
        user_id = json.loads(decode_jwt["sub"])["id"]
        return user_id
    @staticmethod    
    def get_email_from_jwt(request):
        jwt_token = request.headers.get("AUTHORIZATION").split(" ")[1]
        decode_jwt = decode_token(jwt_token)
        user_email = json.loads(decode_jwt["sub"])["email"]
        return user_email
    @staticmethod
    def get_member_identity_from_jwt(request):
        jwt_token = request.headers.get("AUTHORIZATION").split(" ")[1]
        decode_jwt = decode_token(jwt_token)
        print(decode_jwt)
        user_identity = json.loads(decode_jwt["sub"])["identity"]
        return user_identity

Utils_obj =  Utils()       
                
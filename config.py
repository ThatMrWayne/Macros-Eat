import os
from dotenv import load_dotenv

load_dotenv()
#由.env檔匯入mysql資料庫使用者與密碼
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_USER = os.getenv('MYSQL_USER')
JWT_SECRET=os.getenv('JWT_SECRET_KEY')
KEY=os.getenv("SECRET_KEY")
CACHE_TYPE_ = os.getenv("CACHE_TYPE")
CACHE_REDIS_HOST_=os.getenv("CACHE_REDIS_HOST")
CACHE_REDIS_PORT_=os.getenv("CACHE_REDIS_PORT")
CELERY_BROKER_URL_ = os.getenv("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND_ = os.getenv("CELERY_RESULT_BACKEND")
MONGODB_URL_ =os.getenv("MONGODB_URL")







class Config:
    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    ENV = 'development'
    DEBUG = True
    JWT_SECRET_KEY = JWT_SECRET
    JWT_TOKEN_LOCATION = "headers"
    JSON_AS_ASCII = False
    TEMPLATES_AUTO_RELOAD = True
    SECRET_KEY = KEY
    CACHE_TYPE = CACHE_TYPE_
    CACHE_REDIS_HOST = CACHE_REDIS_HOST_
    CACHE_REDIS_PORT =CACHE_REDIS_PORT_
    CELERY_BROKER_URL = CELERY_BROKER_URL_
    CELERY_RESULT_BACKEND = CELERY_RESULT_BACKEND_
    



class ProductionConfig(Config):
    DEBUG = False
    #SECRET_KEY = KEY    
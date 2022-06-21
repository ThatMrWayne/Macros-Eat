from flask import *
import config
from celery import Celery
from flask_jwt_extended import JWTManager
from controller.authen import auth_blueprint
from controller.daily_diet import diet_blueprint
from controller.daily_record import record_blueprint
from controller.food import food_blueprint
from controller.message import message_blueprint
from controller.plan import plan_blueprint
from controller.weight import weight_blueprint
from controller.main import route_blueprint
from controller.notification import notify_blueprint
from authlib.integrations.flask_client import OAuth



def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config["CELERY_RESULT_BACKEND"],
        broker=app.config["CELERY_BROKER_URL"],
    )
    celery.conf.update(app.config)
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    celery.Task = ContextTask
    return celery



def create_app():
    app=Flask(__name__)

    #config for flask object
    app.config.from_object(config.ProductionConfig)

    #blueprint register
    app.register_blueprint(auth_blueprint)
    app.register_blueprint(food_blueprint)
    app.register_blueprint(record_blueprint)
    app.register_blueprint(plan_blueprint)
    app.register_blueprint(diet_blueprint)
    app.register_blueprint(weight_blueprint)
    app.register_blueprint(message_blueprint)
    app.register_blueprint(notify_blueprint)
    app.register_blueprint(route_blueprint)

    celery_obj = make_celery(app)
    app.celery = celery_obj

    # attach JWT
    jwt = JWTManager(app)

    #oauth
    oauth_obj = OAuth(app)
    oauth_obj.register(
            name='google',
            client_id=app.config["GOOGLE_CLIENT_ID"],
            client_secret=app.config["GOOGLE_CLIENT_SECRET"],
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={
                'scope': 'openid email profile'
            }
    )
    app.oauth = oauth_obj

    return app




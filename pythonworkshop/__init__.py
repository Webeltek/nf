#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request
import jinja2
import os
from passlib.hash import bcrypt_sha256
from flask_moment import Moment
from flask_mail import Mail
from flask_moment import Moment
#from flask_login import LoginManager
from config import config, DevelopmentConfig
from flask_executor import Executor
#from flask_socketio import SocketIO
from flask_cors import CORS, cross_origin


templ_dir = os.path.abspath('pythonworkshop/templates')
static_dir = os.path.abspath('pythonworkshop/static')
print('Static folder : ' + str(static_dir))

mail = Mail()
moment = Moment()
executor = Executor()
#socketio = SocketIO(cors_allowed_origins="*")

 #- only views that don't use FlaskForm use the provided CSRF extension

def create_app(config_name):
  app = Flask(__name__ , static_folder=static_dir, template_folder=templ_dir)
  print('config_name : ' + str(config[config_name]) )
  #app.config.from_object(config[config_name]) warning!!! doesn't instatiate config object!!!
  app.config.from_envvar('DOTENV_FILE')
  #python-dotenv doesn't override existing envvar SECRET_KEY value which defauts to None!
  app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
  config[config_name].init_app(app)

  mail.init_app(app)
  moment.init_app(app)
  executor.init_app(app)

  cors = CORS(app, resources={r"/api/*/*": {"origins": ["http://localhost","https://api.vipps.no/access-management-1.0/access/.well-known/*"]},r"/*":{["https://api.vipps.no/access-management-1.0/access/.well-known/*"]}},supports_credentials=True)
  #login_manager.init_app(app)
  print('mail server: ' + app.config['MAIL_SERVER'])
  print('ENV value: ' + app.config['ENV'])
  print('DEBUG value :' + str(app.config['DEBUG']))
  print('mail user '+ str(os.environ.get('MAIL_USERNAME')) )
  from .main_bp import main_bp
  app.register_blueprint(main_bp)

  from .auth_bp import auth_bp
  app.register_blueprint(auth_bp)

  #socketio.init_app(app)

  return app



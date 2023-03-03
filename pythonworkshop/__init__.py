#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request,session
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

from oidcmsg.configure import create_from_config_file

from oidcrp.configure import Configuration
from oidcrp.configure import RPConfiguration


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
  #app.config.from_object(config[config_name]) warning!!render_template,  doesn't instatiate config object!!!
  app.config.from_envvar('DOTENV_FILE')
  #python-dotenv doesn't override existing envvar SECRET_KEY value which defauts to None!
  #when using python-dotenv os.environ or os.getenv  use envvar as if they came from actual environment.
  app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
  config[config_name].init_app(app)

  mail.init_app(app)
  moment.init_app(app)
  executor.init_app(app)

  cors = CORS(app, resources={r"/api/*/*": {"origins": ["http://localhost","https://api.vipps.no/access-management-1.0/access/.well-known/*"]},r"/*":{"origins":["https://api.vipps.no/access-management-1.0/access/.well-known/*"]}},supports_credentials=True)
  #login_manager.init_app(app)
  print('mail server: ' + app.config['MAIL_SERVER'])
  print('ENV value: ' + app.config['ENV'])
  print('DEBUG value :' + str(app.config['DEBUG']))
  print('mail user '+ str(os.environ.get('MAIL_USERNAME')) )
  from .main_bp import main_bp
  app.register_blueprint(main_bp)
  from .auth_bp import auth_bp
  app.register_blueprint(auth_bp)

  try:
    from .oidc_rp import application
  except ImportError:
    import application
  dir_path = os.path.dirname(os.path.realpath(__file__))
  conf = os.path.abspath('pythonworkshop')+"/oidc_rp/conf.json"
  name = 'oidc_rp'
  template_dir = os.path.join(dir_path, 'templates')
  _config = create_from_config_file(Configuration,
                                    entity_conf=[{"class": RPConfiguration, "attr": "rp"}],
                                    filename=conf)
  application.oidc_provider_init_app(_config.rp, name,template_folder=template_dir)

  #socketio.init_app(app)

  return app



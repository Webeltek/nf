#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, render_template, request,session
from flask_session import Session
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
from flask_caching import Cache

from oidcmsg.configure import create_from_config_file
from oidcrp.configure import Configuration
from oidcrp.configure import RPConfiguration

import re
from cryptojwt import KeyJar
from cryptojwt.key_jar import init_key_jar
from flask.app import Flask
from flask import current_app
from oidcrp.rp_handler import RPHandler
from flask_sqlalchemy import SQLAlchemy

templ_dir = os.path.abspath('pythonworkshop/templates')
static_dir = os.path.abspath('pythonworkshop/static')
#print('Static folder : ' + str(static_dir))

db = SQLAlchemy()
mail = Mail()
moment = Moment()
executor = Executor()
tmp_dir = os.path.abspath('tmp')
cache = Cache()
#socketio = SocketIO(cors_allowed_origins="*")

 #- only views that don't use FlaskForm use the provided CSRF extension

def create_app(config_name):
  conf = os.path.abspath('pythonworkshop')+"/oidc_rp/conf.json"
  _config = create_from_config_file(Configuration, entity_conf=[{"class": RPConfiguration, "attr": "rp"}],filename=conf)
  app=oidc_provider_init_app(_config.rp,template_folder=templ_dir)

  #print('config_name : ' + str(config[config_name]) )
  #app.config.from_object(config[config_name]) warning!!render_template,  doesn't instatiate config object!!!
  #app.config.from_envvar('DOTENV_FILE')
  #python-dotenv doesn't override existing envvar SECRET_KEY value which defauts to None!
  #when using python-dotenv os.environ or os.getenv  use envvar as if they came from actual environment.
  #app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
  config[config_name].init_app(app)

  mail.init_app(app)
  moment.init_app(app)
  executor.init_app(app)

  username = 'webekiog_nf_user'
  password = 'nfvinter2022'
  database = 'webekiog_nf_db'
  app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{username}:{password}@localhost:5432/{database}"
  db.init_app(app)

  cache.init_app(app,config={
    "CACHE_TYPE": "FileSystemCache",  # Flask-Caching related configs
    "CACHE_DEFAULT_TIMEOUT": 3600,
    "CACHE_THRESHOLD": 10000,
    "CACHE_DIR": tmp_dir})

  #login_manager.init_app(app)
  #print('mail server: ' + app.config['MAIL_SERVER'])
  #print('ENV value: ' + app.config['ENV'])
  #print('DEBUG value :' + str(app.config['DEBUG']))
  print('mail user '+ str(os.environ.get('MAIL_USERNAME')) )
  from .main_bp import main_bp
  app.register_blueprint(main_bp)
  from .auth_bp import auth_bp
  app.register_blueprint(auth_bp)

  #socketio.init_app(app)
  return app

def init_oidc_rp_handler(app):
    _rp_conf = app.rp_config

    if _rp_conf.key_conf:
        _kj = init_key_jar(**_rp_conf.key_conf)
        _path = _rp_conf.key_conf['public_path']
        # removes ./ and / from the begin of the string
        _path = re.sub('^(.)/', '', _path)
    else:
        _kj = KeyJar()
        _path = ''
    _kj.httpc_params = _rp_conf.httpc_params

    rph = RPHandler(_rp_conf.base_url, _rp_conf.clients, services=_rp_conf.services,
                    hash_seed=_rp_conf.hash_seed, keyjar=_kj, jwks_path=_path,
                    httpc_params=_rp_conf.httpc_params)

    return rph


def oidc_provider_init_app(config, name=None, **kwargs):
    name = name or __name__
    app = Flask(__name__ , static_folder=static_dir, **kwargs)
    
    cors = CORS(app,resources={
        r"/api/*/*": {"origins": [
        "https://138.109-247-35.customer.lyse.net",
        "http://localhost",
        "http://localhost:4200",
        "https://localhost",
        "https://localhost",
        "https://192.168.3.225",
        "https://webeltek.line.pm",
        "https://webeltek.org"
        ], "allow_headers":"*"},
        r"/*": {"origins":[
            "https://138.109-247-35.customer.lyse.net",
            "http://localhost",
            "https://localhost",
            "https://webeltek.line.pm",
            "https://webeltek.org",
            "https://api.vipps.no/epayment/v1/payments",
            "https://api.vipps.no/access-management-1.0/access/",
            "https://apitest.vipps.no/epayment/v1/payments",
            "https://apitest.vipps.no/access-management-1.0/access/"
            ],"allow_headers":"*"}
        },supports_credentials=True  )
    
    app.rp_config = config
    app.config.from_envvar('DOTENV_FILE')

    # Session key for the application session
    #app.config['SECRET_KEY'] = os.urandom(12).hex()
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=False,
    SESSION_COOKIE_SAMESITE='None',
)
    Session(app)

    app.users = {'test_user': {'name': 'Testing Name'}}

    try:
        from .oidc_rp.views import oidc_rp_views
    except ImportError:
        from .oidc_rp.views import oidc_rp_views

    app.register_blueprint(oidc_rp_views)

    # Initialize the oidc_provider after views to be able to set correct urls
    app.rph = init_oidc_rp_handler(app)

    return app



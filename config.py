import os

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') 
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in \
        ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    FLASKY_MAIL_SUBJECT_PREFIX = os.environ.get('FLASKY_MAIL_SUBJECT_PREFIX')
    FLASKY_MAIL_SENDER = os.environ.get('FLASKY_MAIL_SENDER')
    FLASKY_ADMIN = os.environ.get('FLASKY_ADMIN')

    @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
  @classmethod
  def init_app(cls, app):
    Config.init_app(app)

class UnixConfig(ProductionConfig):
    @classmethod
    def init_app(cls, app):
        ProductionConfig.init_app(app)

        # log to syslog
        import logging
        from logging.handlers import SysLogHandler
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.INFO)
        app.logger.addHandler(syslog_handler)
 
config = { 
        'development' : DevelopmentConfig,
        'production' : ProductionConfig,
        'unix' : UnixConfig
         }


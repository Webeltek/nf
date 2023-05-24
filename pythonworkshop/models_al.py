import datetime
from passlib.hash import bcrypt_sha256

import jwt
from itsdangerous.url_safe import URLSafeSerializer
from . import current_app
from . import db

class User(db.Model):
  __tablename__ = "nf_user"
  id = db.Column(db.Integer, primary_key=True)
  user_email = db.Column(db.String,default='first_email',unique=True)
  user_pass_hash = db.Column(db.String, default='initial hash')
  vipps_sub = db.Column(db.String, default='initial vipps_sub')
  google_sub = db.Column(db.String, default='initial google_sub')
  user_is_logged_in = db.Column(db.Boolean,default=False)
  user_confirmed = db.Column(db.Boolean,default=False)
  user_conf_by_admin = db.Column(db.Boolean,default=False)
  access_token = db.Column(db.String,default='empty token')
  last_seen = db.Column(db.String,default='initial date')
  is_admin = db.Column(db.Boolean,default=False)
  ou = db.Column(db.String,default='init ou')
  address = db.Column(db.String,default='init address')

  events = db.relationship('Event', backref='user', lazy=True)

  def to_dict(self):
      return self.model_to_dict()

  @property
  def user_pass(self):
    raise AttributeError('password is not a readable attribute')
  
  @user_pass.setter
  def user_pass(self, password):
    self.user_pass_hash = bcrypt_sha256.hash(password)

  @staticmethod
  def hash_user_pass(password):
    return bcrypt_sha256.hash(password) 

  def verify_password(self, password):
    return bcrypt_sha256.verify(password,self.user_pass_hash)

  def login_user(self):
    self.user_is_logged_in = True
    self.last_seen = datetime.datetime.now(tz=datetime.timezone.utc)
    db.session.add(self)
    db.session.commit()

  def logout_user(self):
    self.user_is_logged_in = False
    db.session.add(self)
    db.session.commit()  
  
  @staticmethod
  def generate_access_token(user_email, expiration=3600):
        encoded = jwt.encode({'email':user_email, \
        'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=expiration)},current_app.config['SECRET_KEY'], algorithm='HS256')
        return encoded
  
  def gen_ldap_access_token(self,ldap_email, expiration=3600):
        encoded = jwt.encode({'email': ldap_email, \
        'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=expiration)},current_app.config['SECRET_KEY'], algorithm='HS256')
        self.access_token = encoded
        db.session.add(self)
        db.session.commit()
        return encoded

  @staticmethod
  def check_access_token(access_token):
        try:
          data = jwt.decode(access_token,current_app.config['SECRET_KEY'],algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
          return 'expiredSignatureError'
        except :
          return False   
        return True
           
  @staticmethod
  def generate_confirmation_token(uid, expiration=3600):
        encoded = jwt.encode({'confirm': uid, \
        'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=expiration)},current_app.config['SECRET_KEY'], algorithm='HS256')
        return encoded
  
  @staticmethod
  def generate_admin_conf_token(user_id,expiration=3600*48):
        print(f'models generate_admin_conf_token user_id: {user_id}')
        encoded = jwt.encode({'confirm': user_id ,'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=expiration) }, current_app.config['SECRET_KEY'], algorithm='HS256')
        return encoded

  @staticmethod
  def get_tokens_user_id(token):
    try:
        data = jwt.decode(token,current_app.config['SECRET_KEY'],algorithms=["HS256"])
        confirmed_user_id = data.get('confirm')
        print(f'User.get_tokens_user_id() data.confirm is:{confirmed_user_id}')
        return confirmed_user_id
    except:
        print(f'exept in models.User.confirm()')
        return False
  
  @staticmethod
  def confirm(uid, token):
    print(f'User.confirm() token is: {token}')
    print(f'User.confirm(...) uid is: {uid}')
    try:
        data = jwt.decode(token,current_app.config['SECRET_KEY'],algorithms=["HS256"])
        confirmed_user_uid = data.get('confirm')
        print(f'User.confirm(...) data.confirm is:{confirmed_user_uid}')
    except:
        print(f'exept in models.User.confirm()')
        return False
    if data.get('confirm') != uid:
        print('User.confirm(...) exception in data.get("confirm")')
        print('User.confirm(...) data.get("confirm"): ' + str(data.get('confirm')) + 'is not = uid: '+str(uid)) 
        return False
    print('User confirmed in User.confirm(')
    return True
  
  def add_confirmed_user(user):
      user.user_confirmed = True
      db.session.add(user)
      db.session.commit()
  
  def conf_by_adm(self, token):
    print(f'User.conf_by_adm() token is: {token}')
    print(f'User.conf_by_adm(...) self.id is: {self.id}')
    try:
        data = jwt.decode(token,current_app.config['SECRET_KEY'],algorithms=["HS256"])
        confirmed_user_id = data.get('confirm')
        print(f'User.conf_by_adm(...) data.confirm is:{confirmed_user_id}')
    except:
        print(f'exept in models.User.conf_by_adm()')
        return False
    if data.get('confirm') != self.id:
        print('User.conf_by_adm(...) exception in data.get("confirm")')
        print('User.conf_by_adm(...) data.get("confirm"): ' + str(data.get('confirm')) + 'is not = self.id: '+str(self.id)) 
        return False
    self.user_conf_by_admin = True
    db.session.add(self)
    db.session.commit()
    print('User confirmed in User.confirm(')
    return True
  
  def generate_pass_change_token(self, expiration=3600):
        print(f'models generate_pass_change_token user.id : {self.id}')
        encodeed = jwt.encode({'confirm': self.id,'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=expiration)},current_app.config['SECRET_KEY'], algorithm='HS256')
        return encodeed

  def change_pass(self,email,newpass):
        user = db.session.execute(db.select(User).where(User.user_email == email)).scalar_one_or_none()
        if user.id!=self.id:
            return False
        if newpass is not None:
          self.user_pass = newpass
          db.session.add(self)
          db.session.commit()
          return True
        
        return False

  def generate_email_change_token(self, new_email, expiration=3600):
        encodeed = jwt.encode({'confirm': self.id, 'new_email' : new_email, \
        'exp': datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(seconds=expiration) },current_app.config['SECRET_KEY'], algorithm='HS256')
        return encodeed

  def change_email(self, token):
        secret_key = current_app.config['SECRET_KEY']
        try:
            data = jwt.decode(token, secret_key, algorithms=['HS256'])
        except:
            return False
        if data.get('confirm') != self.id:
            return False
        new_email = data.get('new_email')
        user_id_change_email = data.get('confirm')
        if new_email is None:
            return False
        user =  db.session.execute(db.select(User).where(User.id == user_id_change_email)).scalar_one_or_none()        
        if user is None:
            return False
        print(f'models change_email() user_id_change_email: {user_id_change_email}')
        print(f'models change_email() new_email : {new_email}')
        user.user_email=new_email
        db.session.add(user)
        db.session.commit()
        return True

  def ping(self):
        self.last_seen = datetime.utcnow()

class Event(db.Model):
  __tablename__ = "nf_event"
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  uid = db.Column(db.String)
  user_id = db.Column(db.Integer, db.ForeignKey('nf_user.id'))
  rowname = db.Column(db.String)
  title = db.Column(db.String)
  ou = db.Column(db.String)
  start = db.Column(db.String)
  end = db.Column(db.String)
  color = db.Column(db.String)
    
class Room(db.Model):
  __tablename__ = "nf_room"
  row = db.Column(db.Integer, primary_key=True)
  title = db.Column(db.String,unique=True)

class Payment(db.Model):
  __tablename__ = "nf_payment"
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  reference = db.Column(db.String)
  vipps_sub = db.Column(db.String, db.ForeignKey('nf_user.vipps_sub'))
  amount = db.Column(db.String)
  is_consumed = db.Column(db.Boolean,default=False)  
      
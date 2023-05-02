from flask import render_template, redirect, request, url_for, flash, \
        current_app, jsonify

from . import auth_bp
from .. import main_bp
from .forms import LoginForm, RegistrationForm, ChangePasswordForm,\
    PasswordResetRequestForm, PasswordResetForm, ChangeEmailForm
import jinja2
from ..models_al import *
from ..email import send_email, send_guest_email, send_adm_conf_email
from .. import executor
from wtforms import ValidationError
import jsons
from dataclasses import dataclass
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth
from os import access, environ as env
#from .. import socketio
from ldap3 import Server, Connection, ObjectDef, AttrDef, Reader, Writer, ALL, Tls
import ssl
import uuid
from .. import cache
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as package_requests

templateLoader = jinja2.PackageLoader('pythonworkshop','templates')
templateEnv = jinja2.Environment(loader=templateLoader)

login_templ = templateEnv.get_template('/auth/login.jinja2')
register_templ = templateEnv.get_template('/auth/register.jinja2')

"""
@auth_bp.before_app_request
def before_request():
  users_db.connect(reuse_if_open=True)
  if current_user is not None:
    if current_user.is_authenticated:
        current_user.ping()
        if not current_user.user_confirmed \
                and request.blueprint != 'auth_bp' \
                and request.endpoint != 'static':
            print('auth_bp.views.before_request() condition for unconfirmed == True')
            return redirect(url_for('auth_bp.unconfirmed'))
  users_db.close()
  pass 
"""

@auth_bp.route('/api/auth/ldap', methods=['POST','GET'])
def login_ldap(usr_email=None, usr_pass=None):
    print('login_ldap call')
    msg = 'awaiting login to ldap'
    if request.method == 'POST':
        ldap_user = request.json['ldap_user']
        ldap_pass = request.json['ldap_pass']
        #tls_configuration = Tls(validate=ssl.CERT_REQUIRED, version=ssl.PROTOCOL_TLSv1)
        #tls_configuration.validate = ssl.CERT_NONE #temporary disable certificate validation

        """ server = Server('demo1.freeipa.org', get_info=ALL)
        conn = Connection(server, 
                        'uid=manager,cn=users,cn=accounts,dc=demo1,dc=freeipa,dc=org',
                        'Secret123',
                          auto_bind=True)
        conn.search('dc=demo1,dc=freeipa,dc=org', '(objectclass=person)') """

        server = Server('ipar1.int.bitfrost.no', use_ssl=False, get_info=ALL)
        conn = Connection(server, 
                        f'uid=bookingapp,cn=sysaccounts,cn=etc,dc=int,dc=bitfrost,dc=no',
                        'E0aA--coVIkxSDPMKiVolJRxQIBMvdDpq.Fm3gM8!eZ0', auto_bind=True)
        

        ota_conn = Connection(server, 
                        f'uid={ldap_user},cn=users,cn=accounts,dc=int,dc=bitfrost,dc=no',
                        f'{ldap_pass}', auto_bind=True)
        #conn.start_tls()

        if ota_conn.bound:
            print(f'ldap connection bound!')
            print(f'ldap ota_conn authenticated user: {ldap_user}')
            print(f'ldap ota_conn.extend.standard.who_am_i(): {ota_conn.extend.standard.who_am_i()}')

            obj_person = ObjectDef(['top','person'], ota_conn)
            obj_person+='uid'
            obj_person+='memberOf'
            obj_person+='ou'

            r = Reader(ota_conn, obj_person, 
                    'cn=users,cn=accounts,dc=int,dc=bitfrost,dc=no',
                    f'(memberOf=cn=room-booking-app-users,cn=groups,cn=accounts,dc=int,dc=bitfrost,dc=no)\
                        (uid={ldap_user})'
                    )
            r.search()
            resp_json = ota_conn.response_to_json()
            pyth_entries = r.entries
            if len(pyth_entries) > 0:
                for entry in pyth_entries:
                    print(f'ldap Reader user entry.uid : {entry.uid}')
                    print(f'ldap Reader cursor user entry.ou : {entry.ou} ')
                    print(f'ldap Reader cursor user entry.telephoneNumber: {entry.telephoneNumber}')
                    auth_user = ldap_user
                    try :
                        user = db.session.execute(db.select(User).where(User.user_email==auth_user)).scalar_one()
                        print(f'ldap user allready logged in')
                    except db.exc.NoResultFound:    
                        try :
                            user = db.session.add(User(user_email=auth_user,
                                               user_pass='temp_ldap_user',
                                               user_confirmed=True,
                                               user_conf_by_admin = True))
                        except db.exc.IntegrityError :
                            return ({'is_duplicate': True, 'duplicate_ldap_user': auth_user})
                        msg = entry.uid
                        token = user.gen_ldap_access_token(auth_user)
                        user.login_user()
                        user_dict = {'user_email': user.user_email }
                        temp_user_id = user.id
                        msg= 'Ldap login success!'
                        return jsonify({'user':user_dict,'msg':msg}) 

            reader_users = Reader(ota_conn, obj_person, 
                    'cn=users,cn=accounts,dc=int,dc=bitfrost,dc=no'
            )
            reader_users.search()
            group_entries = reader_users.entries
            for entry in group_entries:
                print(f'ldap user  entry.uid: {entry.uid}')
                print(f'ldap user entry.ou: {entry.ou}')
                print(f'ldap user entry.telephoneNumber: {entry.telephoneNumber}')

    return jsonify({'ldap_login':'called','ldap_usr': msg})
        
@auth_bp.route('/api/auth/logout', methods=['POST','GET'])
def logout_form():
    msg = ''
    if request.method == 'POST':
        user = db.session.execute(db.select(User).where(User.user_email==request.json['email'])).scalar_one()
        if user is not None:
            user.logout_user()
            msg = 'logout success'
        else :
            msg = 'logout error'
    return jsonify({'logout_msg':msg})

@auth_bp.route('/api/auth/google_cb',methods=['POST','GET'])
def google_cb():
    msg= ''
    if request.method == 'POST':
        token = request.form['credential']
        CLIENT_ID = "770720313920-4dj3m27dp66d8ejnfmd21rtb50rkg6vm.apps.googleusercontent.com"
        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
            # ID token is valid. Get the user's Google Account ID from the decoded token.
            google_sub = idinfo['sub']
            user_email = idinfo['email']
            return redirect(f'https://webeltek.org/login?username={user_email}&google_sub={google_sub}')
        except ValueError:
            # Invalid token
            pass



@auth_bp.route('/api/auth/login', methods=['POST','GET'])
def login_form():
    #print('login_form call')
    msg = ''
    prov= request.json['provider']
    print(f'json[provider]  {prov}')
    if request.method == 'POST':
        
            if request.json['provider']=='local':
                user = db.session.execute(db.select(User).where(
                    User.user_email==request.json['email'])).scalar_one_or_none()
                if user is not None and user.verify_password(request.json['password']) and user.user_confirmed:
                    user.login_user()
                    user.access_token = user.generate_access_token(user.user_email)
                    db.session.add(user)
                    db.session.commit()
                    user_dict = {'id': user.id,
                                'is_admin':user.is_admin,
                                'user_email':user.user_email,
                                'access_token': user.access_token,
                                'last_seen': user.last_seen,
                                'ou': user.ou}
                    msg= 'User confirmed!'
                    return jsonify({'user':user_dict,'msg':msg})
                else:
                    msg='Wrong username or password!'
            if request.json['provider']=='vipps':
                db.session.add(User(user_email=request.json['email'],
                                vipps_sub=request.json['vipps_sub'],user_is_logged_in=True,
                                user_confirmed=True))   
                db.session.commit()
                user = db.session.execute(db.select(User).where(User.user_email==request.json['email'])).scalar_one_or_none()
                if user is not None:
                    user.access_token = User.generate_access_token(user.user_email)
                    db.session.add(user)
                    db.session.commit()
                    user_dict = {'id': user.id,
                                'is_admin':user.is_admin,
                                'user_email':user.user_email,
                                'access_token': user.access_token,
                                'last_seen': user.last_seen,
                                'ou': user.ou}
                    msg = 'Vipps provider login!'
                    #todo return redirect('/calendar')  with accesstoken in authorization header
                    return jsonify({'user':user_dict,'msg':msg})
            if request.json['provider']=='google':
                prov= request.json['provider']
                print(f' google json[provider]  {prov}')
                user_email=request.json['email']
                google_sub=request.json['google_sub']
                access_token=User.generate_access_token(request.json['email'])
                user_dict = {}
                user = db.session.execute(db.select(User).where(User.user_email==request.json['email'])).scalar_one_or_none()
                if user is not None:
                    user.access_token = access_token
                    user.user_is_logged_in = True
                    db.session.add(user)    
                    db.session.commit()
                    user_dict = {'id': user.id,
                                'is_admin':user.is_admin,
                                'user_email':user.user_email,
                                'access_token': user.access_token,
                                'last_seen': user.last_seen,
                                'ou': user.ou}
                elif user is None:
                    to_add_user = User(user_email=request.json['email'],
                                access_token=access_token,    
                                google_sub=google_sub,user_is_logged_in=True,
                                user_confirmed=True)
                    db.session.add(to_add_user)    
                    db.session.commit()
                    user = db.session.execute(db.select(User).where(User.user_email==request.json['email'])).scalar_one_or_none()
                    user_dict = {'id': user.id,
                                'is_admin':user.is_admin,
                                'user_email':user.user_email,
                                'access_token': user.access_token,
                                'last_seen': user.last_seen,
                                'ou': user.ou}
                msg = 'Google provider login!'
                print(f'google login {msg}')
                return jsonify({'user':user_dict,'msg':msg})
               
    return jsonify({'user':'nonexistent','msg':msg})

@dataclass
class userd:
    uid : hex
    user_email:str
    user_pass_hash:str
    ou: str

@auth_bp.route('/api/auth/register', methods=['POST'])
def register_form(): 
  if request.method == 'POST':
      msg=''
      uid = uuid.uuid4().hex
      user_email=request.json['email']
      user_pass=request.json['password']
      user_pass_hash = User.hash_user_pass(user_pass)
      user_ou = request.json['ou']
      to_reg_user = userd(uid=uid,user_email=user_email,
                          user_pass_hash=user_pass_hash,ou=user_ou)
      ser_user = jsons.dumps(to_reg_user)
      print(f'register ser_user:  {ser_user}')  
      cache.set('uid', uid)
      cache.set('email',user_email)
      cache.set('pass_hash',user_pass_hash)
      cache.set('ou',user_ou)

      cache_val = cache.get('uid')
      token = User.generate_confirmation_token(uid)
      send_email(to_reg_user.user_email, 'Confirm Your Account',
                  'auth/email/confirm', user=to_reg_user, token=token)
      #send_email([user.user_email], 'Confirm Your Account', 'auth/email/confirm', user=user, token=token)
      msg = 'En bekreftelses e-post har blitt sendt til deg på e-post.'
  return jsonify({'is_duplicate': False,'sent_token': token, 'user_email': to_reg_user.user_email,'msg':msg})

@auth_bp.route('/api/auth/send_msg', methods=['POST'])
def send_msg(): 
  if request.method == 'POST':
      print(f'/api/auth/send_msg called with email: {str(request.json["msg_email"])}') 
      
      guest_email=request.json['msg_email']
      msg_text = request.json['msg_text']
      send_guest_email('Message from guest', 
                       'auth/email/guest_msg', msg_email=guest_email, msg_text=msg_text)
      #send_email([user.user_email], 'Confirm Your Account', 'auth/email/confirm', user=user, token=token)
      msg = 'En bekreftelses e-post har blitt sendt til deg på e-post.'
  return jsonify({'guest_email_reference': guest_email})

@auth_bp.route('/api/auth/confirm/<token>',methods=['POST','GET'])
def confirm(token):
    cache_uid = cache.get('uid')
    email = cache.get('email')
    pass_hash = cache.get('pass_hash')
    user_ou = cache.get('ou')
    userconfirmed=False
    msg=''
    if token is not None and User.confirm(cache_uid,token):
        db.session.add(User(user_email=email,
                            user_pass_hash=pass_hash,
                            user_confirmed=True,ou=user_ou))
        db.session.commit()
        userconfirmed=True
        msg='Du har bekreftet kontoen din. Takk!'
    elif token is None or not User.confirm(cache_uid,token):
        userconfirmed = False
        msg = 'Bekreftelseslenken er ugyldig eller har utløpt.'
    print(f'auth_bp.confirm msg:{msg}')    
    return redirect(f'https://webeltek.org/confirm?userconfirmed={userconfirmed}')

@auth_bp.route('/api/auth/reg_admin_confirm', methods=['POST'])
def reg_admin_confirm(usr_email=None,temp_usr_id=None): 
    if request.method == 'POST':
        req_json = request.get_json()
        user_email=request.json['email']
        temp_user_id = req_json['temp_user_id']
        print(f'/api/auth/reg_admin_confirm called from user email: {str(user_email)}') 
        msg=''
        adm_conf_token = User.generate_admin_conf_token(temp_user_id)
        temp_user = db.session.execute(db.select(User).where(User.id==temp_user_id)).scalar_one_or_none()
        if temp_user is not None:
            app= current_app._get_current_object()
            adm_conf_email = app.config['FLASKY_CONF_ADMIN']
            send_adm_conf_email(adm_conf_email, 'Confirm registration of account: '+temp_user.user_email, 
                                'auth/email/reg_admin_confirm', user=temp_user, adm_conf_token=adm_conf_token)
            msg = 'En bekreftelses e-post har blitt sendt til admin på e-post.'
    if (usr_email and temp_usr_id) is not None:
        msg=''
        adm_conf_token = User.generate_admin_conf_token(temp_usr_id)
        temp_user = db.session.execute(db.select(User).where(User.id==temp_usr_id)).scalar_one_or_none()
        if temp_user is not None:
            app= current_app._get_current_object()
            adm_conf_email = app.config['FLASKY_CONF_ADMIN']
            send_adm_conf_email(adm_conf_email, 'Confirm registration of account: '+temp_user.user_email,  \
                                'auth/email/reg_admin_confirm', user=temp_user, adm_conf_token=adm_conf_token)
            msg = 'En bekreftelses e-post har blitt sendt til admin på e-post.'
    return jsonify({'is_duplicate': False,'sent_token': adm_conf_token, 'msg':msg})

@auth_bp.route('/api/auth/reg_admin_confirm/<token>',methods=['GET','POST'])
def conf_by_adm(token):
    tokens_user_id = User.get_tokens_user_id(token)
    user = db.session.execute(db.select(User).where(User.id==tokens_user_id)).scalar_one_or_none()
    msg=''
    user_conf_by_adm=True
    if user is not None and (user.user_conf_by_admin or user.conf_by_adm(token)):
        msg=f'Admin har bekreftet kontoen {user.user_email}. Takk!'
        user_conf_by_adm=True
    elif user is not None and not user.confirm_by_adm(token):
        user_conf_by_adm=True
        db.session.delete(User).where(User.id == user.id)
        db.session.commit()
        msg = 'Bekreftelseslenken er ugyldig eller har utløpt.'
    print(f'auth_bp.conf_by_adm msg :{msg}')    
    return redirect(f'https://webeltek.org/confirm?user_conf_by_adm={user_conf_by_adm}')

@auth_bp.route('/api/auth/change_email/<token>', methods=['GET', 'POST'])
def change_email(token):
    msg=''
    emailchanged=False
    tokens_user_id = User.get_tokens_user_id(token)
    user = db.session.execute(db.select(User).where(User.id==tokens_user_id)).scalar_one_or_none()
    if user is not None and user.change_email(token):
        msg='E-postadressen din er oppdatert'
        emailchanged=True
    else:
        msg='Ugyldig forespørsel.'
    print(f'auth_bp.change_emal msg: {msg}')    
    return redirect(f'https://webeltek.org/confirm?emailchanged={emailchanged}')

@auth_bp.route('/api/auth/change_pass/<token>', methods=['GET', 'POST'])
def change_pass(token):
    msg=''
    emailcheck=False
    tokens_user_id = User.get_tokens_user_id(token)
    user = db.session.execute(db.select(User).where(User.id==tokens_user_id)).scalar_one_or_none()
    if user is not None :
        msg='User exists'
        emailcheck=True
    else:
        msg='Invalid email.'
    print(f'auth_bp.change_pass msg: {msg}')    
    return redirect(f'https://webeltek.org/change_pass?emailcheck={emailcheck}')

@auth_bp.route('/api/auth/input_change_pass', methods=['POST','GET'])
def input_change_pass():
    msg = ''
    email= request.json['email']
    oldpass = request.json['oldpass']
    newpass = request.json['newpass']
    print(f'auth_bp.input_change_pass email, oldpass, newpass:{email,oldpass,newpass}')
    if request.method == 'POST':
        user = db.session.execute(db.select(User).where(User.user_email==email)).scalar_one_or_none()
        if user is not None:
            print(f'auth_bp.input_change_pass user email to change pass:{user.user_email}')
        if user is not None and user.verify_password(oldpass) and user.user_confirmed:
            user.change_pass(email,newpass)
            #user.login_user()
            return jsonify({'user_email':email,'msg':'Password changed!'})
        else:
            msg='Wrong username or password!'
    return jsonify({'user':'nonexistent','msg':msg}) 

"""socketio disabled"""
def confirm_event(userstate):
    print('socketio emitting msg:')
    #socketio.emit('user_confirmed', {'data': f'user confirmed={userstate}'})

    """
@auth_bp.route('/logout')
@login_required
def logout():
  logout_user()
  flash('Du har blitt logget ut.')
  return redirect(url_for('auth_bp.login_form'))    

@auth_bp.route('/confirm')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    send_smtp(current_user.user_email, 'Bekreft kontoen din',
               'auth/email/confirm', user=current_user, token=token)
    flash('En ny bekreftelses-e-post har blitt sendt til deg på e-post.')
    return redirect(url_for('auth_bp.login_form'))   

"""

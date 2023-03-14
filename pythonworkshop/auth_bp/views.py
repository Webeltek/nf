from flask import render_template, redirect,session, request, url_for, flash, \
        current_app, jsonify

from . import auth_bp
from .. import main_bp
from .forms import LoginForm, RegistrationForm, ChangePasswordForm,\
    PasswordResetRequestForm, PasswordResetForm, ChangeEmailForm
import jinja2
from ..models import *
from ..email import send_email, send_adm_conf_email
from .. import executor
import peewee as p
from wtforms import ValidationError
import json
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth
from os import access, environ as env
from playhouse.shortcuts import model_to_dict
#from .. import socketio
from ldap3 import Server, Connection, ObjectDef, AttrDef, Reader, Writer, ALL, Tls
import ssl
import logging

logger = logging.getLogger(__name__)

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
        #ldap_user=request.json['ldap_user']
        #qldap_pass = request.json['ldap_pass']
        #tls_configuration = Tls(validate=ssl.CERT_REQUIRED, version=ssl.PROTOCOL_TLSv1)
        #tls_configuration.validate = ssl.CERT_NONE #temporary disable certificate validation

        """ server = Server('ipa.demo1.freeipa.org', get_info=ALL)
        conn = Connection(server, 
                        'uid=admin,cn=users,cn=accounts,dc=demo1,dc=freeipa,dc=org',
                        'Secret123',
                          auto_bind=True)
        conn.search('dc=demo1,dc=freeipa,dc=org', '(objectclass=person)') """

        server = Server('ipar1.int.bitfrost.no', use_ssl=False, get_info=ALL)
        conn = Connection(server, 
                        f'uid=bookingapp,cn=sysaccounts,cn=etc,dc=int,dc=bitfrost,dc=no',
                        'E0aA--coVIkxSDPMKiVolJRxQIBMvdDpq.Fm3gM8!eZ0', auto_bind=True)
        

        #conn.start_tls()

        if (conn.bound):
            """ conn.search('cn=users,cn=accounts,dc=int,dc=bitfrost,dc=no', 
                    '(& \
                        (uid=bookingapp,cn=sysaccounts,cn=etc,dc=int,dc=bitfrost,dc=no)\
                        (memberOf=cn=room-booking-app-users,cn=groups,cn=accounts,dc=int,dc=bitfrost,dc=no)\
                    )'
            
                ) """
            
            print(f'ldap connection bound!')
            print(f'ldap conn.extend.standard.who_am_i(): {conn.extend.standard.who_am_i()}')
            print(f'ldap after search response : {repr(conn.response)}')

            obj_person = ObjectDef('person', conn)
            
            r = Reader(conn, obj_person,'cn=accounts,dc=int,dc=bitfrost,dc=no','(&(uid=bookingapp))')
            print(f'ldap Reader cursor: {r}')
            r.search()
            resp_json = conn.response_to_json()
            entries = conn.response
            for entry in entries:
                dn_list = entry.dn
                print(f'ldap Reader search response uid ')
            print(f'ldap Reader search response: {resp_json}')
            #print(f"ldap server.schema.object_classes['person']   :{server.schema.object_classes['person']}")
            #print(f'ldap search result entries[0]: {conn.entries[0]}')
            #get attributes of bookingapp entry and get email
            #conn.entries[0]
            ldap_email =''
            """ users_db.connect(reuse_if_open=True)
            try :
                user = User.create(user_email=ldap_email,user_pass='temp_ldap_user')
            except p.IntegrityError :
                return ({'is_duplicate': True, 'duplicate_email': ldap_email})
            token = user.gen_ldap_access_token(ldap_email)
            temp_user_id = user.id """
            msg = conn.response_to_json()     
    return jsonify({'ldap_conn':'response','msg':msg})
        

@auth_bp.route('/api/auth/login', methods=['POST','GET'])
def login_form(usr_email=None, usr_pass=None):
    print('login_form call')
    msg = ''
    if request.method == 'POST':
        users_db.connect(reuse_if_open=True)
        user = User.select().where(User.user_email==request.json['email']).first()
        if user is not None:
            print(f'auth_bp.login_form() user email to login:{user.user_email}')
        if user is not None and user.verify_password(request.json['password']) and user.user_confirmed and user.user_conf_by_admin:
            user.login_user()
            user.generate_access_token()
            user_dict = model_to_dict(user)
            msg= 'User confirmed!'
            return jsonify({'user':user_dict,'msg':msg})
        else:
            msg='Wrong username or password!'
        users_db.close()
    if (usr_email and usr_pass) is not None:
        users_db.connect(reuse_if_open=True)
        user = User.select().where(User.user_email==usr_email).first()
        if user is not None and user.verify_password(usr_pass) and user.user_confirmed and user.user_conf_by_admin:
            user.login_user()
            user.generate_access_token()
            user_dict = model_to_dict(user)
            msg = 'External user provider login!'
            #todo return redirect('/calendar')  with accesstoken in authorization header
            return jsonify({'user':user_dict,'msg':msg})
    return jsonify({'user':'nonexistent','msg':msg})
           

@auth_bp.route('/api/auth/register', methods=['POST'])
def register_form(): 
  if request.method == 'POST':
      print(f'/api/auth/register called with email: {str(request.json["email"])}') 
      users_db.connect(reuse_if_open=True)
      msg=''
      user_email=request.json['email']
      user_pass=request.json['password']
      try :
        user = User.create(user_email=user_email,
                           user_pass=user_pass)
      except p.IntegrityError :
        return ({'is_duplicate': True, 'duplicate_email': user_email})
      token = user.generate_confirmation_token()
      temp_user_id = user.id
      send_email(user.user_email, 'Confirm Your Account', 'auth/email/confirm', user=user, token=token)
      #send_email([user.user_email], 'Confirm Your Account', 'auth/email/confirm', user=user, token=token)
      msg = 'En bekreftelses e-post har blitt sendt til deg på e-post.'
      users_db.close()
  return jsonify({'is_duplicate': False,'sent_token': token, 'temp_user_id': temp_user_id,'msg':msg})

@auth_bp.route('/api/auth/confirm/<token>',methods=['POST','GET'])
def confirm(token):
    users_db.connect(reuse_if_open=True)
    tokens_user_id = User.get_tokens_user_id(token)
    user = User.select().where(User.id==tokens_user_id).first()
    userconfirmed=False
    msg=''
    if user is not None and (user.user_confirmed or user.confirm(token)):
        userconfirmed=True
        msg='Du har bekreftet kontoen din. Takk!'
    elif user is not None and not user.confirm(token):
        userconfirmed=False
        User.delete().where(User.id == user.id).execute()
        msg = 'Bekreftelseslenken er ugyldig eller har utløpt.'
    print(f'auth_bp.confirm msg:{msg}')    
    users_db.close()
    return redirect(f'/confirm?=userconfirmed={userconfirmed}')

@auth_bp.route('/api/auth/reg_admin_confirm', methods=['POST'])
def reg_admin_confirm(usr_email=None,temp_usr_id=None): 
    if request.method == 'POST':
        req_json = request.get_json()
        user_email=request.json['email']
        temp_user_id = req_json['temp_user_id']
        print(f'/api/auth/reg_admin_confirm called from user email: {str(user_email)}') 
        users_db.connect(reuse_if_open=True)
        msg=''
        adm_conf_token = User.generate_admin_conf_token(temp_user_id)
        temp_user = User.select().where(User.id==temp_user_id).first()
        app= current_app._get_current_object()
        adm_conf_email = app.config['FLASKY_CONF_ADMIN']
        send_adm_conf_email(adm_conf_email, 'Confirm registration of account: '+temp_user.user_email,  \
                             'auth/email/reg_admin_confirm', user=temp_user, adm_conf_token=adm_conf_token)
        msg = 'En bekreftelses e-post har blitt sendt til admin på e-post.'
        users_db.close()
    if (usr_email and temp_usr_id) is not None:
        users_db.connect(reuse_if_open=True)
        msg=''
        adm_conf_token = User.generate_admin_conf_token(temp_usr_id)
        temp_user = User.select().where(User.id==temp_usr_id).first()
        app= current_app._get_current_object()
        adm_conf_email = app.config['FLASKY_CONF_ADMIN']
        send_adm_conf_email(adm_conf_email, 'Confirm registration of account: '+temp_user.user_email,  \
                             'auth/email/reg_admin_confirm', user=temp_user, adm_conf_token=adm_conf_token)
        msg = 'En bekreftelses e-post har blitt sendt til admin på e-post.'
        users_db.close()

    return jsonify({'is_duplicate': False,'sent_token': adm_conf_token, 'msg':msg})

@auth_bp.route('/api/auth/reg_admin_confirm/<token>',methods=['GET','POST'])
def conf_by_adm(token):
    users_db.connect(reuse_if_open=True)
    tokens_user_id = User.get_tokens_user_id(token)
    user = User.select().where(User.id==tokens_user_id).first()
    msg=''
    user_conf_by_adm=False
    if user is not None and (user.user_conf_by_admin or user.conf_by_adm(token)):
        msg=f'Admin har bekreftet kontoen {user.user_email}. Takk!'
        user_conf_by_adm=True
    elif user is not None and not user.confirm_by_adm(token):
        user_conf_by_adm=False
        User.delete().where(User.id == user.id).execute()
        msg = 'Bekreftelseslenken er ugyldig eller har utløpt.'
    print(f'auth_bp.conf_by_adm msg :{msg}')    
    users_db.close()
    return redirect(f'/confirm?user_conf_by_adm={user_conf_by_adm}')

@auth_bp.route('/api/auth/change_email/<token>', methods=['GET', 'POST'])
def change_email(token):
    users_db.connect(reuse_if_open=True)
    msg=''
    emailchanged=False
    tokens_user_id = User.get_tokens_user_id(token)
    user = User.select().where(User.id==tokens_user_id).first()
    if user is not None and user.change_email(token):
        msg='E-postadressen din er oppdatert'
        emailchanged=True
    else:
        msg='Ugyldig forespørsel.'
    print(f'auth_bp.change_emal msg: {msg}')    
    users_db.close()    
    return redirect(f'/confirm?emailchanged={emailchanged}')

@auth_bp.route('/api/auth/change_pass/<token>', methods=['GET', 'POST'])
def change_pass(token):
    users_db.connect(reuse_if_open=True)
    msg=''
    emailcheck=False
    tokens_user_id = User.get_tokens_user_id(token)
    user = User.select().where(User.id==tokens_user_id).first()
    if user is not None :
        msg='User exists'
        emailcheck=True
    else:
        msg='Invalid email.'
    print(f'auth_bp.change_pass msg: {msg}')    
    users_db.close()    
    return redirect(f'/change_pass?emailcheck={emailcheck}')

@auth_bp.route('/api/auth/input_change_pass', methods=['POST','GET'])
def input_change_pass():
    msg = ''
    email= request.json['email']
    oldpass = request.json['oldpass']
    newpass = request.json['newpass']
    print(f'auth_bp.input_change_pass email, oldpass, newpass:{email,oldpass,newpass}')
    if request.method == 'POST':
        users_db.connect(reuse_if_open=True)
        user = User.select().where(User.user_email==email).first()
        if user is not None:
            print(f'auth_bp.input_change_pass user email to change pass:{user.user_email}')
        if user is not None and user.verify_password(oldpass) and user.user_confirmed and user.user_conf_by_admin:
            user.change_pass(email,newpass)
            #user.login_user()
            return jsonify({'user_email':email,'msg':'Password changed!'})
        else:
            msg='Wrong username or password!'
        users_db.close()
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

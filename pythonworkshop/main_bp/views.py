from flask import Flask,redirect, render_template, request, jsonify, url_for
from ..models import *
from . import forms
from . import main_bp
import jinja2
import os
import json
from peewee import *
from playhouse.shortcuts import model_to_dict
from functools import wraps
import uuid
from ..email import send_email
from ..models_al import *

def access_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(" ")[1] if auth_header is not None else ''
        access_token_check = User.check_access_token(token) #access_token_check type is boolean or string
        if access_token_check == 'expiredSignatureError':
            return jsonify('access token expired')
        elif access_token_check == False:
            return jsonify('acces token is wrong')
        elif access_token_check == True:    
            print("Access ALLOWED")    
            return f(*args, **kwargs)            
        print("General access ERROR")            
        return jsonify('access not allowed')        
    return decorated_function


templateLoader = jinja2.PackageLoader('pythonworkshop','templates')
templateEnv = jinja2.Environment(loader=templateLoader)

contact_templ = templateEnv.get_template('/main/contact.jinja2')
persons_templ = templateEnv.get_template('/main/persons.jinja2')
#services_templ = templateEnv.get_template('/main/services.jinja2')
about_us_templ = templateEnv.get_template('/main/about_us.jinja2')

rooms_init = [
     {"title":"Møterom stort"},
     {"title":"Møterom lite"},
     {"title":"Møterom 214"}, 
     {"title":"Møterom 210" }, 
     {"title":"Aktivitets plan"}]

@main_bp.route("/contact", methods= ['GET','POST'])
@access_required
def contact_form():
        contact_form = forms.ContactForm(request.form)
        if request.method == 'POST' and contact_form.validate():
            print(F'I got UFO name is {myform.ufoname.data}')
            return F'I got your autodata!!!'
        return render_template('/main/contact.jinja2', contact=contact_form)



@main_bp.route("/about_us", methods= ['GET','POST'])
@access_required
def about_us_form():
        about_us = forms.AboutUsForm(request.form)
        if request.method == 'POST' and about_us.validate():
            return F'I got your autodata!!!'
        return render_template('/main/about_us.jinja2',about=about_us)

@main_bp.route("/user_profile/<string:username>", methods= ['GET','POST'])
@access_required
def user_profile(username):
        user = User.select().where(User.user_name==username).get()
        about_us = forms.AboutUsForm(request.form)
        if request.method == 'POST' and about_us.validate():
            print(F'I got UFO name is {myform.ufoname.data}')
            return F'I got your autodata!!!'
        return render_template('/main/user_profile.jinja2',user=user)

@main_bp.route("/api/services/rooms", methods= ['GET'])
@access_required
def index_rooms():
        rooms = db.session.execute(db.select(Room).order_by(Room.row.asc())).scalars()
        if not rooms.exists():
            db.session.execute(Room.__table__.insert(),rooms_init)
        if rooms.exists():
            print(f'main_bp rooms {rooms}')
        return jsonify({'rooms':list( rooms)})

@main_bp.route("/api/services/insertroom",methods=["POST","GET"])
@access_required
def insertroom():
    users_db.connect(reuse_if_open=True)
    if request.method == 'POST':
        req_json = request.get_json()
        title = req_json['title']
        db.session.add(Room(title=title)).commit()
        new_rooms = db.session.execute(db.select(Room)).scalars()
        msg = 'Room added successfully' 
    return jsonify({'mod_rooms': list(new_rooms)})

@main_bp.route("/api/services/deleteroom",methods=["POST","GET"])
@access_required
def deleteroom():
    users_db.connect(reuse_if_open=True)
    if request.method == 'POST':
        req_json = request.get_json()
        row = req_json['row']
        title = req_json['title']
        db.session.delete(Event).where((Event.rowname == title)).commit()
        db.session.delete(Room).where(Room.title==title).commit()
        new_rooms = db.session.execute(db.select(Room)).scalars()
        msg = 'Room deleted successfully' 
    return jsonify({'mod_rooms': list(new_rooms)})    

@main_bp.route("/api/services/updaterooms",methods=["POST","GET"])
@access_required
def updaterooms():
    if request.method == 'POST':
        req_rooms = request.get_json()
        db_rooms = db.session.execute(db.select(Room)).scalars()
        for index,db_room in enumerate(db_rooms):
                db_room.title = req_rooms[index]
                print(f'auth_bp updatetrooms index: {index}')
                print(f'auth_bp updatetrooms row and title: {db_room.row, db_room.title}')  
                db.session.add(db_room).commit()
        new_rooms = db.session.execute(db.select(Room)).scalars()        
        msg = 'Rooms updated successfully' 
    return jsonify({'mod_rooms': list(new_rooms)})                       
  
@main_bp.route("/api/services/events", methods= ['GET'])
@access_required
def index_events():
        events = db.session.execute(db.select(Event).order_by(Event.id.asc())).scalars()
        return jsonify({'events':list( events)})

@main_bp.route("/api/services/users", methods= ['GET'])
@access_required
def index_users():
        saved_users = db.session.execute(db.select(User).order_by(User.id.asc())).scalars()
        s_users = saved_users # returns iterable modelselect with rows as dicts
        #json_users = json.dumps({'users':list(s_users)}) #list() is converting modelselect to list
        return jsonify({'users':list(s_users)})    
       
  
@main_bp.route("/api/services/insert",methods=["POST","GET"])
@access_required
def insert():
    if request.method == 'POST':
        req_json = request.get_json()
        uid = req_json['uid']
        rowname = req_json['rowname']
        user_id = req_json['userId']
        print('event userId foregnkey is : '+ str(user_id))
        title = req_json['title']
        ou = req_json['ou']
        start = req_json['start']
        end = req_json['end']
        color = req_json['color']
        db.session.add(Event(uid=uid,userId=user_id, rowname=rowname, title=title,ou=ou,start=start,end=end, color=color)).commit()
        msg = 'Record added successfully' 
    return jsonify(msg)
  
@main_bp.route("/api/services/update",methods=["POST","GET"])
@access_required
def update():
    users_db.connect(reuse_if_open=True)
    if request.method == 'POST':
        req_json = request.get_json()
        uid = req_json['uid']
        userId = req_json['userId']
        title = req_json['title']
        start = req_json['start']
        end = req_json['end']
        db.session.add(Event(uid=uid,userId=userId, title=title,start=start,end=end)
                       ).where(Event.uid == uid).commit()       
        msg = 'Record updated successfully' 
    return jsonify(msg)    
  
@main_bp.route("/api/services/delete",methods=["POST","GET"])
@access_required
def ajax_delete():
    if request.method == 'POST':
        req_json = request.get_json()
        ids = req_json['numList']
        if ids is not None:
                for todelid in ids:
                    print(f'To delete id{str(id)}')
                    db.session.delete(Event().where(Event.id == todelid)).commit()
        msg = 'Record/s deleted successfully' 
    return jsonify(msg)

@main_bp.route('/api/services/change_email', methods=['GET', 'POST'])
@access_required
def change_email_request():
    msg = ''
    if request.method == 'POST':
        req_json = request.get_json()
        userId = req_json['userId']
        newEmail = req_json['newEmail']
        userPass = req_json['oldpassword']
        user = db.session.execute(db.select(User).where(User.id==userId)).scalar_one()
        if user is not None and user.verify_password(userPass):
            token = user.generate_email_change_token(newEmail)
            send_email(newEmail, 'Confirm change of email address',
                       'auth/email/change_email',
                       user=user, token=token)
            msg='En e-post med instruksjoner for å bekrefte din nye e-post adressen er sendt til deg.'
        else:
            msg='Invalid email or password.'
    return jsonify({'to_change_email': newEmail, 'msg':msg})

@main_bp.route('/api/services/change_pass', methods=['GET', 'POST'])
@access_required
def change_pass_request():
    msg = ''
    if request.method == 'POST':
        req_json = request.get_json()
        user_email = req_json['resPassEmail']
        user = db.session.execute(db.select(User).where(User.user_email==user_email)).scalar_one()
        print(f'main_bp.change_pass_request selected user email: {user.user_email}') 
        if user is not None :
            token = user.generate_pass_change_token()
            send_email(user.user_email, 'Reset Your Password',
                       'auth/email/change_password',
                       user=user, token=token)
            msg='En e-post med instruksjoner for å innføre ditt nytt passord er sendt til deg.'
        else:
            msg='Invalid email'    
    return jsonify({'user_email': user_email, 'msg':msg})


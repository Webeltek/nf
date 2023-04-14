from flask import Flask,redirect, render_template, request, jsonify, url_for
from ..models import *
from . import forms
from . import main_bp
import jinja2
import os
import json
import jsons
from peewee import *
from playhouse.shortcuts import model_to_dict
from functools import wraps
import uuid
from ..email import send_email
from ..models_al import *
from dataclasses import dataclass

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
        user = db.session.execute(db.select(User).where(User.user_name==username)).scalar_one()
        about_us = forms.AboutUsForm(request.form)
        if request.method == 'POST' and about_us.validate():
            print(F'I got UFO name is {myform.ufoname.data}')
            return F'I got your autodata!!!'
        return render_template('/main/user_profile.jinja2',user=user)

@dataclass
class roomd:
    row : int
    title : str   

@main_bp.route("/api/services/rooms", methods= ['GET'])
@access_required
def index_rooms():
        rooms = []
        rooms = db.session.scalars(db.select(Room).order_by(Room.row.asc())).all()
        if len(rooms)<=1:
            db.session.execute(db.insert(Room),rooms_init)
            db.session.commit()
        print(f'main_bp rooms {rooms}')    
        rooms_list = []    
        for room in rooms:
            rooms_list.append(jsons.dump(roomd(room.row,room.title)))              
        return jsonify({'rooms':rooms_list})

@main_bp.route("/api/services/insertroom",methods=["POST","GET"])
@access_required
def insertroom():
    users_db.connect(reuse_if_open=True)
    if request.method == 'POST':
        req_json = request.get_json()
        title = req_json['title']
        db.session.add(Room(title=title))
        db.session.commit()
        new_rooms = db.session.execute(db.select(Room)).scalars().all()
        rooms_list = []    
        for room in new_rooms:
            rooms_list.append(jsons.dump(roomd(room.row,room.title)))
        msg = 'Room added successfully' 
    return jsonify({'mod_rooms': rooms_list})

@main_bp.route("/api/services/deleteroom",methods=["POST","GET"])
@access_required
def deleteroom():
    users_db.connect(reuse_if_open=True)
    if request.method == 'POST':
        req_json = request.get_json()
        row = req_json['row']
        title = req_json['title']
        db.session.execute(db.delete(Event).where(Event.rowname == title))
        db.session.execute(db.delete(Room).where(Room.title==title))
        db.session.commit()
        new_rooms = db.session.execute(db.select(Room)).scalars().all()
        rooms_list = []    
        for room in new_rooms:
            rooms_list.append(jsons.dump(roomd(room.row,room.title)))
        msg = 'Room deleted successfully' 
    return jsonify({'mod_rooms': rooms_list})    

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
                db.session.add(db_room)
                db.session.commit()
        new_rooms = db.session.execute(db.select(Room)).scalars().all()
        rooms_list = []    
        for room in new_rooms:
            rooms_list.append(jsons.dump(roomd(room.row,room.title)))        
        msg = 'Rooms updated successfully'
    return jsonify({'mod_rooms': rooms_list})                       

@dataclass
class eventd:
    id: int
    uid: str
    userId_id : int
    rowname : str
    ou : str
    start : str
    end : str
    color : str

@main_bp.route("/api/services/events", methods= ['GET'])
@access_required
def index_events():
        events = db.session.execute(db.select(Event).order_by(Event.id.asc())).scalars().all()
        event_list = []
        for event in events:
            event_list.append(jsons.dump(eventd(
                 event.id,event.uid,event.userId_id,
                 event.rowname,event.ou,event.start,
                 event.end,event.color))) 
        return jsonify({'events':event_list})

@dataclass
class userd:
    id : int
    user_email:str
    user_pass_hash:str
    user_is_logged_in:str
    user_confirmed: str
    user_conf_by_admin: str
    access_token: str
    last_seen: str
    is_admin : str
    ou: str
    address: str 

@main_bp.route("/api/services/users", methods= ['GET'])
@access_required
def index_users():
        saved_users = db.session.execute(db.select(User).order_by(User.id.asc())).scalars().all()
        users_list = []
        for user in saved_users:
             users_list.append(jsons.dump(userd(
                  user.id,user.user_email,user.user_pass_hash,
                  user.user_is_logged_in,user.user_confirmed,
                  user.user_conf_by_admin, user.access_token, 
                  user.last_seen,user.is_admin, user.ou, user.address)))
        return jsonify({'users':users_list})    
       
  
@main_bp.route("/api/services/insert",methods=["POST","GET"])
@access_required
def insert():
    if request.method == 'POST':
        req_json = request.get_json()
        uid = req_json['uid']
        rowname = req_json['rowname']
        user_id = req_json['userId_id']
        print('event userId foregnkey is : '+ str(user_id))
        title = req_json['title']
        ou = req_json['ou']
        start = req_json['start']
        end = req_json['end']
        color = req_json['color']
        db.session.add(Event(uid=uid,userId_id=user_id, rowname=rowname, title=title,ou=ou,start=start,end=end, color=color))
        db.session.commit()
        msg = 'Record added successfully' 
    return jsonify(msg)
  
@main_bp.route("/api/services/update",methods=["POST","GET"])
@access_required
def update():
    users_db.connect(reuse_if_open=True)
    if request.method == 'POST':
        req_json = request.get_json()
        uid = req_json['uid']
        userId = req_json['userId_id']
        title = req_json['title']
        start = req_json['start']
        end = req_json['end']
        db.session.add(Event(uid=uid,userId_id=userId, title=title,start=start,end=end)
                       ).where(Event.uid == uid)
        db.session.commit()       
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
                    db.session.execute(db.delete(Event).where(Event.id == todelid))
                    db.session.commit()
        msg = 'Record/s deleted successfully' 
    return jsonify(msg)

@main_bp.route('/api/services/change_email', methods=['GET', 'POST'])
@access_required
def change_email_request():
    msg = ''
    if request.method == 'POST':
        req_json = request.get_json()
        userId = req_json['userId_id']
        newEmail = req_json['newEmail']
        userPass = req_json['oldpassword']
        user = db.session.execute(db.select(User).where(User.id==userId)).first()
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
        user = db.session.execute(db.select(User).where(User.c.user_email==user_email)).first()
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


from flask import Flask,redirect, render_template, request, jsonify, url_for
from . import forms
from . import main_bp
import jinja2
import os
import json
import jsons
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
            #print("Access ALLOWED")    
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

books_init = [
     {"title":"Drop-in"},
     {"title":"Avtale"},
     {"title":"Kontor"}]

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
            return F'I got your autodata!!!'
        return render_template('/main/user_profile.jinja2',user=user)

@dataclass
class roomd:
    row : int
    title : str   

@main_bp.route("/api/services/rooms", methods= ['GET'])
@access_required
def index_rooms():
        rooms_list = get_rooms()              
        return jsonify({'rooms':rooms_list})

def get_rooms():
    rooms = db.session.scalars(db.select(Room).order_by(Room.row.asc())).all()
    if len(rooms)<=1:
        db.session.execute(db.insert(Room),rooms_init)
        db.session.commit()
    rooms_list = []    
    for room in rooms:
        rooms_list.append(jsons.dump(roomd(room.row,room.title)))
    return rooms_list      
     

@main_bp.route("/api/services/insertroom",methods=["POST","GET"])
@access_required
def insertroom():
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
    if request.method == 'POST':
        req_json = request.get_json()
        row = req_json['row']
        title = req_json['title']
        db.session.execute(db.delete(Event).where(Event.roomname == title))
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
        db_rooms = db.session.execute(db.select(Room)).scalars().all()
        #print(f'db_rooms,req_rooms{db_rooms},{req_rooms}'.encode('utf-8','ignore'))
        for index,req_room in enumerate(req_rooms):
             if index < len(db_rooms):
                    db_room = db_rooms[index]
                    db_room.title = req_room
                    db.session.add(db_room)
             else:
                 #print(f'req_room with higher index',req_room)
                 db.session.add(Room(title=req_room))      
        db.session.commit()
        new_rooms = db.session.execute(db.select(Room)).scalars().all()
        rooms_list = []    
        for room in new_rooms:
            rooms_list.append(jsons.dump(roomd(room.row,room.title)))        
        msg = 'Rooms updated successfully'
    return jsonify({'mod_rooms': rooms_list})

@dataclass
class bookd:
    row : int
    title : str   

@main_bp.route("/api/services/books", methods= ['GET'])
@access_required
def index_books():
        books_list = get_books()
        return jsonify({'books':books_list})

def get_books():
    books = db.session.scalars(db.select(Book).order_by(Book.row.asc())).all()
    if len(books)<=1:
            db.session.execute(db.insert(Book),books_init)
            db.session.commit()
    books_list = []        
    for book in books:
        #print(f'current book{book.title}'.encode('utf-8','ignore'))
        books_list.append(jsons.dump(bookd(book.row,book.title)))
    return books_list    


@main_bp.route("/api/services/insertbook",methods=["POST","GET"])
@access_required
def insertbook():
    if request.method == 'POST':
        req_json = request.get_json()
        title = req_json['title']
        db.session.add(Book(title=title))
        db.session.commit()
        new_books = db.session.execute(db.select(Book)).scalars().all()
        books_list = []    
        for book in new_books:
            books_list.append(jsons.dump(bookd(book.row,book.title)))
        msg = 'Book added successfully' 
    return jsonify({'mod_books': books_list})

@main_bp.route("/api/services/deletebook",methods=["POST","GET"])
@access_required
def deletebook():
    if request.method == 'POST':
        req_json = request.get_json()
        row = req_json['row']
        title = req_json['title']
        db.session.execute(db.delete(Event).where(Event.bookname == title))
        db.session.execute(db.delete(Book).where(Book.title==title))
        db.session.commit()
        books_list = get_books()
        msg = 'Book deleted successfully' 
    return jsonify({'mod_books': books_list})    

@main_bp.route("/api/services/updatebooks",methods=["POST","GET"])
@access_required
def updatebooks():
    if request.method == 'POST':
        req_books = request.get_json()
        db_books = db.session.execute(db.select(Book)).scalars().all()
        for index,req_book in enumerate(req_books):
            if index<len(db_books) :    
                db_book = db_books[index]
                db_book.title = req_book
                #print(f'auth_bp updatetbooks row and title: {db_book.row, db_book.title}')  
                db.session.add(db_book)
        db.session.commit()
        books_list = get_books()       
        msg = 'Books updated successfully'
    return jsonify({'mod_books': books_list})                       

@dataclass
class eventd:
    id: int
    uid: str
    user_id : int
    title: str
    bookname : str
    roomname : str
    ou : str
    startmills : int
    endmills : int
    color : str
    paymntref : str

@main_bp.route("/api/services/events", methods= ['GET'])
@access_required
def index_events():
        event_list= get_events() 
        return jsonify({'events':event_list})

def get_events():
    events = db.session.execute(db.select(Event).order_by(Event.id.asc())).scalars().all()
    event_list = []
    for event in events:
      event_list.append(jsons.dump(eventd(
            event.id,event.uid,event.user_id,event.title,
            event.bookname,event.roomname,event.ou,event.startmills,
            event.endmills,event.color,event.paymntref)))
    return event_list        


@dataclass
class userd:
    id : int
    user_email:str
    user_pass_hash:str
    user_is_logged_in:bool
    user_confirmed: bool
    user_conf_by_admin: bool
    access_token: str
    last_seen: str
    is_admin : bool
    ou: str
    address: str 

@main_bp.route("/api/services/users", methods= ['GET'])
@access_required
def index_users():
        events_list = get_events()
        books_list = get_books()
        rooms_list = get_rooms()
        saved_users = db.session.execute(db.select(User).order_by(User.id.asc())).scalars().all()
        users_list = []
        for user in saved_users:
             users_list.append(jsons.dump(userd(
                  user.id,user.user_email,user.user_pass_hash,
                  user.user_is_logged_in,user.user_confirmed,
                  user.user_conf_by_admin, user.access_token, 
                  user.last_seen,user.is_admin, user.ou, user.address)))
        return jsonify({'users':users_list,'events':events_list,'books':books_list,'rooms':rooms_list})    
       
  
@main_bp.route("/api/services/insert",methods=["POST","GET"])
@access_required
def insert():
    if request.method == 'POST':
        req_json = request.get_json()
        uid = req_json['uid']
        bookname = req_json['bookname']
        roomname = req_json['roomname']
        user_id = req_json['user_id']
        title = req_json['title']
        paymntref = req_json['paymntref']
        #print('event userId foregnkey is : '+ str(user_id))
        ou = req_json['ou']
        startmills = req_json['startmills']
        endmills = req_json['endmills']
        color = req_json['color']
        db.session.add(Event(uid=uid,user_id=user_id,title=title,
                             paymntref=paymntref, 
                             bookname=bookname,
                             roomname=roomname,ou=ou,
                             startmills=startmills,endmills=endmills, color=color))
        db.session.commit()
        msg = 'Record added successfully'
        events = get_events()
        payments = get_payments(user_id) 
    return jsonify({"events":events,"payments":payments})
  
@main_bp.route("/api/services/update",methods=["POST","GET"])
@access_required
def update():
    uid = request.args['uid']
    user_id = request.args['user_id']
    startmills = request.args['startmills']
    endmills = request.args['endmills']
    roomname = request.args['roomname']
    tobeupdated_event = db.session.execute(db.select(Event).where(Event.uid== uid)).scalar_one_or_none()
    tobeupdated_event.startmills=startmills
    tobeupdated_event.endmills=endmills
    tobeupdated_event.roomname=roomname
    db.session.add(tobeupdated_event)
    db.session.commit()       
    msg = 'Record updated successfully'
    events = get_events()
    payments = get_payments(user_id) 
    return jsonify({"events":events,"payments":payments})    
  
@main_bp.route("/api/services/delete",methods=["POST","GET"])
@access_required
def ajax_delete():
    if request.method == 'POST':
        req_json = request.get_json()
        uids = req_json['uidList']
        user_id = req_json['user_id']
        if uids is not None:
                for todeluid in uids:
                    print(f'To delete uid{str(todeluid)}')
                    db.session.execute(db.delete(Event).where(Event.uid == todeluid))
        db.session.commit()
        msg = 'Record/s deleted successfully'
        events_list = get_events()
        payments_list = get_payments(user_id=user_id) 
    return jsonify({"events":events_list,"payments":payments_list})

@main_bp.route('/api/services/change_email', methods=['GET', 'POST'])
@access_required
def change_email_request():
    msg = ''
    if request.method == 'POST':
        req_json = request.get_json()
        userId = req_json['userId']
        newEmail = req_json['newEmail']
        existing_email = db.session.execute(db.select(User).where(User.user_email==newEmail)).scalar_one_or_none()
        if existing_email is not None:
             msg = " Email already exists!"
             return jsonify({'duplicate_email': newEmail, 'msg':msg}) 
        userPass = req_json['oldpassword']
        user = db.session.execute(db.select(User).where(User.id==userId)).scalar_one_or_none()
        if user is not None and user.verify_password(userPass):
            token = user.generate_email_change_token(newEmail)
            #print(f'main_bp change email: {newEmail}')
            send_email(newEmail, 'Confirm change of email address',
                       'auth/email/change_email',
                       user=user, token=token)
            msg='En e-post med instruksjoner for å bekrefte din nye e-post adressen er sendt til deg.'
        else:
            msg='Invalid password.'
    return jsonify({'to_change_email': newEmail, 'msg':msg})

@main_bp.route('/api/services/change_pass', methods=['GET', 'POST'])
@access_required
def change_pass_request():
    msg = ''
    if request.method == 'POST':
        req_json = request.get_json()
        user_email = req_json['resPassEmail']
        user = db.session.execute(db.select(User).where(User.user_email==user_email)).scalar_one_or_none()
        if user is not None :
            #print(f'main_bp.change_pass_request selected user email: {user.user_email}') 
            token = user.generate_pass_change_token()
            send_email(user.user_email, 'Reset Your Password',
                       'auth/email/change_password',
                       user=user, token=token)
            msg='En e-post med instruksjoner for å innføre ditt nytt passord er sendt til deg.'
        else:
            msg='Invalid email'    
    return jsonify({'user_email': user_email, 'msg':msg})

@main_bp.route('/api/services/change_org', methods=['GET', 'POST'])
@access_required
def change_org_request():
    msg = ''
    if request.method == 'POST':
        req_json = request.get_json()
        user_email = req_json['resPassEmail']
        user = db.session.execute(db.select(User).where(User.user_email==user_email)).scalar_one_or_none()
        if user is not None :
            token = user.generate_org_change_token()
            send_email(user.user_email, 'Reset Your Password',
                       'auth/email/change_org',
                       user=user, token=token)
            msg='En e-post med instruksjoner for å innføre din ny passord er sendt til deg.'
        else:
            msg='Invalid email'    
    return jsonify({'user_email': user_email, 'msg':msg})

@main_bp.route('/api/services/db_save_payment',methods=['GET','POST'])
@access_required
def db_save_payment():
    refer = request.json.get('reference')
    user_id = request.json['user_id']
    vipps_sub = request.json['vipps_sub']
    amount = request.json['amount']
    bookname = request.json['bookname']
    #print(f'main_bp refer,amount{refer,amount}')
    db.session.add(Payment(reference=refer,
                           user_id=user_id,
                           vipps_sub=vipps_sub,
                           amount=amount,
                           bookname=bookname))
    db.session.commit()
    return jsonify({ "payment": "saved_in_db"})

def get_payments(user_id):
    vipps_sub_paymnts = db.session.execute(db.select(Payment)
                            .where(Payment.user_id==user_id)).scalars().all()
    paymnts = []
    for paymnt in vipps_sub_paymnts:
                paymnts.append(jsons.dump({
                    "reference" : paymnt.reference,
                    "vipps_sub":paymnt.vipps_sub,
                    "amount": paymnt.amount,
                    "is_consumed" : paymnt.is_consumed,
                    "bookname": paymnt.bookname}))
    return paymnts 

@main_bp.route('/api/services/db_get_payments',methods=['GET','POST'])
@access_required
def db_get_payments():
    user_id = request.args['user_id']
    payments = get_payments(user_id)
    return jsonify({ "payments": payments})

           

@main_bp.route('/api/services/db_update_payment',methods=['GET','POST'])
@access_required
def db_update_payment():
    user_id = request.args['user_id']
    reference = request.args['reference']
    is_consumed = request.args['is_consumed']
    isconsumedbool = False
    if is_consumed == "true":
         isconsumedbool = True
    vipps_sub_paymnt = db.session.execute(db.select(Payment)
                           .where(Payment.reference==reference)).scalar_one_or_none()
    vipps_sub_paymnt.is_consumed = isconsumedbool
    db.session.add(vipps_sub_paymnt)
    db.session.commit()
    payments_list = get_payments(user_id)
    events_list = get_events()
    return jsonify({"events":events_list, "payments": payments_list})


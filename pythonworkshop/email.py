from __future__ import print_function
from threading import Thread
from flask import current_app, render_template
from flask_mail import Message
from . import mail
import smtplib

import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2 import service_account

import base64
from email.message import EmailMessage
import google.auth
from google.oauth2 import service_account

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
token_path = os.path.abspath('gmailtoken.json')

def gmail_send_message(receiver,subject,template,**kwargs):
    app =current_app._get_current_object()
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('pythonworkshop/gmailtoken.json'):
        creds = service_account.Credentials.from_service_account_file('pythonworkshop/gmailtoken.json', scopes=SCOPES)
    try:
        service = build('gmail', 'v1', credentials=creds)
        message = EmailMessage()

        message.set_content(template)

        message['To'] = receiver
        message['From'] = app.config['FLASKY_MAIL_SENDER']
        message['Subject'] = subject

        # encoded message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()) \
            .decode()

        create_message = {
            'raw': encoded_message
        }
        # pylint: disable=E1101
        send_message = (service.users().messages().send
                        (userId="me", body=create_message).execute())
        print(F'Message Id: {send_message["id"]}')
    except HttpError as error:
        print(F'An error occurred: {error}')
        send_message = None
    return send_message    


def send_smtp(receiver,subject,template, **kwargs):
    app =current_app._get_current_object()
    sender=app.config['FLASKY_MAIL_SENDER']
    msg = Message(app.config['FLASKY_MAIL_SUBJECT_PREFIX'] + ' ' + subject,
                  sender=sender, recipients=[receiver])
    msg.body = render_template(template + '.txt', **kwargs)
    msg.html = render_template(template + '.html', **kwargs)
    try:
        smtpObj = smtplib.SMTP('localhost')
        smtpObj.sendmail(sender, receiver, msg.body)         
        print("Successfully sent email")
    except smtplib.SMTPException:
        print("Error: unable to send email")

def send_email(to, subject, template, **kwargs):
    app = current_app._get_current_object()
    msg = Message(app.config['FLASKY_MAIL_SUBJECT_PREFIX'] + ' ' + subject,
                  sender=app.config['FLASKY_MAIL_SENDER'], recipients=[to])
    msg.body = render_template(template + '.txt', **kwargs)
    msg.html = render_template(template + '.html', **kwargs)
    thr = Thread(target=send_async_email, args=[app, msg])
    thr.start()
    return thr 

def send_guest_email(subject,template, **kwargs):
    app = current_app._get_current_object()
    msg = Message(subject,
                  sender=app.config['FLASKY_MAIL_SENDER'], 
                  recipients=[app.config['FLASKY_CONF_ADMIN']])
    msg.body = render_template(template + '.txt', **kwargs)
    msg.html = render_template(template + '.html', **kwargs)
    mail.send(msg)  

def send_adm_conf_email(adm_conf_email, subject, template, **kwargs):
    app = current_app._get_current_object()
    msg = Message(app.config['FLASKY_MAIL_SUBJECT_PREFIX'] + ' ' + subject,
                  sender=app.config['FLASKY_MAIL_SENDER'], recipients=[adm_conf_email])
    msg.body = render_template(template + '.txt', **kwargs)
    msg.html = render_template(template + '.html', **kwargs)
    mail.send(msg)

def send_async_email(app, msg):
    with app.app_context():
        print('Thread started, inside send_async_email')
        mail.send(msg)    
            
    
    

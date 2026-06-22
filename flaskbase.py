import os
import sys
from pythonworkshop import create_app, db
from dotenv import load_dotenv


#print(f'flaskbase sys.path {sys.path}')

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    #print('dotenv path exists')
    load_dotenv(dotenv_path)   

app = create_app(os.getenv('FLASK_CONFIG'))

#database is created only when flaskbase.py is run directly, 
#not when imported by uwsgi in production, in production with uwsgi the app is imported 
#and run by uwsgi, so __main__ is not true and app.run() is not called, 
#instead uwsgi will call the app directly.
if __name__== "__main__":
    with app.app_context():
        db.create_all()    
        app.run()


import sys

#sys.path.append("/home/willy/work/pythonworkshop")

from flaskbase import app, db

#__main__ is only true when the app is run directly not in production with uwsgi, 
# in production with uwsgi the app is imported and run by uwsgi, so __main__ is not true and app.run() is not called, instead uwsgi will call the app directly.
if __name__ == "__main__":
    app.run()

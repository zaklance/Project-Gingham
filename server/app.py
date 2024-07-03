import os
from flask import Flask, request, make_response, jsonify, session
from models import db, Pet, Owner, User
from flask_migrate import Migrate
from flask_cors import CORS


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URI']  # how to connect to the db
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # optional performance thing
app.secret_key = os.environ['SECRET_KEY'] # grab the secret key from env variables


db.init_app(app)  # link sqlalchemy with flask
Migrate(app, db)  # set up db migration tool (alembic)
CORS(app, supports_credentials=True)  # set up cors

@app.route('/', methods=['GET'])
def homepage():
    pass

@app.route('/login', methods=['POST'])
def login():
    pass

@app.route('/signup', methods=['POST'])
def signup():
    pass

@app.route('/logout', methods=['DELETE'])
def logout():
    pass

@app.route('/markets', methods=['GET'])
def all_markets():
    pass

@app.route('/markets/<int:id>', methods=['GET'])
def market_by_id():
    pass

@app.route('/vendors/<int:id>', methods=['GET'])
def logout():
    pass

app.route('/profile/<int:id>', methods=['GET'])
def profile():
    pass




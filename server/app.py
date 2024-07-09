import os
import json
from flask import Flask, request, make_response, jsonify, session
from models import db, User, Market, Vendor, MarketReview, VendorReview
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URI']  # how to connect to the db
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # optional performance thing
app.secret_key = os.environ['SECRET_KEY']  # grab the secret key from env variables

db.init_app(app)  # link sqlalchemy with flask
Migrate(app, db)  # set up db migration tool (alembic)
CORS(app, supports_credentials=True)  # set up cors

@app.route('/', methods=['GET'])
def homepage():
    return {"message": "Welcome to the homepage!"}, 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter(User.username == data['username']).first()
    if not user or not user.authenticate(data['password']):
        return {'error': 'login failed'}, 401
    session['user_id'] = user.id
    return user.to_dict(), 200

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    user = User.query.filter(User.username == data['username']).first()
    if user:
        return {'error': 'username already exists'}, 400
    new_user = User(
        username=data['username'], 
        password=data['password'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email']
    )
    db.session.add(new_user)
    db.session.commit()
    return new_user.to_dict(), 201

@app.route('/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return {}, 204

@app.route('/check_session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if not user_id:
        return {'error': 'authorization failed'}, 401
    user = User.query.filter(User.id == user_id).first()
    if not user:
        return {'error': 'authorization failed'}, 401
    return user.to_dict(), 200

@app.route('/markets', methods=['GET', 'POST'])
def all_markets():
    if request.method == 'GET':
        markets = Market.query.all()
        return jsonify([market.to_dict() for market in markets]), 200
    elif request.method == 'POST':
        data = request.get_json()
        new_market = Market(
            name=data['name'],
            location=data['location'],
            hours=data['hours'],
            year_round=data['year_round'],
            zipcode=data['zipcode']
        )
        db.session.add(new_market)
        db.session.commit()
        return new_market.to_dict(), 201

@app.route('/markets/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_by_id(id):
    market = Market.query.filter(Market.id == id).first()
    if not market:
        return {'error': 'market not found'}, 404
    if request.method == 'GET':
        return market.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(market, key, value)
        db.session.commit()
        return market.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(market)
        db.session.commit()
        return {}, 204
    
@app.route('/market_reviews/<int:market_id>', methods=['GET'])
def get_market_reviews(market_id):
    reviews = MarketReview.query.filter(market_id == id).all()
    return jsonify([review.to_dict() for review in reviews]), 200

@app.route('/vendors', methods=['GET', 'POST'])
def all_vendors():
    if request.method == 'GET':
        vendors = Vendor.query.all()
        return jsonify([vendor.to_dict() for vendor in vendors]), 200
    elif request.method == 'POST':
        data = request.get_json()
        new_vendor = Vendor(
            name=data['name'],
            based_out_of=data['based_out_of'],
            locations=data['locations'],
            product=data['product']
        )
        db.session.add(new_vendor)
        db.session.commit()
        return new_vendor.to_dict(), 201

@app.route('/vendors/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def vendor_by_id(id):
    vendor = Vendor.query.filter(Vendor.id == id).first()
    if not vendor:
        return {'error': 'vendor not found'}, 404
    if request.method == 'GET':
        return vendor.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(vendor, key, value)
        db.session.commit()
        return vendor.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(vendor)
        db.session.commit()
        return {}, 204

@app.route('/profile/<int:id>', methods=['GET', 'PATCH'])
def profile(id):
    user = User.query.filter(User.id == id).first()
    if not user:
        return {'error': 'user not found'}, 404

    if request.method == 'GET':
        profile_data = user.to_dict()

        profile_data['favorite_vendors'] = json.loads(user.favorite_vendors)
        profile_data['favorite_markets'] = json.loads(user.favorite_markets)

        return jsonify(profile_data), 200

    elif request.method == 'PATCH':
        try:
            user = User.query.filter_by(id=id).first()
            if not user:
                return {'error': 'User not found'}, 404

            data = request.get_json()
            for key, value in data.items():
                setattr(user, key, value)

            db.session.commit()
            return jsonify(user.to_dict()), 200

        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(port=5555, debug=True)
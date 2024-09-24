import os
import json
from flask import Flask, request, jsonify, session
from models import db, User, Market, Vendor, MarketReview, VendorReview, bcrypt
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.environ['SECRET_KEY']

db.init_app(app)
Migrate(app, db)
CORS(app, supports_credentials=True)

jwt = JWTManager(app)


@app.route('/', methods=['GET'])
def homepage():
    return {"message": "Welcome to the homepage!"}, 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter(User.username == data['username']).first()
    if not user:
        return {'error': 'login failed'}, 401
    
    if not user.authenticate(data['password']):
        return {'error': 'login failed'}, 401
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(minutes=30))
    
    return jsonify(access_token=access_token), 200

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    user = User.query.filter(User.username == data['username']).first()
    if user:
        return {'error': 'username already exists'}, 400
    new_user = User(
        email=data['email'],
        username=data['username'], 
        password=data['password'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        address=data['address']
    )
    db.session.add(new_user)
    db.session.commit()
    return new_user.to_dict(), 201

@app.route('/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return {}, 204

@app.route('/check_session', methods=['GET'])
@jwt_required()
def check_session():
    user_id = get_jwt_identity()  # Get the user ID from the token
    user = User.query.filter_by(id=user_id).first()

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
    
        profile_data['vendor_favorites'] = json.loads(user.vendor_favorites) if user.vendor_favorites else []
        profile_data['market_favorites'] = json.loads(user.market_favorites) if user.market_favorites else []
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

@app.route('/market_reviews', methods=['GET', 'POST'])
def all_market_reviews():
    if request.method == 'GET':
        market_id = request.args.get('market_id')
        if market_id:
            reviews = MarketReview.query.filter_by(market_id=market_id).options(db.joinedload(MarketReview.user)).all()
        else:
            reviews = MarketReview.query.options(db.joinedload(MarketReview.user)).all()
        return jsonify([review.to_dict() for review in reviews]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_review = MarketReview(
            review_text=data['review_text'],
            market_id=data['market_id'],
            user_id=data['user_id']
        )
        db.session.add(new_review)
        db.session.commit()
        return new_review.to_dict(), 201


@app.route('/market_reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def market_review_by_id(id):
    review = MarketReview.query.filter(MarketReview.id == id).first()
    if not review:
        return {'error': 'review not found'}, 404
    if request.method == 'GET':
        return review.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(review, key, value)
        db.session.commit()
        return review.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(review)
        db.session.commit()
        return {}, 204

@app.route('/vendor_reviews', methods=['GET', 'POST'])
def all_vendor_reviews():
    if request.method == 'GET':
        vendor_id = request.args.get('vendor_id')
        if vendor_id:
            reviews = VendorReview.query.filter_by(vendor_id=vendor_id).options(db.joinedload(VendorReview.user)).all()
        else:
            reviews = VendorReview.query.options(db.joinedload(VendorReview.user)).all()
        return jsonify([review.to_dict() for review in reviews]), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        new_review = VendorReview(
            review_text=data['review_text'],
            vendor_id=data['vendor_id'],
            user_id=data['user_id']
        )
        db.session.add(new_review)
        db.session.commit()
        return new_review.to_dict(), 201

@app.route('/vendor_reviews/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
def vendor_review_by_id(id):
    review = VendorReview.query.filter(VendorReview.id == id).first()
    if not review:
        return {'error': 'review not found'}, 404
    if request.method == 'GET':
        return review.to_dict(), 200
    elif request.method == 'PATCH':
        data = request.get_json()
        for key, value in data.items():
            setattr(review, key, value)
        db.session.commit()
        return review.to_dict(), 200
    elif request.method == 'DELETE':
        db.session.delete(review)
        db.session.commit()
        return {}, 204

@app.route('/profile/<int:user_id>/favorites', methods=['POST'])
def add_favorite_vendor(user_id):
    vendor_id = request.json.get('vendor_id')
    
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        current_favorites = json.loads(user.favorite_vendors)
    except ValueError:
        current_favorites = []

    if vendor_id not in current_favorites:
        current_favorites.append(vendor_id)
        user.favorite_vendors = json.dumps(current_favorites)
        db.session.commit()

    return jsonify({'message': 'Vendor added to favorites'}), 200

if __name__ == '__main__':
    app.run(port=5555, debug=True)
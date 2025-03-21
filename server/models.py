from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, func, Text
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.dialects.postgresql import JSON
from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin
from datetime import date, time, datetime, timezone
import re
import random

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)

db = SQLAlchemy(metadata=metadata)
bcrypt = Bcrypt()

avatars = [
        "avatar-apricot-1.jpg", "avatar-avocado-1.jpg", "avatar-cabbage-1.jpg", 
        "avatar-kiwi-1.jpg", "avatar-kiwi-2.jpg", "avatar-lime-1.jpg", "avatar-melon-1.jpg",
        "avatar-mangosteen-1.jpg", "avatar-mangosteen-2.jpg", "avatar-nectarine-1.jpg", 
        "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-peach-1.jpg", 
        "avatar-pomegranate-1.jpg", "avatar-radish-1.jpg", "avatar-tomato-1.jpg",
        "avatar-watermelon-1.jpg"
    ]

def random_avatar():
    return random.choice(avatars)

markets = [
    "market-default-1_1600px.png",
    "market-default-2_1600px.png",
    "market-default-3_1600px.png",
    "market-default-4_1600px.png"
]

def random_market():
    return random.choice(markets)

vendors = [
    "vendor-default-1_1600px.png",
    "vendor-default-2_1600px.png",
    "vendor-default-3_1600px.png"
]

def random_vendor():
    return random.choice(vendors)

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=False)
    address_1 = db.Column(db.String, nullable=False)
    address_2 = db.Column(db.String, nullable=True)
    city = db.Column(db.String, nullable=False)
    state = db.Column(db.String(2), nullable=False)
    zipcode = db.Column(db.String(10), nullable=False)
    coordinates = db.Column(db.JSON, nullable=True)
    avatar = db.Column(db.String)
    avatar_default = db.Column(db.String, nullable=False, default=random_avatar)
    status = db.Column(db.String(10), nullable=False, default="active")
    login_count = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)
    join_date = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)

    # Relationships
    market_reviews = db.relationship('MarketReview', back_populates='user', cascade="all, delete-orphan")
    vendor_reviews = db.relationship('VendorReview', back_populates='user', cascade="all, delete-orphan")
    market_favorites = db.relationship('MarketFavorite', back_populates='user', cascade="all, delete-orphan")
    vendor_favorites = db.relationship('VendorFavorite', back_populates='user', cascade="all, delete-orphan")
    blog_favorites = db.relationship('BlogFavorite', back_populates='user', cascade="all, delete-orphan")
    receipts = db.relationship('Receipt', back_populates='user', cascade="all, delete-orphan")
    user_issues = db.relationship('UserIssue', back_populates='user', cascade="all, delete-orphan")

    serialize_rules = (
        '-_password',
        '-market_reviews.user',
        '-vendor_reviews.user',
        '-market_favorites',
        '-vendor_favorites',
        '-blog_favorites',
        '-user_issues.user'
    )

    @validates('first_name')
    def validate_first_name(self, key, value):
        if not value:
            raise ValueError("First name is required")
        if len(value) < 1 or len(value) > 16:
            raise ValueError("First name must be between 1 and 16 characters")
        return value

    @validates('last_name')
    def validate_last_name(self, key, value):
        if not value:
            raise ValueError("Last name is required")
        if len(value) < 1 or len(value) > 16:
            raise ValueError("Last name must be between 1 and 16 characters")
        return value

    @validates('email')
    def validate_email(self, key, value):
        if not value:
            raise ValueError("Email is required")
        if "@" not in value or "." not in value:
            raise ValueError("Invalid email address")
        return value

    # @validates('phone')
    # def validate_phone(self, key, value):
    #     cleaned_phone = re.sub(r'\D', '', value)
    #     if len(value) != 10:
    #         raise ValueError("Phone number must contain exactly 10 digits")
    #     return cleaned_phone

    @validates('address_1')
    def validate_address_1(self, key, value):
        if not value:
            raise ValueError("Address 1 is required")
        if len(value) > 100:
            raise ValueError("Address 1 cannot be longer than 100 characters")
        return value

    @validates('address_2')
    def validate_address_2(self, key, value):
        if value and len(value) > 100:
            raise ValueError("Address 2 cannot be longer than 100 characters")
        return value

    @validates('city')
    def validate_city(self, key, value):
        if not value:
            raise ValueError("City is required")
        if len(value) > 50:
            raise ValueError("City cannot be longer than 50 characters")
        return value

    @validates('state')
    def validate_state(self, key, value):
        if not value:
            raise ValueError("State is required")
        if len(value) != 2:
            raise ValueError("State must be a 2-letter code")
        return value

    @validates('zipcode')
    def validate_zipcode(self, key, value):
        if not value:
            raise ValueError("Zipcode code is required")
        if len(value) > 10:
            raise ValueError("Zipcode code cannot be longer than 10 characters")
        return value

    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, new_password):
        hash = bcrypt.generate_password_hash(new_password.encode('utf-8'))
        self._password = hash

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password, password.encode('utf-8'))

    def __repr__(self) -> str:
        return f"<User {self.email}>"

class Market(db.Model, SerializerMixin):
    __tablename__ = 'markets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    website = db.Column(db.String, nullable=True)
    bio = db.Column(db.String, nullable=True)
    image = db.Column(db.String, nullable=True)
    image_default = db.Column(db.String, nullable=False, default=random_market)
    location = db.Column(db.String, nullable=False)
    city = db.Column(db.String, nullable=False)
    state = db.Column(db.String, nullable=False)
    zipcode = db.Column(db.String, nullable=True)
    coordinates = db.Column(db.JSON, nullable=True)
    maps = db.Column(MutableDict.as_mutable(JSON), nullable=True)
    maps_organizer = db.Column(db.String, nullable=True)
    schedule = db.Column(db.String, nullable=True) # LOCAL TIME (user input via template)
    year_round = db.Column(db.Boolean, nullable=True)
    season_start = db.Column(db.Date, nullable=True) # LOCAL TIME (user input)
    season_end = db.Column(db.Date, nullable=True) # LOCAL TIME (user input)
    is_flagship = db.Column(db.Boolean, nullable=False, default=False)
    is_current = db.Column(db.Boolean, nullable=False, default=True)
    is_visible = db.Column(db.Boolean, nullable=False, default=True)

    # Relationships
    reviews = db.relationship('MarketReview', back_populates='market', lazy='dynamic', cascade="all, delete-orphan")
    market_favorites = db.relationship('MarketFavorite', back_populates='market', lazy='dynamic', cascade="all, delete-orphan")
    market_days = db.relationship('MarketDay', back_populates='markets', cascade="all, delete-orphan")

    serialize_rules = (
        '-reviews.market', 
        '-market_favorites.market', 
        '-vendor_markets.market', 
        '-reviews.user.vendor_reviews', 
        '-reviews.user.market_reviews'
    )

    # Validations
    @validates('name', 'location', 'hours')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"{key} cannot be empty")
        return value

    @validates('zipcode')
    def validate_zipcode(self, key, value):
        if value and len(value) != 5:
            raise ValueError("Zipcode must be 5 characters long")
        return value

    def __repr__(self) -> str:
        return f"<Market {self.name}>"

class MarketDay(db.Model, SerializerMixin):
    __tablename__ = 'market_days'

    id = db.Column(db.Integer, primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    hour_start = db.Column(db.Time, nullable=True) # LOCAL TIME (user input)
    hour_end = db.Column(db.Time, nullable=True) # LOCAL TIME (user input)
    day_of_week = db.Column(db.Integer, nullable=True)

    # Relationships
    markets = db.relationship('Market', back_populates='market_days')
    vendor_markets = db.relationship( 'VendorMarket', back_populates="market_day")

    serialize_rules = (
        '-markets.market_days', 
        '-markets.reviews', 
        '-markets.market_favorites', 
        '-vendor_markets.market_day', 
        '-vendor_markets.vendor.reviews'
    )

    # Validations
    @validates('name', 'location', 'hours')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"{key} cannot be empty")
        return value

    def __repr__(self) -> str:
        return f"<Market {self.name}>"
    
class Vendor(db.Model, SerializerMixin):
    __tablename__ = 'vendors'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    city = db.Column(db.String, nullable=False)
    state = db.Column(db.String(2), nullable=False)
    products = db.Column(db.JSON, nullable=False)
    products_subcategories = db.Column(db.JSON, nullable=True)
    bio = db.Column(db.String, nullable=True)
    website = db.Column(db.String, nullable=True)
    image = db.Column(db.String)
    image_default = db.Column(db.String, nullable=False, default=random_vendor)
    stripe_account_id = db.Column(db.String, nullable=True)  # bring back unique=True post deployment
    stripe_is_onboarded = db.Column(db.Boolean, nullable=False, default=False)
    stripe_charges_enabled = db.Column(db.Boolean, nullable=False, default=False)
    stripe_payouts_enabled = db.Column(db.Boolean, nullable=False, default=False)

    # Relationships
    reviews = db.relationship('VendorReview', back_populates='vendor', lazy='dynamic', cascade="all, delete-orphan")
    vendor_favorites = db.relationship('VendorFavorite', back_populates='vendor', lazy='dynamic', cascade="all, delete-orphan")
    vendor_markets = db.relationship('VendorMarket', back_populates='vendor', cascade="all, delete-orphan")

    serialize_rules = (
        '-reviews.vendor', 
        '-vendor_favorites.vendor', 
        '-vendor_vendor_users.vendor', 
        '-vendor_markets.vendor', 
        '-reviews.user.market_reviews', 
        '-vendor_vendor_users.email',
    )

    @validates('name', 'products')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"{key} cannot be empty")
        return value

    @validates('city', 'state')
    def validate_optional_string(self, key, value):
        if value and len(value) == 0:
            raise ValueError(f"{key} cannot be empty")
        return value

    def __repr__(self) -> str:
        return f"<Vendor {self.name}>"

class VendorMarket(db.Model, SerializerMixin):
    __tablename__ = 'vendor_markets'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'))
    market_day_id = db.Column(db.Integer, db.ForeignKey('market_days.id'))

    vendor = db.relationship('Vendor', back_populates='vendor_markets')
    market_day = db.relationship( 'MarketDay', back_populates="vendor_markets")

    serialize_rules = (
        '-vendor.vendor_markets', 
        '-market_day.vendor_markets', 
        '-market_day.markets.market_favorites', 
        '-vendor.vendor_favorites', 
        'market_day.markets.is_visible', 
        '-vendor.reviews'
    )

    def __repr__(self) -> str:
        return f"<VendorMarket Vendor ID: {self.vendor_id}, Market ID: {self.market_id}>"

class MarketReview(db.Model, SerializerMixin):
    __tablename__ = 'market_reviews'

    id = db.Column(db.Integer, primary_key=True)
    review_text = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_date = db.Column(db.Date, nullable=False, default=datetime.utcnow) # GMT (system generated, YYYY-MM-DD only)
    is_reported = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)

    # Relationships
    market = db.relationship('Market', back_populates='reviews')
    user = db.relationship('User', back_populates='market_reviews')
    ratings = db.relationship('MarketReviewRating', back_populates='review', cascade="all, delete-orphan")


    serialize_rules = (
        '-user', 
        '-market.reviews', 
        '-market.market_favorites', 
        '-market.vendor_markets', 
        '-user.market_reviews', 
        '-user.vendor_reviews',
        '-ratings.review',
        'user.first_name'
    )

    def __repr__(self) -> str:
        return f"<MarketReview {self.id}>"

    @validates('review_text')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"Review text cannot be empty")
        return value

class VendorReview(db.Model, SerializerMixin):
    __tablename__ = 'vendor_reviews'

    id = db.Column(db.Integer, primary_key=True)
    review_text = db.Column(db.String, nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_date = db.Column(db.Date, nullable=False, default=datetime.utcnow) # GMT (system generated, YYYY-MM-DD only)
    vendor_response = db.Column(db.String, nullable=True)
    response_date = db.Column(db.Date, nullable=True) # GMT (system generated, YYYY-MM-DD only)
    is_reported = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)

    # Relationships
    vendor = db.relationship('Vendor', back_populates='reviews')
    user = db.relationship('User', back_populates='vendor_reviews')
    ratings = db.relationship('VendorReviewRating', back_populates='review', cascade="all, delete-orphan")

    serialize_rules = (
        '-vendor.reviews', 
        '-vendor.vendor_favorites', 
        '-user.vendor_reviews', 
        '-user.market_reviews', 
        '-vendor.vendor_markets', 
        '-ratings.review',
        'user.first_name',
    )

    def __repr__(self) -> str:
        return f"<VendorReview {self.id}>"

    @validates('review_text')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"Review text cannot be empty")
        return value

class MarketReviewRating(db.Model, SerializerMixin):
    __tablename__ = 'market_review_ratings'

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('market_reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vote_down = db.Column(db.Boolean, default=False)
    vote_up = db.Column(db.Boolean, default=False)

    # Relationships
    review = db.relationship('MarketReview', back_populates='ratings')

    serialize_rules = ('-review.ratings',)

    def __repr__(self) -> str:
        return f"<VendorReviewRating {self.id}>"

class VendorReviewRating(db.Model, SerializerMixin):
    __tablename__ = 'vendor_review_ratings'

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('vendor_reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vote_down = db.Column(db.Boolean, default=False)
    vote_up = db.Column(db.Boolean, default=False)

    # Relationships
    review = db.relationship('VendorReview', back_populates='ratings')
    
    serialize_rules = ('-review.ratings',)

    def __repr__(self) -> str:
        return f"<VendorReviewRating {self.id}>"

class ReportedReview(db.Model, SerializerMixin):
    __tablename__ = 'reported_reviews'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self) -> str:
        return f"<ReportedReview {self.id}>"
    
class MarketFavorite(db.Model, SerializerMixin):
    __tablename__ = 'market_favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)

    user = db.relationship('User', back_populates='market_favorites')
    market = db.relationship('Market', back_populates='market_favorites')

    serialize_rules = (
        '-user', 
        '-market', 
        'market.name', 
        '-market.reviews', 
        '-market.market_favorites', 
        '-market.market_days'
    )

    def __repr__(self) -> str:
        return f"<MarketFavorite ID: {self.id}, User ID: {self.user_id}, Market ID: {self.market_id}>"
    
class VendorFavorite(db.Model, SerializerMixin):
    __tablename__ = 'vendor_favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)

    user = db.relationship('User', back_populates='vendor_favorites')
    vendor = db.relationship('Vendor', back_populates='vendor_favorites')

    serialize_rules = (
        '-user', 
        '-vendor', 
        'vendor.name', 
        '-vendor.reviews', 
        '-vendor.vendor_favorites', 
        '-vendor.vendor_markets'
    )

    def __repr__(self) -> str:
        return f"<VendorFavorite ID: {self.id}, User ID: {self.user_id}, Market ID: {self.vendor_id}>"
    
class VendorUser(db.Model, SerializerMixin):
    __tablename__ = 'vendor_users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=False)
    active_vendor = db.Column(db.Integer, nullable=True)
    vendor_id = db.Column(MutableDict.as_mutable(JSON), nullable=True)
    vendor_role = db.Column(MutableDict.as_mutable(JSON), nullable=True)
    login_count = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)
    join_date = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)

    # notifications = db.relationship('VendorNotification', back_populates='vendor_user')

    serialize_rules = ('-_password', '-vendor_vendor_users.vendor_user')

    @validates('email')
    def validate_email(self, key, value):
        if not value:
            raise ValueError("Email is required")
        if "@" not in value or "." not in value:
            raise ValueError("Invalid email address")
        return value

    @validates('first_name', 'last_name')
    def validate_name(self, key, value):
        if not value:
            raise ValueError(f"{key.replace('_', ' ').capitalize()} is required")
        if len(value) < 1 or len(value) > 50:
            raise ValueError(f"{key.replace('_', ' ').capitalize()} must be between 1 and 50 characters")
        return value

    # @validates('phone')
    # def validate_phone(self, key, value):
    #     cleaned_phone = re.sub(r'\D', '', value)
    #     if len(cleaned_phone) != 10:
    #         raise ValueError("Phone number must contain exactly 10 digits")
    #     return cleaned_phone

    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, new_password):
        hash = bcrypt.generate_password_hash(new_password.encode('utf-8'))
        self._password = hash

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password, password.encode('utf-8'))

    def __repr__(self) -> str:
        return f"<VendorUser {self.email} {self.vendor_role}>"
   
class AdminUser(db.Model, SerializerMixin):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=True)
    admin_role = db.Column(db.Integer, default=5)
    login_count = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)
    join_date = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)

    serialize_rules = ('-_password',)

    @validates('email')
    def validate_email(self, key, value):
        if not value:
            raise ValueError("Email is required")
        if "@gingham.nyc" not in value and "@mufo.nyc" not in value:
            raise ValueError("Invalid email address")
        return value

    @validates('first_name', 'last_name')
    def validate_name(self, key, value):
        if not value:
            raise ValueError(f"{key.replace('_', ' ').capitalize()} is required")
        if len(value) < 1 or len(value) > 50:
            raise ValueError(f"{key.replace('_', ' ').capitalize()} must be between 1 and 50 characters")
        return value

    # @validates('phone')
    # def validate_phone(self, key, value):
    #     cleaned_phone = re.sub(r'\D', '', value)
    #     if len(cleaned_phone) != 10:
    #         raise ValueError("Phone number must contain exactly 10 digits")
    #     return cleaned_phone

    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, new_password):
        hash = bcrypt.generate_password_hash(new_password.encode('utf-8'))
        self._password = hash

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password, password.encode('utf-8'))

    def __repr__(self) -> str:
        return f"<AdminUser {self.email}>"
    
class Basket(db.Model, SerializerMixin):
    __tablename__ = 'baskets'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    market_day_id = db.Column(db.Integer, db.ForeignKey('market_days.id'), nullable=True)
    sale_date = db.Column(db.Date, nullable=True) # LOCAL TIME (system generated, saved as local)
    pickup_start = db.Column(db.Time, nullable=False) # LOCAL TIME (user generated)
    pickup_end = db.Column(db.Time, nullable=False) # LOCAL TIME (user generated)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_sold = db.Column(db.Boolean, nullable=False, default=False)
    is_grabbed = db.Column(db.Boolean, nullable=False, default=False)
    is_refunded = db.Column(db.Boolean, nullable=False, default=False)
    price = db.Column(db.Float, nullable=False)
    value = db.Column(db.Float, nullable=True)
    fee_vendor = db.Column(db.Float, nullable=False, default=0)
    fee_user = db.Column(db.Float, nullable=False, default=0)
    stripe_transfer_id= db.Column(db.String, nullable=True)

    vendor = db.relationship('Vendor', lazy='joined')
    market_day = db.relationship('MarketDay', lazy='joined')
    qr_codes = db.relationship('QRCode', back_populates='baskets')
    user_issues = db.relationship('UserIssue', back_populates='basket', cascade="all, delete-orphan")

    serialize_rules = (
        '-vendor.baskets', 
        '-market_day.baskets', 
        '-qr_codes.baskets', 
        '-market_day.vendor_markets', 
        '-vendor.reviews', 
        '-vendor.vendor_markets',
        '-vendor.vendor_favorites',
        '-user_issues.basket'
    )

    # @validates('sale_date')
    # def validate_sale_date(self, key, value):
    #     if value < date.today():
    #         raise ValueError("Sale date cannot be in the past")
    #     return value

    @hybrid_property
    def sale_date_str(self):
        return self.sale_date.strftime('%Y-%m-%d') if self.sale_date else None

    @validates('is_sold', 'is_grabbed')
    def validate_boolean(self, key, value):
        if not isinstance(value, bool):
            raise ValueError(f"{key} must be a boolean value")
        return value
    
    @validates('price')
    def set_fees(self, key, price):
        if not isinstance(price, (int, float)) or price < 0:
            raise ValueError(f"{key} must be a non-negative integer")
        self.fee_vendor = round(min(price * 0.2, 3), 2)
        self.fee_user = round(min(price * 0.029, 3) + .30, 2)
        return price
    
    @validates('value')
    def validate_value(self, key, value):
        if not isinstance(value, (int, float)) or value < 0:
            raise ValueError(f"{key} must be a non-negative integer")
        return value

    def __repr__(self):
        return (f"<Basket ID: {self.id}, Vendor: {self.vendor.name}, "
                f"Market ID: {self.market_day_id}, Sold: {self.is_sold}, Value: {self.value}>")

class UserNotification(db.Model, SerializerMixin):
    __tablename__ = 'user_notifications'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    link = db.Column(db.String, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    market_day_id = db.Column(db.Integer, db.ForeignKey('market_days.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return (f"<User Notification ID: {self.id}, created on {self.created_at}")

class VendorNotification(db.Model, SerializerMixin):
    __tablename__ = 'vendor_notifications'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    link = db.Column(db.String, nullable=True)
    data = db.Column(db.String, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    market_day_id = db.Column(db.Integer, db.ForeignKey('market_days.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    # vendor = db.relationship('Vendor', back_populates='notifications')
    # vendor_user = db.relationship('VendorUser', back_populates='notifications')

    # serialize_rules = ('vendor_user.first_name', 'vendor_user.last_name')

    def get_vendor_name(self):
        return Vendor.query.filter_by(id=self.vendor_id).first().name

    def __repr__(self):
        return (f"<Vendor Notification ID: {self.id}, created on {self.created_at}")

class AdminNotification(db.Model, SerializerMixin):
    __tablename__ = 'admin_notifications'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    link = db.Column(db.String, nullable=True)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=True)
    admin_role = db.Column(db.Integer, nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return (f"<Vendor Notification ID: {self.id}, created on {self.created_at}")
    
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(24), nullable=False)
    message = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    start_date = db.Column(db.Date, nullable=False) # LOCAL TIME (user generated)
    end_date = db.Column(db.Date, nullable=False) # LOCAL TIME (user generated)
    schedule_change = db.Column(db.Boolean, default=False, nullable=False)

    @validates('title')
    def validate_title(self, key, value):
        if len(value) > 24:
            raise ValueError("Title must be 24 characters or fewer")
        return value

    def to_dict(self):
        start_date_str = self.start_date.strftime('%Y-%m-%d')
        end_date_str = self.end_date.strftime('%Y-%m-%d')
        
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "market_id": self.market_id,
            "vendor_id": self.vendor_id,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "schedule_change": self.schedule_change
        }
    
    def __repr__(self):
        return (f"<User Notification ID: {self.id}, created on {self.created_at}")

class Product(db.Model, SerializerMixin):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    product = db.Column(db.String, nullable=False)

    def __repr__(self) -> str:
        return f"<Product ID: {self.id}, Product: {self.product}>"
    
class QRCode(db.Model, SerializerMixin):
    __tablename__ = 'qr_codes'

    id = db.Column(db.Integer, primary_key=True)
    qr_code = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    basket_id = db.Column(db.Integer, db.ForeignKey('baskets.id'), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)

    baskets = db.relationship('Basket', back_populates='qr_codes')

    serialize_rules = (
        '-baskets.qr_codes', 
        '-baskets.market_day', 
        '-baskets.vendor.reviews', 
        '-baskets.vendor.vendor_favorites', 
        '-baskets.vendor.vendor_markets'
    )

    def __repr__(self) -> str:
        return f"<MarketFavorite ID: {self.id}, User ID: {self.user_id}, Market ID: {self.basket_id}>"

class FAQ(db.Model, SerializerMixin):
    __tablename__ = 'faqs'

    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String, nullable=False)
    answer = db.Column(db.String, nullable=False)
    for_user = db.Column(db.Boolean, default=False, nullable=False)
    for_vendor = db.Column(db.Boolean, default=False, nullable=False)
    for_admin = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<FAQ ID: {self.id}, Question: {self.question}, Answer: {self.answer}>"

class Blog(db.Model, SerializerMixin):
    __tablename__ = 'blogs'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String, nullable=False, default='general')
    title = db.Column(db.String, nullable=False)
    body = db.Column(db.String, nullable=False)
    for_user = db.Column(db.Boolean, default=False, nullable=False)
    for_vendor = db.Column(db.Boolean, default=False, nullable=False)
    for_admin = db.Column(db.Boolean, default=False, nullable=False)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('admin_users.id'), nullable=False)
    post_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # GMT (system generated)

    blog_favorites = db.relationship('BlogFavorite', back_populates='blog')

    serialize_rules = ('-blog_favorites',)

    def __repr__(self) -> str:
        return f"<Blog ID: {self.id}, Title: {self.title}, Body: {self.body}, Admin ID: {self.admin_user_id}, Post Date: {self.post_date}>"
    
class BlogFavorite(db.Model, SerializerMixin):
    __tablename__ = 'blog_favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    blog_id = db.Column(db.Integer, db.ForeignKey('blogs.id'), nullable=False)

    user = db.relationship('User', back_populates='blog_favorites')
    blog = db.relationship('Blog', back_populates='blog_favorites')

    serialize_rules = (
        '-blog.blog_favorites', 
        '-user.blog_favorites', 
        '-user.market_reviews', 
        '-user.vendor_reviews'
    )

    def __repr__(self) -> str:
        return f"<BlogFavorite ID: {self.id}, User ID: {self.user_id}, Blog ID: {self.blog_id}>"
    
class Receipt(db.Model, SerializerMixin):
    __tablename__ = 'receipts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    baskets = db.Column(db.JSON, nullable=False)
    payment_intent_id = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)

    # Relationships
    user = db.relationship('User', back_populates='receipts')

    serialize_rules = ('-user.receipts',)

    def __repr__(self) -> str:
        return f"<Receipt ID: {self.id}, User ID: {self.user_id}, Baskets: {self.baskets}, Created At: {self.created_at}>"

class SettingsUser(db.Model, SerializerMixin):
    __tablename__ = 'settings_users'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    site_fav_market_new_event = db.Column(db.Boolean, default=True, nullable=False)
    site_fav_market_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    site_fav_market_new_vendor = db.Column(db.Boolean, default=True, nullable=False)
    site_fav_market_new_basket = db.Column(db.Boolean, default=True, nullable=False)
    site_fav_vendor_new_event = db.Column(db.Boolean, default=True, nullable=False)
    site_fav_vendor_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    site_fav_vendor_new_basket = db.Column(db.Boolean, default=True, nullable=False)
    site_basket_pickup_time = db.Column(db.Boolean, default=True, nullable=False)
    site_vendor_review_response = db.Column(db.Boolean, default=True, nullable=False)
    site_new_blog = db.Column(db.Boolean, default=True, nullable=False)
    site_new_market_in_city = db.Column(db.Boolean, default=True, nullable=False)
    
    email_fav_market_new_event = db.Column(db.Boolean, default=True, nullable=False)
    email_fav_market_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    email_fav_market_new_vendor = db.Column(db.Boolean, default=False, nullable=False)
    email_fav_market_new_basket = db.Column(db.Boolean, default=False, nullable=False)
    email_fav_vendor_new_event = db.Column(db.Boolean, default=False, nullable=False)
    email_fav_vendor_schedule_change = db.Column(db.Boolean, default=False, nullable=False)
    email_fav_vendor_new_basket = db.Column(db.Boolean, default=False, nullable=False)
    email_basket_pickup_time = db.Column(db.Boolean, default=False, nullable=False)
    email_vendor_review_response = db.Column(db.Boolean, default=False, nullable=False)
    email_new_blog = db.Column(db.Boolean, default=True, nullable=False)
    email_new_market_in_city = db.Column(db.Boolean, default=True, nullable=False)
    
    text_fav_market_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    text_fav_market_new_basket = db.Column(db.Boolean, default=False, nullable=False)
    text_fav_vendor_schedule_change = db.Column(db.Boolean, default=False, nullable=False)
    text_basket_pickup_time = db.Column(db.Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<User Settings ID: {self.id}, User ID: {self.user_id}>"

class SettingsVendor(db.Model, SerializerMixin):
    __tablename__ = 'settings_vendors'

    id = db.Column(db.Integer, primary_key=True)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=False)
    market_locations = db.Column(MutableList.as_mutable(JSON), nullable=True)
    
    site_market_new_event = db.Column(db.Boolean, default=True, nullable=False)
    site_market_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    site_basket_sold = db.Column(db.Boolean, default=True, nullable=False)
    site_new_review = db.Column(db.Boolean, default=True, nullable=False)
    site_new_blog = db.Column(db.Boolean, default=True, nullable=False)
    site_new_statement = db.Column(db.Boolean, default=True, nullable=False)

    email_market_new_event = db.Column(db.Boolean, default=True, nullable=False)
    email_market_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    email_basket_sold = db.Column(db.Boolean, default=False, nullable=False)
    email_new_review = db.Column(db.Boolean, default=False, nullable=False)
    email_new_blog = db.Column(db.Boolean, default=True, nullable=False)
    email_new_statement = db.Column(db.Boolean, default=True, nullable=False)

    text_market_schedule_change = db.Column(db.Boolean, default=True, nullable=False)
    text_basket_sold = db.Column(db.Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<Vendor Settings ID: {self.id} Vendor User ID: {self.vendor_user_id}>"

class SettingsAdmin(db.Model, SerializerMixin):
    __tablename__ = 'settings_admins'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin_users.id'), nullable=False)
    
    site_report_review = db.Column(db.Boolean, default=True, nullable=False)
    site_product_request = db.Column(db.Boolean, default=True, nullable=False)
    site_new_blog = db.Column(db.Boolean, default=True, nullable=False)
    
    email_report_review = db.Column(db.Boolean, default=False, nullable=False)
    email_product_request = db.Column(db.Boolean, default=True, nullable=False)
    email_new_blog = db.Column(db.Boolean, default=True, nullable=False)
    
    text_report_review = db.Column(db.Boolean, default=False, nullable=False)
    text_product_request = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<Admin Settings ID: {self.id} Admin ID: {self.admin_id}>"

class UserIssue(db.Model, SerializerMixin): 
    __tablename__ = 'user_issues'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    basket_id = db.Column(db.Integer, db.ForeignKey('baskets.id'), nullable=True)
    issue_type = db.Column(db.String, nullable=False)
    issue_subtype = db.Column(db.String, nullable=False)
    body = db.Column(db.String, nullable=False)
    status = db.Column(db.String, default="Pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # GMT (system generated)

    user = db.relationship('User', back_populates='user_issues')
    basket = db.relationship('Basket', back_populates='user_issues')

    serialize_rules = (
        '-user.user_issues',
        '-basket.user_issues',
        '-user.blog_favorites', 
        '-user.market_reviews', 
        '-user.vendor_reviews',
        '-baskets.market_day', 
        '-baskets.vendor.reviews', 
        '-baskets.vendor.vendor_favorites', 
        '-baskets.vendor.vendor_markets'
    )
    
    def __repr__(self) -> str: 
        return f"<User Issues ID: {self.id}, User ID: {self.user_id}>"
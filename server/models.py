from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, func
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
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
        "avatar-apricot-1.jpg", "avatar-avocado-1.jpg", "avatar-avocado-2.jpg", "avatar-cabbage-1.jpg",
        "avatar-kiwi-1.jpg", "avatar-kiwi-2.jpg", "avatar-lime-1.jpg", "avatar-melon-1.jpg",
        "avatar-nectarine-1.jpg", "avatar-onion-1.jpg", "avatar-onion-2.jpg", "avatar-onion-3.jpg",
        "avatar-peach-1.jpg", "avatar-pomegranate-1.jpg", "avatar-radish-1.jpg", "avatar-tomato-1.jpg",
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
    avatar = db.Column(db.String)
    avatar_default = db.Column(db.String, nullable=False, default=random_avatar)
    status = db.Column(db.String(10), nullable=False, default="active")

    # Relationships
    market_reviews = db.relationship('MarketReview', back_populates='user')
    vendor_reviews = db.relationship('VendorReview', back_populates='user')
    market_favorites = db.relationship('MarketFavorite', back_populates='user')
    vendor_favorites = db.relationship('VendorFavorite', back_populates='user')

    serialize_rules = (
        '-_password',
        '-market_reviews.user',
        '-vendor_reviews.user',
        '-market_favorites',
        '-vendor_favorites'
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

    @validates('phone')
    def validate_phone(self, key, value):
        cleaned_phone = re.sub(r'\D', '', value)  # Remove non-digit characters
        if len(cleaned_phone) != 10:
            raise ValueError("Phone number must contain exactly 10 digits")
        return cleaned_phone

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
    image = db.Column(db.String, nullable=True)
    image_default = db.Column(db.String, nullable=False, default=random_market)
    location = db.Column(db.String, nullable=False)
    zipcode = db.Column(db.String, nullable=True)
    coordinates = db.Column(db.JSON, nullable=True)
    schedule = db.Column(db.String, nullable=True)
    year_round = db.Column(db.Boolean, nullable=True)
    season_start = db.Column(db.Date, nullable=True)
    season_end = db.Column(db.Date, nullable=True)
    is_visible = db.Column(db.Boolean, nullable=True, default=True)

    # Relationships
    reviews = db.relationship('MarketReview', back_populates='market', lazy='dynamic', cascade="all, delete")
    market_favorites = db.relationship('MarketFavorite', back_populates='market', lazy='dynamic', cascade="all, delete")
    market_days = db.relationship('MarketDay', back_populates='markets', cascade="all, delete")

    serialize_rules = ('-reviews.market', '-market_favorites.market', '-vendor_markets.market', '-reviews.user.vendor_reviews', '-reviews.user.market_reviews')

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
    hour_start = db.Column(db.Time, nullable=True)
    hour_end = db.Column(db.Time, nullable=True)
    day_of_week = db.Column(db.Integer, nullable=True)

    # Relationships
    markets = db.relationship('Market', back_populates='market_days')
    vendor_markets = db.relationship( 'VendorMarket', back_populates="market_day")

    serialize_rules = ('-markets.market_days', '-markets.reviews', '-markets.market_favorites', '-vendor_markets.market_day', '-vendor_markets.vendor.reviews')

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
    city = db.Column(db.String, nullable=True)
    state = db.Column(db.String(2), nullable=True)
    product = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    bio = db.Column(db.String, nullable=True)
    image = db.Column(db.String)
    image_default = db.Column(db.String, nullable=False, default=random_vendor)

    # Relationships
    reviews = db.relationship('VendorReview', back_populates='vendor', lazy='dynamic', cascade="all, delete")
    vendor_favorites = db.relationship('VendorFavorite', back_populates='vendor', lazy='dynamic', cascade="all, delete")
    # vendor_vendor_users = db.relationship('VendorVendorUser', back_populates='vendor', lazy='dynamic')
    vendor_markets = db.relationship('VendorMarket', back_populates='vendor', cascade="all, delete")
    # notifications = db.relationship('VendorNotification', back_populates='vendor', lazy='dynamic')

    serialize_rules = (
        '-reviews.vendor', '-vendor_favorites.vendor', '-vendor_vendor_users.vendor', 
        '-vendor_markets.vendor', '-reviews.user.market_reviews', '-vendor_vendor_users.email',
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'city': self.city,
            'state': self.state,
            'product': self.product,
            'bio': self.bio,
            'image': self.image,
            'image_default': self.image_default,
        }

    # Validations
    @validates('name', 'product')
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

    serialize_rules = ('-vendor.vendor_markets', '-market_day.vendor_markets', '-market_day.markets.market_favorites', '-vendor.vendor_favorites', 'market_day.markets.is_visible')

    def __repr__(self) -> str:
        return f"<VendorMarket Vendor ID: {self.vendor_id}, Market ID: {self.market_id}>"

class MarketReview(db.Model, SerializerMixin):
    __tablename__ = 'market_reviews'

    id = db.Column(db.Integer, primary_key=True)
    review_text = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    is_reported = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)

    # Relationships
    market = db.relationship('Market', back_populates='reviews')
    user = db.relationship('User', back_populates='market_reviews')

    serialize_rules = ('-user', '-market.reviews', '-market.market_favorites', '-market.vendor_markets', '-user.market_reviews', '-user.vendor_reviews', 'user.first_name')

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
    post_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    is_reported = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)

    # Relationships
    vendor = db.relationship('Vendor', back_populates='reviews')
    user = db.relationship('User', back_populates='vendor_reviews')

    serialize_rules = ('-vendor.reviews', '-vendor.vendor_favorites', '-user.vendor_reviews', '-user.market_reviews', '-vendor.vendor_markets', 'user.first_name')

    def __repr__(self) -> str:
        return f"<VendorReview {self.id}>"

    @validates('review_text')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"Review text cannot be empty")
        return value

class MarketReviewRating(db.Model):
    __tablename__ = 'market_review_ratings'

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('market_reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vote_down = db.Column(db.Boolean, default=False)
    vote_up = db.Column(db.Boolean, default=False)

    def __repr__(self) -> str:
        return f"<VendorReviewRating {self.id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "review_id": self.review_id,
            "user_id": self.user_id,
            "vote_down": self.vote_down,
            "vote_up": self.vote_up
        }

class VendorReviewRating(db.Model):
    __tablename__ = 'vendor_review_ratings'

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('vendor_reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vote_down = db.Column(db.Boolean, default=False)
    vote_up = db.Column(db.Boolean, default=False)

    def __repr__(self) -> str:
        return f"<VendorReviewRating {self.id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "review_id": self.review_id,
            "user_id": self.user_id,
            "vote_down": self.vote_down,
            "vote_up": self.vote_up
        }

class ReportedReview(db.Model):
    __tablename__ = 'reported_reviews'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self) -> str:
        return f"<ReportedReview {self.id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id
        }
    
class MarketFavorite(db.Model, SerializerMixin):
    __tablename__ = 'market_favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)

    user = db.relationship('User', back_populates='market_favorites')
    market = db.relationship('Market', back_populates='market_favorites')

    serialize_rules = ('-user', '-market', 'market.name', '-market.reviews', '-market.market_favorites')

    def __repr__(self) -> str:
        return f"<MarketFavorite ID: {self.id}, User ID: {self.user_id}, Market ID: {self.market_id}>"
    
class VendorFavorite(db.Model, SerializerMixin):
    __tablename__ = 'vendor_favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)

    user = db.relationship('User', back_populates='vendor_favorites')
    vendor = db.relationship('Vendor', back_populates='vendor_favorites')

    serialize_rules = ('-user', '-vendor', 'vendor.name', '-vendor.reviews', '-vendor.vendor_favorites')

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
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    is_admin = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    # vendor_vendor_users = db.relationship('VendorVendorUser', back_populates='vendor_user', lazy='dynamic')
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

    @validates('phone')
    def validate_phone(self, key, value):
        cleaned_phone = re.sub(r'\D', '', value)
        if len(cleaned_phone) != 10:
            raise ValueError("Phone number must contain exactly 10 digits")
        return cleaned_phone

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
        return f"<VendorUser {self.email}>"
    
class VendorVendorUser(db.Model, SerializerMixin):
    __tablename__ = 'vendor_vendor_users'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=False)

    # Relationships
    # vendor = db.relationship('Vendor', back_populates='vendor_vendor_users')
    # vendor_user = db.relationship('VendorUser', back_populates='vendor_vendor_users')

    serialize_rules = ('-vendor.vendor_vendor_users', '-vendor_user.vendor_vendor_users')

    def __repr__(self) -> str:
        return f"<VendorVendorUser Vendor ID: {self.vendor_id}, VendorUser ID: {self.vendor_user_id}>"
   
class AdminUser(db.Model, SerializerMixin):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=True)

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

    @validates('phone')
    def validate_phone(self, key, value):
        if value and len(value) > 15:
            raise ValueError("Phone number cannot be longer than 15 characters")
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
        return f"<AdminUser {self.email}>"
    
class Basket(db.Model, SerializerMixin):
    __tablename__ = 'baskets'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    market_day_id = db.Column(db.Integer, db.ForeignKey('market_days.id'), nullable=True)
    sale_date = db.Column(db.Date, nullable=True)
    pickup_start = db.Column(db.Time, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_sold = db.Column(db.Boolean, nullable=True)
    is_grabbed = db.Column(db.Boolean, nullable=True)
    price = db.Column(db.Float, nullable=False)
    basket_value = db.Column(db.Float, nullable=True)
    pickup_end = db.Column(db.Time, nullable=False)

    vendor = db.relationship('Vendor', lazy='joined')
    market_day = db.relationship('MarketDay', lazy='joined')
    qr_codes = db.relationship('QRCode', back_populates='baskets')

    serialize_rules = ('-vendor.baskets', '-market_day.baskets', '-qr_codes.baskets')

    # @validates('sale_date')
    # def validate_sale_date(self, key, value):
    #     if value < date.today():
    #         raise ValueError("Sale date cannot be in the past")
    #     return value

    @validates('is_sold', 'is_grabbed')
    def validate_boolean(self, key, value):
        if not isinstance(value, bool):
            raise ValueError(f"{key} must be a boolean value")
        return value
    
    @validates('price', 'basket_value')
    def validate_price(self, key, value):
        if not isinstance(value, (int, float)) or value < 0:
            raise ValueError(f"{key} must be a non-negative integer")
        return value
    
    def to_dict(self):
        return {
            "id": self.id,
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor.name if self.vendor else None,
            "market_day_id": self.market_day_id,
            "market_name": self.market_day.markets.name if self.market_day and self.market_day.markets else "Unknown Market",
            "sale_date": self.sale_date.isoformat() if self.sale_date else None,
            "pickup_start": str(self.pickup_start),
            "pickup_end": str(self.pickup_end),
            "price": self.price,
            "basket_value": self.basket_value,
            "is_sold": self.is_sold,
            "is_grabbed": self.is_grabbed,
            "user_id": self.user_id,
            "qr_codes": [qr.to_dict() for qr in self.qr_codes] if self.qr_codes else None,
        }

    def __repr__(self):
        return (f"<Basket ID: {self.id}, Vendor: {self.vendor.name}, "
                f"Market ID: {self.market_day_id}, Sold: {self.is_sold}, Value: {self.basket_value}>")

class UserNotification(db.Model):
    __tablename__ = 'user_notifications'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    link = db.Column(db.String, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'subject': self.subject,
            'message': self.message,
            "link": self.link,
            'user_id': self.user_id,
            'vendor_id': self.vendor_id,
            'market_id': self.market_id,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return (f"<User Notification ID: {self.id}, created on {self.created_at}")

class VendorNotification(db.Model, SerializerMixin):
    __tablename__ = 'vendor_notifications'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    link = db.Column(db.String, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    # vendor = db.relationship('Vendor', back_populates='notifications')
    # vendor_user = db.relationship('VendorUser', back_populates='notifications')

    serialize_rules = ('vendor_user.first_name', 'vendor_user.last_name')

    def to_dict(self):
        return {
            "id": self.id,
            "subject": self.subject,
            "message": self.message,
            "link": self.link,
            "user_id": self.user_id,
            "market_id": self.market_id,
            "vendor_id": self.vendor_id,
            "vendor_user_id": self.vendor_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_read": self.is_read
        }

    def get_vendor_name(self):
        return Vendor.query.filter_by(id=self.vendor_id).first().name

    def __repr__(self):
        return (f"<Vendor Notification ID: {self.id}, created on {self.created_at}")

class AdminNotification(db.Model):
    __tablename__ = 'admin_notifications'
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    link = db.Column(db.String, nullable=True)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "subject": self.subject,
            "message": self.message,
            "link": self.link,
            "vendor_id": self.vendor_id,
            "vendor_user_id": self.vendor_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_read": self.is_read
        }
    
    def __repr__(self):
        return (f"<Vendor Notification ID: {self.id}, created on {self.created_at}")
    
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(24), nullable=False)
    message = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)

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
        }
    
    def __repr__(self):
        return (f"<User Notification ID: {self.id}, created on {self.created_at}")

class Product(db.Model, SerializerMixin):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    product = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product
        }

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

    serialize_rules = ('-baskets.qr_codes', '-baskets.market_day', '-baskets.vendor.reviews', '-baskets.vendor.vendor_favorites', '-baskets.vendor.vendor_markets')

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
    title = db.Column(db.String, nullable=False)
    body = db.Column(db.String, nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin_users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Blog ID: {self.id}, Title: {self.title}, Body: {self.body}, admin_id: {self.admin_id}, Created at: {self.created_at}>"

class Receipt(db.Model, SerializerMixin):
    __tablename__ = 'receipts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    baskets = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Receipt ID: {self.id}, User ID: {self.user_id}, Baskets: {self.baskets}, Created at: {self.created_at}>"

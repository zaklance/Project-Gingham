from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin
from datetime import date, time, datetime
import re

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

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=False)  # New phone column added
    address_1 = db.Column(db.String, nullable=False)
    address_2 = db.Column(db.String, nullable=True)
    city = db.Column(db.String, nullable=False)
    state = db.Column(db.String(2), nullable=False)
    zipcode = db.Column(db.String(10), nullable=False)

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
    location = db.Column(db.String, nullable=False)
    zipcode = db.Column(db.String, nullable=True)
    coordinates = db.Column(db.JSON, nullable=False)
    schedule = db.Column(db.String, nullable=True)
    year_round = db.Column(db.Boolean, nullable=True)
    season_start = db.Column(db.Date, nullable=True)
    season_end = db.Column(db.Date, nullable=True)

    # Relationships
    reviews = db.relationship('MarketReview', back_populates='market', lazy='dynamic')
    market_favorites = db.relationship('MarketFavorite', back_populates='market', lazy='dynamic')
    market_days = db.relationship('MarketDay', back_populates='markets')

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
    vendor_markets = db.relationship( 'VendorMarket', back_populates="market_day" )

    serialize_rules = ('-markets.market_days', '-markets.reviews')

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
    product = db.Column(db.String, nullable=False)
    bio = db.Column(db.String, nullable=True)
    image = db.Column(db.String)

    # Relationships
    reviews = db.relationship('VendorReview', back_populates='vendor', lazy='dynamic')
    vendor_favorites = db.relationship('VendorFavorite', back_populates='vendor', lazy='dynamic')
    # vendor_vendor_users = db.relationship('VendorVendorUser', back_populates='vendor', lazy='dynamic')
    vendor_markets = db.relationship('VendorMarket', back_populates='vendor')
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

    serialize_rules = ('-vendor.vendor_markets', '-market_day.vendor_markets')

    def __repr__(self) -> str:
        return f"<VendorMarket Vendor ID: {self.vendor_id}, Market ID: {self.market_id}>"

class MarketReview(db.Model, SerializerMixin):
    __tablename__ = 'market_reviews'

    id = db.Column(db.Integer, primary_key=True)
    review_text = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_reported = db.Column(db.Boolean, default=False)

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
    is_reported = db.Column(db.Boolean, default=False)

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
    sale_date = db.Column(db.Date, nullable=False, default=date.today)
    pickup_time = db.Column(db.Time, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_sold = db.Column(db.Boolean, nullable=True)
    is_grabbed = db.Column(db.Boolean, nullable=True)
    price = db.Column(db.Float, nullable=False)
    pickup_duration = db.Column(db.Time, nullable=False)

    vendor = db.relationship('Vendor', lazy='joined')
    market_day = db.relationship('MarketDay', lazy='joined')

    # serialize_rules = ('-user_id', '-vendor_id', '-market_id')

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
    
    @validates('price')
    def validate_price(self, key, value):
        if not isinstance(value, (int, float)) or value < 0:
            raise ValueError("Price must be a non-negative integer")
        return value

    def __repr__(self):
        return (f"<Basket ID: {self.id}, Vendor: {self.vendor.name}, "
                f"Market ID: {self.market_day_id}, Sold: {self.is_sold}>")

class UserNotification(db.Model):
    __tablename__ = 'user_notifications'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return (f"<User Notification ID: {self.id}, created on {self.created_at}")

class VendorNotification(db.Model, SerializerMixin):
    __tablename__ = 'vendor_notifications'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String, nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    # vendor = db.relationship('Vendor', back_populates='notifications')
    # vendor_user = db.relationship('VendorUser', back_populates='notifications')

    serialize_rules = ('vendor_user.first_name', 'vendor_user.last_name')

    def __repr__(self):
        return (f"<Vendor Notification ID: {self.id}, created on {self.created_at}")

class AdminNotification(db.Model):
    __tablename__ = 'admin_notifications'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String, nullable=False)
    market_reviews_id = db.Column(db.Integer, db.ForeignKey('market_reviews.id'), nullable=True)
    vendor_reviews_id = db.Column(db.Integer, db.ForeignKey('vendor_reviews.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return (f"<Vendor Notification ID: {self.id}, created on {self.created_at}")
    
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "market_id": self.market_id,
            "vendor_id": self.vendor_id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
        }
    
    def __repr__(self):
        return (f"<User Notification ID: {self.id}, created on {self.created_at}")

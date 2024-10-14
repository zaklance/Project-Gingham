from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin

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
    address = db.Column(db.String, nullable=True)

    # Relationships
    market_reviews = db.relationship('MarketReview', back_populates='user')
    vendor_reviews = db.relationship('VendorReview', back_populates='user')
    market_favorites = db.relationship('MarketFavorite', back_populates='user')
    vendor_favorites = db.relationship('VendorFavorite', back_populates='user')

    serialize_rules = ('-_password', '-market_reviews.user', '-vendor_reviews.user', '-market_favorites', '-vendor_favorites')

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

    @validates('address')
    def validate_address(self, key, value):
        if value and len(value) > 100:
            raise ValueError("Address cannot be longer than 100 characters")
        return value

    @validates('email')
    def validate_email(self, key, value):
        if not value:
            raise ValueError("Email is required")
        if "@" not in value or "." not in value:
            raise ValueError("Invalid email address")
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
    location = db.Column(db.String, nullable=False)
    zipcode = db.Column(db.String, nullable=True)
    coordinates = db.Column(db.JSON, nullable=False)
    hours = db.Column(db.String, nullable=True)
    year_round = db.Column(db.Boolean, nullable=True)

    # Relationships
    reviews = db.relationship('MarketReview', back_populates='market', lazy='dynamic')
    market_favorites = db.relationship('MarketFavorite', back_populates='market', lazy='dynamic')

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
    
class Vendor(db.Model, SerializerMixin):
    __tablename__ = 'vendors'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    based_out_of = db.Column(db.String, nullable=True)
    locations = db.Column(db.JSON)
    product = db.Column(db.String, nullable=False)
    image = db.Column(db.String)

    # Relationships
    reviews = db.relationship('VendorReview', back_populates='vendor', lazy='dynamic')
    vendor_favorites = db.relationship('VendorFavorite', back_populates='vendor', lazy='dynamic')
    vendor_vendor_users = db.relationship('VendorVendorUser', back_populates='vendor', lazy='dynamic')

    serialize_rules = ( '-reviews.vendor', '-vendor_favorites.vendor', '-vendor_vendor_users.vendor', '-vendor_markets.vendor', '-reviews.user.market_reviews', "-vendor_vendor_users.email")

    # Validations
    @validates('name', 'product')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"{key} cannot be empty")
        return value

    @validates('based_out_of', 'locations')
    def validate_optional_string(self, key, value):
        if value and len(value) == 0:
            raise ValueError(f"{key} cannot be empty")
        return value

    def __repr__(self) -> str:
        return f"<Vendor {self.name}>"

class MarketReview(db.Model, SerializerMixin):
    __tablename__ = 'market_reviews'

    id = db.Column(db.Integer, primary_key=True)
    review_text = db.Column(db.String, nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    market = db.relationship('Market', back_populates='reviews')
    user = db.relationship('User', back_populates='market_reviews')

    serialize_rules = ('-user', '-market.reviews', '-market.market_favorites', 'user.first_name')

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

    # Relationships
    vendor = db.relationship('Vendor', back_populates='reviews')
    user = db.relationship('User', back_populates='vendor_reviews')

    serialize_rules = ('-vendor.reviews', '-vendor.vendor_favorites', '-user.vendor_reviews', 'user.first_name')

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
    
class VendorVendorUser(db.Model, SerializerMixin):
    __tablename__ = 'vendor_vendor_users'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    vendor_user_id = db.Column(db.Integer, db.ForeignKey('vendor_users.id'), nullable=False)
    role = db.Column(db.String, nullable=True)

    # Relationships
    vendor = db.relationship('Vendor', back_populates='vendor_vendor_users')
    vendor_user = db.relationship('VendorUser', back_populates='vendor_vendor_users')

    serialize_rules = ('-vendor.vendor_vendor_users', '-vendor_user.vendor_vendor_users')

    def __repr__(self) -> str:
        return f"<VendorVendorUser Vendor ID: {self.vendor_id}, VendorUser ID: {self.vendor_user_id}>"

class VendorUser(db.Model, SerializerMixin):
    __tablename__ = 'vendor_users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)

    # Relationships
    vendor_vendor_users = db.relationship('VendorVendorUser', back_populates='vendor_user', lazy='dynamic')

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
        return f"<VendorUser {self.email}>"

class VendorMarket(db.Model, SerializerMixin):
    __tablename__ = 'vendor_markets'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), nullable=False)
    day = db.Column(db.String, nullable=False)
    basket = db.Column(db.Integer, nullable=False)
    pick_up_time = db.Column(db.String, nullable=False)

    serialize_rules = ('-vendor.vendor_markets', '-market.vendor_markets')

    @validates('day', 'pick_up_time')
    def validate_not_empty(self, key, value):
        if not value:
            raise ValueError(f"{key.replace('_', ' ').capitalize()} cannot be empty")
        return value

    @validates('basket')
    def validate_basket(self, key, value):
        if value < 0:
            raise ValueError("Basket count cannot be negative")
        return value

    def __repr__(self) -> str:
        return f"<VendorMarket Vendor ID: {self.vendor_id}, Market ID: {self.market_id}, Day: {self.day}, Basket: {self.basket}>"
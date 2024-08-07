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

class UserMarket(db.Model, SerializerMixin):
    __tablename__ = 'user_markets'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    market_id = db.Column(db.Integer, db.ForeignKey('markets.id'), primary_key=True)
    market = db.relationship('Market', back_populates='user_markets')
    user = db.relationship('User', back_populates='user_markets')

    serialize_rules = ('-user.user_markets', '-market.user_markets')

class UserVendor(db.Model, SerializerMixin):
    __tablename__ = 'user_vendors'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), primary_key=True)
    vendor = db.relationship('Vendor', back_populates='user_vendors')
    user = db.relationship('User', back_populates='user_vendors')

    serialize_rules = ('-user.user_vendors', '-vendor.user_vendors')

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    address = db.Column(db.String, nullable=True)
    email = db.Column(db.String, unique=True, nullable=False)
    favorite_markets = db.Column(db.JSON, nullable=True)
    favorite_vendors = db.Column(db.JSON, nullable=True)

    # Relationships
    market_reviews = db.relationship('MarketReview', back_populates='user')
    vendor_reviews = db.relationship('VendorReview', back_populates='user')
    user_markets = db.relationship('UserMarket', back_populates='user')
    user_vendors = db.relationship('UserVendor', back_populates='user')

    serialize_rules = ('-_password', '-market_reviews.user', '-vendor_reviews.user', '-user_markets.user', '-user_vendors.user')

    @validates('username')
    def validate_username(self, key, value):
        if not value:
            raise ValueError("Username is required")
        if len(value) < 3 or len(value) > 50:
            raise ValueError("Username must be between 3 and 50 characters")
        return value

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
        return f"<User {self.username}>"

class Market(db.Model, SerializerMixin):
    __tablename__ = 'markets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    location = db.Column(db.String, nullable=False)
    hours = db.Column(db.String, nullable=True)
    year_round = db.Column(db.Boolean, nullable=True)
    zipcode = db.Column(db.String, nullable=True)

    # Relationships
    reviews = db.relationship('MarketReview', back_populates='market')
    user_markets = db.relationship('UserMarket', back_populates='market')

    serialize_rules = ('-reviews.market', '-user_markets.market')

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
    reviews = db.relationship('VendorReview', back_populates='vendor')
    user_vendors = db.relationship('UserVendor', back_populates='vendor')

    serialize_rules = ('-reviews.vendor', '-user_vendors.vendor')

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

    serialize_rules = ('-market.reviews', '-user.market_reviews', 'user.first_name')

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

    serialize_rules = ('-vendor.reviews', '-user.vendor_reviews', 'user.first_name')

    def __repr__(self) -> str:
        return f"<VendorReview {self.id}>"

    @validates('review_text')
    def validates_not_empty(self, key, value):
        if not value:
            raise ValueError(f"Review text cannot be empty")
        return value
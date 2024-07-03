from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from flask_bcrypt import Bcrypt
from sqlalchemy.dialects.postgresql import JSON
import datetime

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

class User(db.Model):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    _password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False)
    favorite_markets = Column(JSON, nullable=True)
    favorite_vendors = Column(JSON, nullable=True)

    # Relationships
    market_reviews = relationship('MarketReview', back_populates='user')
    vendor_reviews = relationship('VendorReview', back_populates='user')
    markets = relationship('Market', back_populates='user')
    vendors = relationship('Vendor', back_populates='user')

    @hybrid_property
    def password(self):
        return self._password
    
    @password.setter
    def password(self, new_password):
        hash = bcrypt.generate_password_hash(new_password.encode('utf-8'))
        self._password = hash

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password, password.encode('utf-8'))
    
    serialize_rules = ['-_password']

    def __repr__(self) -> str:
        return f"<User {self.username}>"

class Market(db.Model):
    __tablename__ = 'markets'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    hours = Column(String, nullable=True)
    events = Column(String, nullable=True)
    zipcode = Column(Integer, nullable=True)

    # Relationships
    reviews = relationship('MarketReview', back_populates='market')
    users = relationship('User', secondary='user_markets',)

    def __repr__(self) -> str:
        return f"<Market {self.name}>"

class Vendor(db.Model):
    __tablename__ = 'vendors'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    based_out_of = Column(String, nullable=True)
    locations = Column(String, nullable=True)
    product = Column(String, nullable=False)

    # Relationships
    reviews = relationship('VendorReview', back_populates='vendor')
    users = relationship('User', back_populates='vendor')

    def __repr__(self) -> str:
        return f"<Vendor {self.name}>"

class MarketReview(db.Model):
    __tablename__ = 'market_reviews'

    id = Column(Integer, primary_key=True)
    review_text = Column(Text, nullable=False)
    market_id = Column(Integer, ForeignKey('markets.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date_time = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    market = relationship('Market', back_populates='reviews')
    user = relationship('User', back_populates='market_reviews')

    def __repr__(self) -> str:
        return f"<MarketReview {self.id}>"

class VendorReview(db.Model):
    __tablename__ = 'vendor_reviews'

    id = Column(Integer, primary_key=True)
    review_text = Column(Text, nullable=False)
    vendor_id = Column(Integer, ForeignKey('vendors.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date_time = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    vendor = relationship('Vendor', back_populates='reviews')
    user = relationship('User', back_populates='vendor_reviews')

    def __repr__(self) -> str:
        return f"<VendorReview {self.id}>"

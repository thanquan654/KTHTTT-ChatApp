from pymongo import MongoClient
from flask import current_app, g

def get_mongo_client() -> MongoClient:
    if "mongo_client" not in g:
        g.mongo_client = MongoClient('mongodb://127.0.0.1:27017/')
    return g.mongo_client

def close_mongo_client(e=None):
    client = g.pop("mongo_client", None)
    if client:
        client.close()

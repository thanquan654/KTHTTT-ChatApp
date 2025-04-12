from bson import ObjectId
import random


def convert_id(item): # Hàm chung để convert ObjectId sang string
    item["_id"] = str(item["_id"])
    return item

def mongo_to_json(data):
    if isinstance(data, list):
        return [mongo_to_json(item) for item in data]
    elif isinstance(data, dict):
        new_data = {}
        for k, v in data.items():
            new_data[k] = mongo_to_json(v)
        return new_data
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data



DEFAULT_AVATARS = [
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Brian',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Aiden',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Easton',
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Katherine",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Destiny",
]
def random_avatar():
    return random.choice(DEFAULT_AVATARS)

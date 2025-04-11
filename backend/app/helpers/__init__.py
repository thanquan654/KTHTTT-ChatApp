from bson import ObjectId


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

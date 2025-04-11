from bson import ObjectId


def convert_id(item): # Hàm chung để convert ObjectId sang string
    item["_id"] = str(item["_id"])
    return item

def mongo_to_json(doc):
    if isinstance(doc, list):
        return [mongo_to_json(d) for d in doc]
    elif isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                new_doc[k] = str(v)
            elif isinstance(v, list):
                new_doc[k] = [str(i) if isinstance(i, ObjectId) else i for i in v]
            else:
                new_doc[k] = v
        return new_doc
    return doc

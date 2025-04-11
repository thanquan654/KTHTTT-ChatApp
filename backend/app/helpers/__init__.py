
def convert_id(item): # Hàm chung để convert ObjectId sang string
    item["_id"] = str(item["_id"])
    return item

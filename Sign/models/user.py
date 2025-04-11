from pydantic import BaseModel, Field, EmailStr, validator # type: ignore
from typing import Optional, List
from datetime import datetime
from bson import ObjectId # type: ignore

# Helper để Pydantic tương thích ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    roles: List[str] = Field(default=["user"]) # Phân quyền: mặc định là 'user'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str} # Khi trả về JSON, ObjectId thành string
        allow_population_by_field_name = True # Cho phép dùng alias "_id"
        arbitrary_types_allowed = True # Cho phép PyObjectId

class UserPublic(UserBase):
    id: str # Trả về ID dạng string cho API
    roles: List[str]
    created_at: datetime
    updated_at: datetime

    @validator('id', pre=True, always=True)
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        orm_mode = True # Cho phép map từ object (như UserInDB)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str = Field(..., alias="user_id") # Subject = user_id (string)
    username: str
    roles: List[str] = []
    exp: datetime
    iat: datetime
    jti: str # JWT ID để blocklist
from pydantic import BaseModel, HttpUrl
from typing import Optional
import uuid
from datetime import datetime

class ProfileBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    website: Optional[HttpUrl] = None

class ProfileUpdate(ProfileBase):
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[HttpUrl | str] = None 
    website: Optional[HttpUrl | str] = None

class ProfileRead(ProfileBase):
    id: uuid.UUID
    updated_at: Optional[datetime] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True # Pydantic V2 style for ORM mode 
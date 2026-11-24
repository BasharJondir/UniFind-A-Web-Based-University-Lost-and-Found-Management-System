"""
Pydantic data models for UniFind Lost and Found Management System.
Includes User Authentication, Sessions, and Item Models.
"""

from datetime import datetime as dt_datetime, date as dt_date
from typing import Optional, Literal, Union
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ==========================================
# User & Authentication Models
# ==========================================

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="University student or admin email")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of student")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    role: Optional[Literal["user", "admin"]] = Field(default="user", description="Account role")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Registered email")
    password: str = Field(..., description="Account password")


class UserResponse(UserBase):
    id: str
    role: Literal["user", "admin"] = "user"
    is_banned: bool = False
    ban_reason: Optional[str] = None
    created_at: Union[str, dt_datetime]

    model_config = ConfigDict(from_attributes=True)


class BanUserRequest(BaseModel):
    is_banned: bool = Field(..., description="True to ban user, False to unban")
    reason: Optional[str] = Field(default=None, description="Explanation or policy violation reason for the ban")


class ChangeRoleRequest(BaseModel):
    role: Literal["user", "admin"] = Field(..., description="Role to assign ('user' or 'admin')")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserSession(BaseModel):
    id: str
    user_id: str
    token_hash: str
    expires_at: Union[str, dt_datetime]
    is_revoked: bool = False
    created_at: Union[str, dt_datetime]

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Lost & Found Item Models
# ==========================================

class ItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Title of the lost/found item")
    description: str = Field(..., min_length=5, description="Detailed description of the item")
    category: str = Field(..., description="Category (e.g. Electronics, Cards & IDs, Books, etc.)")
    type: Literal["lost", "found"] = Field(..., description="Whether the item was lost or found")
    location: str = Field(..., min_length=2, max_length=150, description="Campus location where lost/found")
    date: Optional[Union[str, dt_date]] = Field(default_factory=lambda: dt_date.today().isoformat(), description="Date in YYYY-MM-DD")
    contact_email: str = Field(..., description="Contact email of the student")
    image_url: Optional[str] = Field(default="", description="Optional image URL or photo")
    status: Literal["missing", "found", "returned"] = Field(default="missing", description="Current status of the item")
    user_id: Optional[str] = Field(default=None, description="ID of the user who reported this item")


class ItemCreate(ItemBase):
    contact_email: Optional[str] = Field(default=None, description="Optional contact email; defaults to account email")


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    type: Optional[Literal["lost", "found"]] = None
    location: Optional[str] = None
    date: Optional[str] = None
    contact_email: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[Literal["missing", "found", "returned"]] = None


class ItemStatusUpdate(BaseModel):
    status: Literal["missing", "found", "returned"]


class ItemResponse(ItemBase):
    id: str
    created_at: Union[str, dt_datetime]
    updated_at: Union[str, dt_datetime]

    model_config = ConfigDict(from_attributes=True)


class StatsResponse(BaseModel):
    total: int
    lost: int
    found: int
    returned: int


class AdminStatsResponse(BaseModel):
    total_items: int
    lost_items: int
    found_items: int
    returned_items: int
    total_users: int
    admin_users: int
    student_users: int
    banned_users: int

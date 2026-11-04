"""
Pydantic data models for UniFind Lost and Found Management System.
"""

from datetime import datetime, date
from typing import Optional, Literal
from pydantic import BaseModel, Field, EmailStr


class ItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Title of the lost/found item")
    description: str = Field(..., min_length=5, description="Detailed description of the item")
    category: str = Field(..., description="Category (e.g. Electronics, Cards & IDs, Books, etc.)")
    type: Literal["lost", "found"] = Field(..., description="Whether the item was lost or found")
    location: str = Field(..., min_length=2, max_length=150, description="Campus location where lost/found")
    date: Optional[str] = Field(default_factory=lambda: date.today().isoformat(), description="Date in YYYY-MM-DD")
    contact_email: str = Field(..., description="Contact email of the student")
    image_url: Optional[str] = Field(default="", description="Optional image URL or photo")
    status: Literal["missing", "found", "returned"] = Field(default="missing", description="Current status of the item")


class ItemCreate(ItemBase):
    pass


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
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total: int
    lost: int
    found: int
    returned: int

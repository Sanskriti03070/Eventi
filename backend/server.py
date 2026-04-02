from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Models ───

class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[str] = None

class VendorService(BaseModel):
    name: str
    price: int
    description: Optional[str] = ""
    image: Optional[str] = ""

class VendorAddon(BaseModel):
    name: str
    price: int

class VendorCreate(BaseModel):
    business_name: str
    description: str
    category_tags: List[str]
    services: List[VendorService]
    addons: Optional[List[VendorAddon]] = []
    cover_photos: List[str] = []
    rating: float = 4.5
    location: str = "Chennai"
    terms: Optional[str] = ""
    verified: bool = False
    starting_price: Optional[int] = None

class VendorOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    vendor_id: str
    business_name: str
    description: str
    category_tags: List[str]
    services: List[dict]
    addons: List[dict] = []
    cover_photos: List[str] = []
    rating: float
    location: str
    terms: str = ""
    verified: bool = False
    starting_price: int = 0
    created_at: Optional[str] = None

class BookingCreate(BaseModel):
    vendor_id: str
    service_name: str
    service_price: int
    addons: List[dict] = []
    event_date: str
    time_slot: str
    venue_address: str

class BookingOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    user_id: str
    vendor_id: str
    vendor_name: Optional[str] = ""
    service_name: str
    service_price: int
    addons: List[dict] = []
    event_date: str
    time_slot: str
    venue_address: str
    total_amount: int = 0
    gst_amount: int = 0
    subtotal: int = 0
    advance_amount: int = 0
    balance_amount: int = 0
    status: str = "Confirmed"
    payment_status: str = "Advance Paid"
    created_at: Optional[str] = None
    customer_name: Optional[str] = ""
    customer_email: Optional[str] = ""

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

# ─── Auth Helpers ───

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Session not found")

    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return user_doc

# ─── Auth Routes ───

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")

    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "phone": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
        max_age=7 * 24 * 3600
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", secure=True, httponly=True, samesite="none")
    return {"message": "Logged out"}

@api_router.put("/auth/profile")
async def update_profile(update: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {}
    if update.name is not None:
        update_data["name"] = update.name
    if update.phone is not None:
        update_data["phone"] = update.phone
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ─── Vendor Routes ───

@api_router.get("/vendors")
async def list_vendors(category: Optional[str] = None, search: Optional[str] = None, sort: Optional[str] = None, min_price: Optional[int] = None, max_price: Optional[int] = None):
    query = {}
    if category:
        query["category_tags"] = {"$regex": category, "$options": "i"}
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"category_tags": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["starting_price"] = price_q

    sort_key = [("created_at", -1)]
    if sort == "price_low":
        sort_key = [("starting_price", 1)]
    elif sort == "price_high":
        sort_key = [("starting_price", -1)]
    elif sort == "rating":
        sort_key = [("rating", -1)]

    vendors = await db.vendors.find(query, {"_id": 0}).sort(sort_key).to_list(100)
    return vendors

@api_router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: str):
    vendor = await db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@api_router.post("/admin/vendors")
async def create_vendor(vendor: VendorCreate):
    vendor_id = f"vendor_{uuid.uuid4().hex[:12]}"
    doc = vendor.model_dump()
    doc["vendor_id"] = vendor_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    if doc.get("starting_price") is None and doc.get("services"):
        doc["starting_price"] = min(s["price"] for s in doc["services"]) if doc["services"] else 0
    await db.vendors.insert_one(doc)
    result = await db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    return result

@api_router.put("/admin/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, vendor: VendorCreate):
    existing = await db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    doc = vendor.model_dump()
    if doc.get("starting_price") is None and doc.get("services"):
        doc["starting_price"] = min(s["price"] for s in doc["services"]) if doc["services"] else 0
    await db.vendors.update_one({"vendor_id": vendor_id}, {"$set": doc})
    result = await db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    return result

@api_router.delete("/admin/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str):
    result = await db.vendors.delete_one({"vendor_id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted"}

# ─── Booking Routes ───

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, request: Request):
    user = await get_current_user(request)
    vendor = await db.vendors.find_one({"vendor_id": booking.vendor_id}, {"_id": 0})
    vendor_name = vendor["business_name"] if vendor else ""

    addons_total = sum(a.get("price", 0) for a in booking.addons)
    total_amount = booking.service_price + addons_total
    gst_amount = int(total_amount * 0.18)
    subtotal = total_amount + gst_amount
    advance_amount = int(subtotal * 0.30)
    balance_amount = subtotal - advance_amount

    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    doc = {
        "booking_id": booking_id,
        "user_id": user["user_id"],
        "vendor_id": booking.vendor_id,
        "vendor_name": vendor_name,
        "service_name": booking.service_name,
        "service_price": booking.service_price,
        "addons": booking.addons,
        "event_date": booking.event_date,
        "time_slot": booking.time_slot,
        "venue_address": booking.venue_address,
        "total_amount": total_amount,
        "gst_amount": gst_amount,
        "subtotal": subtotal,
        "advance_amount": advance_amount,
        "balance_amount": balance_amount,
        "status": "Confirmed",
        "payment_status": "Advance Paid",
        "customer_name": user.get("name", ""),
        "customer_email": user.get("email", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(doc)
    result = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return result

@api_router.get("/bookings/me")
async def my_bookings(request: Request):
    user = await get_current_user(request)
    bookings = await db.bookings.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/admin/bookings")
async def admin_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return bookings

@api_router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, request: Request):
    body = await request.json()
    status = body.get("status")
    payment_status = body.get("payment_status")
    update_data = {}
    if status:
        update_data["status"] = status
    if payment_status:
        update_data["payment_status"] = payment_status
    if not update_data:
        raise HTTPException(status_code=400, detail="No status provided")
    result = await db.bookings.update_one({"booking_id": booking_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    updated = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return updated

# ─── Seed Data ───

@api_router.post("/seed")
async def seed_data():
    count = await db.vendors.count_documents({})
    if count > 0:
        return {"message": f"Already seeded with {count} vendors"}

    vendors = [
        {
            "vendor_id": "vendor_balloon_bliss",
            "business_name": "Balloon Bliss Chennai",
            "description": "Chennai's #1 balloon decoration specialists. We create stunning balloon arches, walls, and custom installations for all occasions.",
            "category_tags": ["Birthday", "Balloon", "Theme"],
            "services": [
                {"name": "Basic Balloon Decoration", "price": 3500, "description": "50 balloons with basic arrangement", "image": ""},
                {"name": "Premium Balloon Arch", "price": 8000, "description": "Full balloon arch with foil balloons", "image": ""},
                {"name": "Theme Balloon Setup", "price": 15000, "description": "Complete themed balloon decoration", "image": ""},
                {"name": "Grand Balloon Wall", "price": 25000, "description": "8ft balloon wall with custom design", "image": ""}
            ],
            "addons": [
                {"name": "LED Lights", "price": 1500},
                {"name": "Number Foil Balloons", "price": 500},
                {"name": "Confetti Balloons (10 pcs)", "price": 800},
                {"name": "Helium Balloons (20 pcs)", "price": 2000}
            ],
            "cover_photos": [
                "https://images.unsplash.com/photo-1772683530615-3b3ac678e81f?w=800",
                "https://images.unsplash.com/photo-1761300725208-e8f92da35f5c?w=800",
                "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800"
            ],
            "rating": 4.7,
            "location": "Chennai",
            "terms": "Booking must be made 3 days in advance. 50% cancellation charge within 24 hours of event. Setup starts 3 hours before event time.",
            "verified": True,
            "starting_price": 3500,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "vendor_id": "vendor_royal_decors",
            "business_name": "Royal Decors Chennai",
            "description": "Elegant and royal decoration setups for anniversaries, weddings, and premium celebrations. Serving Chennai for 10+ years.",
            "category_tags": ["Anniversary", "Wedding", "Premium"],
            "services": [
                {"name": "Anniversary Ring Ceremony Setup", "price": 12000, "description": "Floral stage with ring ceremony backdrop", "image": ""},
                {"name": "Golden Anniversary Decor", "price": 20000, "description": "Premium gold theme anniversary setup", "image": ""},
                {"name": "Wedding Reception Stage", "price": 45000, "description": "Full wedding reception stage decoration", "image": ""},
                {"name": "Intimate Dinner Setup", "price": 8000, "description": "Romantic dinner decoration for two", "image": ""}
            ],
            "addons": [
                {"name": "Fresh Flower Bouquet", "price": 2500},
                {"name": "Fairy Lights Canopy", "price": 3000},
                {"name": "Photo Booth Corner", "price": 5000},
                {"name": "Fog Machine", "price": 2000}
            ],
            "cover_photos": [
                "https://images.unsplash.com/photo-1759730840961-09faa5731a3b?w=800",
                "https://images.unsplash.com/photo-1747115275646-49725fb5a003?w=800",
                "https://images.unsplash.com/photo-1754282183851-25dd5f7e9a78?w=800"
            ],
            "rating": 4.8,
            "location": "Chennai",
            "terms": "Advance booking of 5 days required. Full refund if cancelled 72 hours before event. Venue access needed 5 hours before event.",
            "verified": True,
            "starting_price": 8000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "vendor_id": "vendor_little_stars",
            "business_name": "Little Stars Decor",
            "description": "Adorable baby shower and kids party decorations. We make every little celebration magical with cute themes and safe materials.",
            "category_tags": ["Baby Shower", "Kids", "Birthday"],
            "services": [
                {"name": "Baby Shower Basic", "price": 5000, "description": "Pastel balloon setup with banner", "image": ""},
                {"name": "Baby Shower Premium", "price": 12000, "description": "Full theme setup with props and backdrop", "image": ""},
                {"name": "Kids Birthday Party", "price": 8000, "description": "Cartoon theme decoration with games setup", "image": ""},
                {"name": "Naming Ceremony Decor", "price": 10000, "description": "Traditional naming ceremony decoration", "image": ""}
            ],
            "addons": [
                {"name": "Diaper Cake", "price": 1500},
                {"name": "Custom Name Banner", "price": 800},
                {"name": "Stuffed Toy Arrangement", "price": 2000},
                {"name": "Welcome Board", "price": 1200}
            ],
            "cover_photos": [
                "https://images.unsplash.com/photo-1766918780916-228d10b071be?w=800",
                "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
                "https://images.unsplash.com/photo-1761300725208-e8f92da35f5c?w=800"
            ],
            "rating": 4.6,
            "location": "Chennai",
            "terms": "Booking 4 days in advance. Kid-safe materials used. Setup takes 2 hours. Cleanup included.",
            "verified": True,
            "starting_price": 5000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "vendor_id": "vendor_budget_decors",
            "business_name": "Budget Bash Chennai",
            "description": "Beautiful decorations that don't break the bank! Quality setups starting under 6000. Perfect for house parties and small gatherings.",
            "category_tags": ["Birthday", "Budget", "Under 6k"],
            "services": [
                {"name": "Simple Birthday Setup", "price": 2500, "description": "Basic balloon and banner decoration", "image": ""},
                {"name": "Standard Party Decor", "price": 4500, "description": "Balloons, streamers, and backdrop", "image": ""},
                {"name": "House Party Package", "price": 5500, "description": "Complete house party decoration", "image": ""},
                {"name": "Surprise Room Decor", "price": 3500, "description": "Bedroom surprise decoration", "image": ""}
            ],
            "addons": [
                {"name": "Extra Balloons (25 pcs)", "price": 400},
                {"name": "Happy Birthday Foil", "price": 300},
                {"name": "LED String Lights", "price": 500},
                {"name": "Cake Table Setup", "price": 600}
            ],
            "cover_photos": [
                "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
                "https://images.unsplash.com/photo-1761300725208-e8f92da35f5c?w=800",
                "https://images.unsplash.com/photo-1772683530615-3b3ac678e81f?w=800"
            ],
            "rating": 4.3,
            "location": "Chennai",
            "terms": "Booking 2 days in advance. Setup within Chennai city limits. Cash on delivery available.",
            "verified": False,
            "starting_price": 2500,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "vendor_id": "vendor_majestic",
            "business_name": "Majestic Event Decorators",
            "description": "Premium event decoration company specializing in grand celebrations. From corporate events to luxury weddings, we do it all with perfection.",
            "category_tags": ["Wedding", "Anniversary", "Premium", "Theme"],
            "services": [
                {"name": "Corporate Event Setup", "price": 35000, "description": "Professional corporate event decoration", "image": ""},
                {"name": "Luxury Wedding Mandap", "price": 75000, "description": "Traditional mandap with floral decoration", "image": ""},
                {"name": "Grand Birthday Bash", "price": 25000, "description": "Luxury birthday party decoration", "image": ""},
                {"name": "Engagement Ceremony", "price": 30000, "description": "Elegant engagement stage and hall decoration", "image": ""}
            ],
            "addons": [
                {"name": "Live Flower Wall", "price": 15000},
                {"name": "Crystal Chandelier Rental", "price": 8000},
                {"name": "Red Carpet Setup", "price": 5000},
                {"name": "Drone Photography Decor", "price": 10000}
            ],
            "cover_photos": [
                "https://images.unsplash.com/photo-1755844184063-d309fc14458e?w=800",
                "https://images.unsplash.com/photo-1754282183851-25dd5f7e9a78?w=800",
                "https://images.unsplash.com/photo-1759730840961-09faa5731a3b?w=800"
            ],
            "rating": 4.9,
            "location": "Chennai",
            "terms": "Minimum 7 days advance booking. 30% non-refundable deposit. Premium materials and fresh flowers guaranteed.",
            "verified": True,
            "starting_price": 25000,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "vendor_id": "vendor_party_planners",
            "business_name": "Chennai Party Planners",
            "description": "Your one-stop party planning destination! We handle everything from decoration to coordination. Trusted by 500+ families in Chennai.",
            "category_tags": ["Birthday", "Baby Shower", "Anniversary", "Theme"],
            "services": [
                {"name": "Birthday Theme Package", "price": 7000, "description": "Complete birthday theme decoration", "image": ""},
                {"name": "Baby Welcome Setup", "price": 9000, "description": "Hospital room or home baby welcome decor", "image": ""},
                {"name": "Anniversary Special", "price": 11000, "description": "Romantic anniversary decoration", "image": ""},
                {"name": "Housewarming Decor", "price": 8000, "description": "Traditional housewarming decoration", "image": ""}
            ],
            "addons": [
                {"name": "Custom Cake Arrangement", "price": 1000},
                {"name": "Photography Setup", "price": 3000},
                {"name": "Return Gifts Packing", "price": 1500},
                {"name": "Music System", "price": 2500}
            ],
            "cover_photos": [
                "https://images.unsplash.com/photo-1759523350278-b8f653dc68da?w=800",
                "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
                "https://images.unsplash.com/photo-1766918780916-228d10b071be?w=800"
            ],
            "rating": 4.5,
            "location": "Chennai",
            "terms": "3 days advance booking. Free consultation available. Setup and cleanup included in all packages.",
            "verified": True,
            "starting_price": 7000,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    await db.vendors.insert_many(vendors)
    return {"message": f"Seeded {len(vendors)} vendors"}

@api_router.get("/")
async def root():
    return {"message": "Eventi API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Auto-seed on startup
    count = await db.vendors.count_documents({})
    if count == 0:
        logger.info("No vendors found, seeding data...")
        async with httpx.AsyncClient() as http_client:
            pass
        # Call seed inline
        from contextlib import suppress
        with suppress(Exception):
            await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

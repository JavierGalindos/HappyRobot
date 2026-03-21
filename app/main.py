from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import settings
from app.routers import carrier, loads, negotiate, calls, metrics

app = FastAPI(title="Acme Logistics - Carrier Sales API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    if request.url.path in ("/", "/docs", "/openapi.json", "/health"):
        return await call_next(request)
    if settings.api_key:
        api_key = request.headers.get("x-api-key", "")
        if api_key != settings.api_key:
            raise HTTPException(status_code=403, detail="Invalid API key")
    return await call_next(request)


app.include_router(carrier.router)
app.include_router(loads.router)
app.include_router(negotiate.router)
app.include_router(calls.router)
app.include_router(metrics.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


handler = Mangum(app)

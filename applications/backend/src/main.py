import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.settings import settings
from src.utils import setup_logger

logger = setup_logger(__name__)


# This is the lifespan context manager, which is called once before/after the server starts/stops.
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Run startup and shutdown events of the app.

    FastAPI lifespan events are used to run code before the app starts and after the app stops.
    More specifically, the code before `yield` is executed before the app starts, and the code
    after `yield` is executed after the app stops.

    Args:
        app (FastAPI): The FastAPI app instance.

    Yields:
        None: This function yields nothing
    """
    logger.info("Running startup lifespan events ...")

    # Some Startup processes
    # ...

    # Yield nothing, but boot up the FastAPI app instance. If the app stops, the code after the yield will run.
    yield

    logger.info("Running shutdown lifespan events ...")

    # Some Shutdown processes
    # ...


app = FastAPI(
    debug=True,
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

# Set all CORS enabled origins.
if settings.CORS_ALLOW_ORIGINS:
    origins = settings.CORS_ALLOW_ORIGINS

    if isinstance(origins, str):
        origins = json.loads(origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin for origin in json.loads(settings.CORS_ALLOW_ORIGINS)],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(router, prefix="/api")

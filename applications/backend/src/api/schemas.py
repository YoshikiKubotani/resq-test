from pydantic import BaseModel

class HealthCheckResponse(BaseModel):
    """The response for the health check endpoint.

    Attributes:
        status (str): The status of the health check.
    """
    status: str
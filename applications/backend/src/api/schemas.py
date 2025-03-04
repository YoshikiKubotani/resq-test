from typing import Annotated
from pydantic import BaseModel, Field, SecretStr

from src.domain.models.chat_model import ConversationContent

class HealthCheckResponse(BaseModel):
    """The response for the health check endpoint.

    Attributes:
        status (str): The status of the health check.
    """
    status: Annotated[str, Field(..., description="The status of the health check.")]

class QuestionGenerationRequest(BaseModel):
    """The request for generating questions.

    Attributes:
        mail_information (list[ConversationContent]): The mail information for generating questions.
        api_key (SecretStr): The API key for the OpenAI API
    """
    mail_information: list[Annotated[ConversationContent, Field(..., description="The mail information for generating questions.")]]
    api_key: Annotated[SecretStr, Field(..., description="The API key for the OpenAI API")]

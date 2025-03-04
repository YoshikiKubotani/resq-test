from typing import Annotated
from pydantic import BaseModel, Field

from enum import Enum


class Role(str, Enum):
    """The role of the content."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class ConversationContent(BaseModel):
    """The content of the conversation.

    Attributes:
        role (Role): The role of the content. Either "system", "user", or "assistant".
        content (str): The content of the conversation.
    """
    role: Annotated[Role, Field(..., description="The role of the content.")]
    content: Annotated[str, Field(..., description="The content of the conversation.")]

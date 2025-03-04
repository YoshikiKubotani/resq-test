from typing import Annotated
from pydantic import BaseModel, Field, field_validator

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

class MailInformation(BaseModel):
    """The mail information for generating questions.

    Attributes:
        contents (list[ConversationContent]): The mail information for generating questions.
    """
    contents: list[Annotated[ConversationContent, Field(..., description="The mail information for generating questions.")]]

    @field_validator("contents", mode="after")
    @classmethod
    def is_valid_infomation(cls, contents: list[ConversationContent]) -> list[ConversationContent]:
        """Validate the mail information.

        Args:
            contents (list[ConversationContent]): The mail information.

        Raises:
            ValueError: If the mail information is invalid.

        Returns:
            list[ConversationContent]: The validated mail information.
        """
        if len(contents) != 3:
            raise ValueError("Mail information must contain 3 elements; incoming mail content, sender information, and receiver information.")
        for content in contents:
            if content.role != Role.SYSTEM:
                raise ValueError("Mail information must contain system content only.")
        return contents

    def parse_mail_information(self) -> str:
        """Parse the mail information.

        Returns:
            str: The parsed mail information.
        """
        parsed_text: str = "[\n"
        for content in self.contents:
            parsed_text += content.model_dump_json(indent=4) + ",\n"
        parsed_text += "]"
        return parsed_text

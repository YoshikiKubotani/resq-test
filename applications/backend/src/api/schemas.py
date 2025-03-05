from typing import Annotated

from pydantic import BaseModel, Field, SecretStr

from src.domain.models import (
    EmailInformation,
    QuestionChoice,
    ReplyCustomization,
    UserInformation,
)


class HealthCheckResponse(BaseModel):
    """The response for the health check endpoint.

    Attributes:
        status (str): The status of the health check.
    """

    status: Annotated[str, Field(..., description="The status of the health check.")]


class QuestionGenerationRequest(BaseModel):
    """Question generation request model.

    Attributes:
        email_information (EmailInformation): Basic email information
        user_information (UserInformation): User information
        api_key (SecretStr): OpenAI API key
    """

    email_information: Annotated[
        EmailInformation, Field(..., description="Basic email information")
    ]
    user_information: Annotated[
        UserInformation, Field(..., description="User information")
    ]
    api_key: Annotated[SecretStr, Field(..., description="OpenAI API key")]


class ReplyGenerationRequest(BaseModel):
    """Reply generation request model.

    Attributes:
        email_information (EmailInformation): Basic email information
        user_information (UserInformation): User information
        customization (ReplyCustomization): Reply customization settings
        selected_choices (list[QuestionChoice]): list of questions and their selected answers
        current_reply (str | None): Current reply content when editing
        api_key (SecretStr): OpenAI API key
    """

    email_information: Annotated[
        EmailInformation, Field(..., description="Basic email information")
    ]
    user_information: Annotated[
        UserInformation, Field(..., description="User information")
    ]
    customization: Annotated[
        ReplyCustomization, Field(..., description="Reply customization settings")
    ]
    selected_choices: Annotated[
        list[QuestionChoice],
        Field(..., description="list of questions and their selected answers"),
    ]
    current_reply: Annotated[
        str | None, Field(None, description="Current reply content when editing")
    ]
    api_key: Annotated[SecretStr, Field(..., description="OpenAI API key")]

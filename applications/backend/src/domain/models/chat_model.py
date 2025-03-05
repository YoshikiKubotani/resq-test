from typing import Annotated, Any

from pydantic import BaseModel, Field


class EmailInformation(BaseModel):
    """Email information model.

    Attributes:
        html (str): Email content in HTML format
        text (str): Email content in text format
        title (str): Email subject
        sender (str): Sender's email address
        receive_time (str): Time when the email was received
        current_time (str): Current time
        past_html (str | None): Past email correspondence in HTML format
    """

    html: Annotated[str, Field(..., description="Email content in HTML format")]
    text: Annotated[str, Field(..., description="Email content in text format")]
    title: Annotated[str, Field(..., description="Email subject")]
    sender: Annotated[str, Field(..., description="Sender's email address")]
    receive_time: Annotated[
        str, Field(..., description="Time when the email was received")
    ]
    current_time: Annotated[str, Field(..., description="Current time")]
    past_html: Annotated[
        str | None, Field(None, description="Past email correspondence in HTML format")
    ]

    def get_incoming_mail_section(self) -> str:
        """Get the incoming mail section.

        Returns:
            str: The incoming mail section.
        """
        return self.html

    def get_mail_info_section(self) -> str:
        """Get the mail information section.

        Returns:
            str: The mail information section.
        """
        return (
            f"sender:{self.sender}, "
            f"title:{self.title}, "
            f"receive time:{self.receive_time}, "
            f"current time:{self.current_time}"
        )

    def get_past_correspondence_section(self) -> str:
        """Get the past correspondence section.

        Returns:
            str: The past correspondence section.
        """
        return self.past_html or ""


class UserInformation(BaseModel):
    """User information model.

    Attributes:
        full_name (str): User's full name
        email (str): User's email address
        affiliation (str): User's organization or affiliation
        language (str): User's preferred language
        role (str): User's role
        signature (str | None): User's email signature
        other_info (str | None): Additional user information
    """

    full_name: Annotated[str, Field(..., description="User's full name")]
    email: Annotated[str, Field(..., description="User's email address")]
    affiliation: Annotated[
        str, Field(..., description="User's organization or affiliation")
    ]
    language: Annotated[str, Field(..., description="User's preferred language")]
    role: Annotated[str, Field(..., description="User's role")]
    signature: Annotated[str | None, Field(None, description="User's email signature")]
    other_info: Annotated[
        str | None, Field(None, description="Additional user information")
    ]

    def get_audience_info_section(self) -> str:
        """Get the audience information section.

        Returns:
            str: The audience information section.
        """
        return (
            f"name:{self.full_name}, "
            f"affiliation:{self.affiliation}, "
            f"mail:{self.email}, "
            f"native language:{self.language}, "
            f"role:{self.role}, "
            f"otherInfo:{self.other_info or ''}"
        )

    def get_signature_section(self) -> str:
        """Get the signature section.

        Returns:
            str: The signature section.
        """
        return self.signature or ""


class QuestionChoice(BaseModel):
    """Question and selected answers model.

    Attributes:
        question (str): The question text
        choices (list[str]): List of selected answers
    """

    question: Annotated[str, Field(..., description="The question text")]
    choices: Annotated[list[str], Field(..., description="List of selected answers")]


class ReplyCustomization(BaseModel):
    """Reply customization model.

    Attributes:
        sender_role (str): Role of the sender
        recipient_role (str): Role of the recipient
        formality (str): Level of formality for the reply
        tone (str): Tone of the reply
        urgency (str | None): Level of urgency
        length (str): Desired length of the reply
        purpose (str | None): Purpose of the reply
        additional_request (str | None): Additional customization requests
    """

    sender_role: Annotated[str, Field(..., description="Role of the sender")]
    recipient_role: Annotated[str, Field(..., description="Role of the recipient")]
    formality: Annotated[
        str, Field(..., description="Level of formality for the reply")
    ]
    tone: Annotated[str, Field(..., description="Tone of the reply")]
    urgency: Annotated[str | None, Field(None, description="Level of urgency")]
    length: Annotated[str, Field(..., description="Desired length of the reply")]
    purpose: Annotated[str | None, Field(None, description="Purpose of the reply")]
    additional_request: Annotated[
        str | None, Field(None, description="Additional customization requests")
    ]

    def get_customization_section(self, is_revising: bool) -> str:
        """Get the customization section.

        Args:
            is_revising (bool): Whether the reply is being revised.

        Returns:
            str: The customization section.
        """
        content = (
            f"Role of the sender: {self.sender_role}\n"
            f"Role of the recipient: {self.recipient_role}\n"
            f"Formality of the reply: {self.formality}\n"
            f"Tone of the reply: {self.tone}\n"
            f"Length of the reply: {self.length}"
        )
        if self.additional_request:
            content += f"\nAdditional requests: {self.additional_request}"
        return (
            "You MUST consider the following conditions when "
            f"{'revising' if is_revising else 'writing'} the reply message:\n"
            f"{content}"
        )


class QuestionGenerationInput(BaseModel):
    """Input model for question generation.

    Attributes:
        email_info (EmailInformationModel): Email information
        user_info (UserInformationModel): User information
    """

    email_info: Annotated[EmailInformation, Field(..., description="Email information")]
    user_info: Annotated[UserInformation, Field(..., description="User information")]

    def get_template_values(self) -> dict[str, Any]:
        """Get template values for question generation.

        Returns:
            dict[str, Any]: Template values.
        """
        return {
            "incoming_mail": self.email_info.get_incoming_mail_section(),
            "mail_info": self.email_info.get_mail_info_section(),
            "audience_info": self.user_info.get_audience_info_section(),
        }


class ReplyGenerationInput(BaseModel):
    """Input model for reply generation.

    Attributes:
        email_info (EmailInformationModel): Email information
        user_info (UserInformationModel): User information
        customization (ReplyCustomizationModel): Reply customization settings
        selected_choices (list[QuestionChoiceModel]): List of questions and their selected answers
        current_reply (str | None): Current reply content when editing
    """

    email_info: Annotated[EmailInformation, Field(..., description="Email information")]
    user_info: Annotated[UserInformation, Field(..., description="User information")]
    customization: Annotated[
        ReplyCustomization, Field(..., description="Reply customization settings")
    ]
    selected_choices: Annotated[
        list[QuestionChoice],
        Field(..., description="List of questions and their selected answers"),
    ]
    current_reply: Annotated[
        str | None, Field(None, description="Current reply content when editing")
    ]

    def get_template_values(self) -> dict[str, Any]:
        """Get template values for reply generation.

        Returns:
            dict[str, Any]: Template values.
        """
        return {
            "incoming_mail": self.email_info.get_incoming_mail_section(),
            "past_correspondence": self.email_info.get_past_correspondence_section(),
            "mail_info": self.email_info.get_mail_info_section(),
            "audience_info": self.user_info.get_audience_info_section(),
            "signature": self.user_info.get_signature_section(),
            "selected_choices": self.selected_choices,
            "current_reply": self.current_reply,
            "customization": self.customization.get_customization_section(
                is_revising=bool(self.current_reply)
            ),
        }

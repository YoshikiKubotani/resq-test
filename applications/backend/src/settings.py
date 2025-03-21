import json

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """The settings for the application.

    Attributes:
        PROJECT_NAME (str): The name of the project.
        OPENAI_API_KEY (str): The API key for the OpenAI API.
        LLM_MODEL (str): The language model to use for the OpenAI API.
        CORS_ALLOW_ORIGINS (list[str]): The origins that are allowed to make requests to the API.
    """

    model_config = SettingsConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "ResQ API"

    # OpenAI settings
    OPENAI_API_KEY: SecretStr
    LLM_MODEL: str = "gpt-4o"

    # CORS_ALLOW_ORIGINS is a JSON-formatted list of origins that are allowed to make requests to the API.
    # e.g: '["http://localhost", "http://localhost:3000"]'
    CORS_ALLOW_ORIGINS: str

    @field_validator("CORS_ALLOW_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v: str) -> list[str]:
        """Validate the CORS_ALLOW_ORIGINS field.

        Args:
            v (str): The value of the CORS_ALLOW_ORIGINS field.

        Raises:
            ValueError: If CORS_ALLOW_ORIGINS is invalid.

        Returns:
            list[str]: The validated value of the CORS_ALLOW_ORIGINS field.
        """
        try:
            parsed_data = json.loads(v)
        except json.JSONDecodeError as e:
            raise ValueError(
                "JSON decode failed. CORS_ALLOW_ORIGINS must be a JSON-formatted list."
            ) from e

        if isinstance(parsed_data, list) and all(
            isinstance(elem, str) for elem in parsed_data
        ):
            return v
        else:
            raise ValueError(
                "The decoded JSON was not a list of strings. CORS_ALLOW_ORIGINS must be a JSON-formatted list."
            )


settings = Settings()

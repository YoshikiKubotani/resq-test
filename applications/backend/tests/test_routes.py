from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    """Test the health check endpoint.

    Args:
        client (TestClient): The test client.
    """
    response = client.get("/api/health")
    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"status": "ok"}


def test_generate_questions_success(
    client: TestClient,
    valid_email_info: dict,
    valid_user_info: dict,
    valid_api_key: str,
) -> None:
    """Test successful question generation.

    Args:
        client (TestClient): The test client.
        valid_email_info (dict): Valid email information.
        valid_user_info (dict): Valid user information.
        valid_api_key (str): Valid API key.
    """
    response = client.post(
        "/api/questions",
        json={
            "email_information": valid_email_info,
            "user_information": valid_user_info,
            "api_key": valid_api_key,
        },
    )
    assert response.status_code == HTTPStatus.OK
    # Since this is a streaming response, we can't easily check the content
    # But we can verify that it's a streaming response
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"


@pytest.mark.parametrize(
    "invalid_data",
    [
        # Missing email information
        {"user_information": {}, "api_key": "test"},
        # Missing user information
        {"email_information": {}, "api_key": "test"},
        # Missing API key
        {"email_information": {}, "user_information": {}},
        # Empty request body
        {},
    ],
)
def test_generate_questions_validation_error(
    client: TestClient, invalid_data: dict
) -> None:
    """Test question generation with invalid data.

    Args:
        client (TestClient): The test client.
        invalid_data (dict): Invalid request data.
    """
    response = client.post("/api/questions", json=invalid_data)
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_generate_reply_success(
    client: TestClient,
    valid_email_info: dict,
    valid_user_info: dict,
    valid_customization: dict,
    valid_selected_choices: list,
    valid_api_key: str,
) -> None:
    """Test successful reply generation.

    Args:
        client (TestClient): The test client.
        valid_email_info (dict): Valid email information.
        valid_user_info (dict): Valid user information.
        valid_customization (dict): Valid customization settings.
        valid_selected_choices (list): Valid selected choices.
        valid_api_key (str): Valid API key.
    """
    response = client.post(
        "/api/reply",
        json={
            "email_information": valid_email_info,
            "user_information": valid_user_info,
            "customization": valid_customization,
            "selected_choices": valid_selected_choices,
            "current_reply": None,
            "api_key": valid_api_key,
        },
    )
    assert response.status_code == HTTPStatus.OK
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"


def test_generate_reply_with_current_reply(
    client: TestClient,
    valid_email_info: dict,
    valid_user_info: dict,
    valid_customization: dict,
    valid_selected_choices: list,
    valid_api_key: str,
) -> None:
    """Test reply generation with existing reply content.

    Args:
        client (TestClient): The test client.
        valid_email_info (dict): Valid email information.
        valid_user_info (dict): Valid user information.
        valid_customization (dict): Valid customization settings.
        valid_selected_choices (list): Valid selected choices.
        valid_api_key (str): Valid API key.
    """
    current_reply = """
    Dear John,

    Thank you for your email. I am available for a meeting next Tuesday at 2 PM.
    I will prepare the project proposal and budget estimation by then.

    Best regards,
    Michael
    """

    response = client.post(
        "/api/reply",
        json={
            "email_information": valid_email_info,
            "user_information": valid_user_info,
            "customization": valid_customization,
            "selected_choices": valid_selected_choices,
            "current_reply": current_reply,
            "api_key": valid_api_key,
        },
    )
    assert response.status_code == HTTPStatus.OK
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"


@pytest.mark.parametrize(
    "invalid_data",
    [
        # Missing email information
        {
            "user_information": {},
            "customization": {},
            "selected_choices": [],
            "api_key": "test",
        },
        # Missing user information
        {
            "email_information": {},
            "customization": {},
            "selected_choices": [],
            "api_key": "test",
        },
        # Missing customization
        {
            "email_information": {},
            "user_information": {},
            "selected_choices": [],
            "api_key": "test",
        },
        # Missing selected choices
        {
            "email_information": {},
            "user_information": {},
            "customization": {},
            "api_key": "test",
        },
        # Missing API key
        {
            "email_information": {},
            "user_information": {},
            "customization": {},
            "selected_choices": [],
        },
        # Empty request body
        {},
    ],
)
def test_generate_reply_validation_error(
    client: TestClient, invalid_data: dict
) -> None:
    """Test reply generation with invalid data.

    Args:
        client (TestClient): The test client.
        invalid_data (dict): Invalid request data.
    """
    response = client.post("/api/reply", json=invalid_data)
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

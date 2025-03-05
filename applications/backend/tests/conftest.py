import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI application.

    Returns:
        TestClient: The test client.
    """
    return TestClient(app)


@pytest.fixture
def valid_email_info() -> dict:
    """Create valid email information for testing.

    Returns:
        dict: Valid email information.
    """
    return {
        "html": """
        Dear Mr. Smith,

        I hope this email finds you well. I would like to schedule a meeting to discuss our upcoming project.
        The meeting will be held next week, and I would appreciate it if you could let me know your availability.

        Also, please note that we will need the following documents:
        - Project proposal
        - Budget estimation
        - Timeline

        Looking forward to your response.

        Best regards,
        John Doe
        """,
        "text": "Dear Mr. Smith, I hope this email finds you well...",
        "title": "Meeting Request: Project Discussion",
        "sender": "john.doe@example.com",
        "receive_time": "2025-03-05 10:00:00",
        "current_time": "2025-03-05 10:30:00",
        "past_html": """
        Previous email thread:
        > Can we schedule a meeting to discuss the project?
        > Yes, that would be great. Please suggest some times.
        """,
    }


@pytest.fixture
def valid_user_info() -> dict:
    """Create valid user information for testing.

    Returns:
        dict: Valid user information.
    """
    return {
        "full_name": "Michael Smith",
        "email": "michael.smith@example.com",
        "affiliation": "Tech Solutions Inc.",
        "language": "English",
        "role": "Project Manager",
        "signature": """
        --
        Michael Smith
        Project Manager
        Tech Solutions Inc.
        michael.smith@example.com
        """,
        "other_info": "Prefers formal communication",
    }


@pytest.fixture
def valid_customization() -> dict:
    """Create valid reply customization settings for testing.

    Returns:
        dict: Valid customization settings.
    """
    return {
        "sender_role": "Project Manager",
        "recipient_role": "Senior Developer",
        "formality": "Formal",
        "tone": "Professional",
        "urgency": "Normal",
        "length": "Medium",
        "purpose": "Meeting scheduling",
        "additional_request": "Include availability for next week",
    }


@pytest.fixture
def valid_selected_choices() -> list:
    """Create valid selected choices for testing.

    Returns:
        list: Valid selected choices.
    """
    return [
        {
            "question": "What times are you available next week?",
            "choices": ["Tuesday 2 PM", "Wednesday 3 PM", "Thursday 10 AM"],
        },
        {
            "question": "Which documents can you prepare by then?",
            "choices": ["Project proposal", "Budget estimation"],
        },
    ]


@pytest.fixture
def valid_api_key() -> str:
    """Create a valid API key for testing.

    Returns:
        str: Valid API key.
    """
    return "sk-test-valid-api-key-12345"

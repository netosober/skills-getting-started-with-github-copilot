"""Test configuration and fixtures for the Mergington High School API tests."""

import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_activities():
    """Backup and restore the activities data between tests."""
    # Store original activities (deep copy since we have nested dicts)
    original = {
        name: {
            **activity,
            "participants": activity["participants"].copy()
        }
        for name, activity in activities.items()
    }
    yield activities
    # Restore original activities after test
    activities.clear()
    activities.update(original)


@pytest.fixture
def test_activity():
    """Sample activity data for tests."""
    return {
        "description": "Test activity description",
        "schedule": "Monday 3-4 PM",
        "max_participants": 10,
        "participants": []
    }
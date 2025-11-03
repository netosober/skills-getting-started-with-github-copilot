"""Tests for the Mergington High School Activities API."""

import pytest
from fastapi import status


def test_root_redirect(client):
    """Test that / redirects to the static index.html."""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client, clean_activities):
    """Test GET /activities returns the list of activities."""
    response = client.get("/activities")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, dict)
    # Verify structure of each activity
    for name, activity in data.items():
        assert isinstance(name, str)
        assert isinstance(activity, dict)
        assert "description" in activity
        assert "schedule" in activity
        assert "max_participants" in activity
        assert isinstance(activity["max_participants"], int)
        assert "participants" in activity
        assert isinstance(activity["participants"], list)


def test_signup_for_activity(client, clean_activities):
    """Test signing up for an activity."""
    activity_name = "Chess Club"
    email = "test@mergington.edu"
    
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check response format
    assert "message" in data
    assert "activity" in data
    assert email in data["activity"]["participants"]
    
    # Verify through GET that the participant was added
    response = client.get("/activities")
    activities = response.json()
    assert email in activities[activity_name]["participants"]


def test_signup_duplicate(client, clean_activities):
    """Test that duplicate signups are prevented."""
    activity_name = "Chess Club"
    email = "test@mergington.edu"
    
    # First signup should succeed
    first_response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    assert first_response.status_code == status.HTTP_200_OK
    
    # Second signup should fail with 400 Bad Request
    second_response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    assert second_response.status_code == status.HTTP_400_BAD_REQUEST
    data = second_response.json()
    assert "detail" in data
    assert "already signed up" in data["detail"].lower()
    data = second_response.json()
    assert "detail" in data
    assert "already signed up" in data["detail"].lower()
def test_signup_nonexistent_activity(client, clean_activities):
    """Test signup for non-existent activity returns 404."""
    response = client.post(
        "/activities/NonexistentActivity/signup",
        params={"email": "test@mergington.edu"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_remove_participant(client, clean_activities):
    """Test removing a participant from an activity."""
    activity_name = "Chess Club"
    email = "test@mergington.edu"
    
    # First add the participant
    client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    
    # Then remove them
    response = client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check response format
    assert "message" in data
    assert "activity" in data
    assert email not in data["activity"]["participants"]
    
    # Verify through GET that the participant was removed
    response = client.get("/activities")
    activities = response.json()
    assert email not in activities[activity_name]["participants"]


def test_remove_nonexistent_participant(client, clean_activities):
    """Test removing a non-existent participant returns 404."""
    response = client.delete(
        "/activities/Chess Club/signup",
        params={"email": "nonexistent@mergington.edu"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.db import Base, get_db
from backend.app.main import app

# In-memory SQLite for isolated tests
engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_create_and_list_task():
    res = client.post("/tasks", json={"title": "Test task", "description": "desc"})
    assert res.status_code == 201
    created = res.json()
    assert created["title"] == "Test task"
    assert created["status"] == "TODO"

    res = client.get("/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Test task"


def test_update_status_and_search():
    res = client.post("/tasks", json={"title": "Injection?", "description": "demo"})
    task_id = res.json()["id"]

    res = client.put(f"/tasks/{task_id}", json={"status": "DONE"})
    assert res.status_code == 200
    assert res.json()["status"] == "DONE"

    res = client.get("/tasks/search", params={"q": "Injection"})
    assert res.status_code == 200
    assert any(t["id"] == task_id for t in res.json())


def test_delete_task():
    res = client.post("/tasks", json={"title": "To delete", "description": None})
    task_id = res.json()["id"]

    res = client.delete(f"/tasks/{task_id}")
    assert res.status_code == 204

    res = client.get(f"/tasks/{task_id}")
    assert res.status_code == 404

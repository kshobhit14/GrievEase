# Complete Machine Learning Service (`ml_service`)

A complete, production-ready guide and source code bundle for building, testing, containerizing, and running a Machine Learning REST API using **FastAPI**, **Scikit-Learn**, **Docker**, and **Pytest**.

---

## 1. Project Structure

```text
ml_service/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application & route handlers
│   ├── model.py         # ML model loading, training, and inference
│   └── schemas.py       # Pydantic data schemas
├── tests/
│   ├── __init__.py
│   └── test_main.py     # API unit and integration tests
├── .dockerignore        # Docker build exclusion rules
├── .gitignore           # Git version control ignore rules
├── Dockerfile           # Container build configuration
├── README.md            # Project documentation
└── requirements.txt     # Python project dependencies
```

## Getting Started & Deployment Steps

### Prerequisites
- Python 3.10+
- Docker (Optional, for containerized run)

---

### Step 1: Local Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ml_service.git
   cd ml_service
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Launch the development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Open your browser and navigate to `http://localhost:8000/docs` to access interactive API documentation.

---

### Step 2: Containerization with Docker

1. **Build the Docker image:**
   ```bash
   docker build -t ml_service:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8000:8000 --name ml_service_container ml_service:latest
   ```

3. Check container logs:
   ```bash
   docker logs ml_service_container
   ```

---

### Step 3: API Endpoint Documentation & Examples

#### 1. Health Check Endpoint
- **URL:** `GET /health`
- **Response Example:**
  ```json
  {
    "status": "healthy",
    "model_loaded": true
  }
  ```

#### 2. Model Prediction Endpoint
- **URL:** `POST /predict`
- **Headers:** `Content-Type: application/json`
- **Request Payload:**
  ```json
  {
    "features": [5.1, 3.5, 1.4, 0.2]
  }
  ```
- **Response Example:**
  ```json
  {
    "prediction": 0,
    "probabilities": [0.98, 0.01, 0.01],
    "model_version": "1.0.0"
  }
  ```

#### Testing using `curl`:
```bash
curl -X 'POST' \
  'http://localhost:8000/predict' \
  -H 'Content-Type: application/json' \
  -d '{"features": [5.1, 3.5, 1.4, 0.2]}'
```

---

### Step 4: Running Unit Tests

To run automated unit test assertions across endpoints and health status:

```bash
pytest
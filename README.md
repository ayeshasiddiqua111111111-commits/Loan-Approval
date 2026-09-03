# KNN Loan Approval Prediction System

A professional, responsive machine learning web application built for a university machine learning assignment. The system predicts whether a loan application is likely to be **Approved** or **Rejected** based on applicant demographic and financial parameters, utilizing a tuned **K-Nearest Neighbors (KNN)** classifier.

---

## 1. Project Objective
The objective of this project is to implement an end-to-end machine learning web application that uses a saved, pre-trained K-Nearest Neighbors classifier model to make real-time loan approval predictions. The frontend communicates with the backend via REST API calls, enabling instant inference.

---

## 2. Technologies Used
* **Frontend**: Next.js (App Router, Client-side state hooks)
* **Backend**: FastAPI (Python REST API web server, CORS enabled)
* **Styling**: Vanilla CSS3 (Custom styling with glassmorphism layout and glows)
* **Machine Learning**: Scikit-Learn (KNN Classifier), Joblib, Pandas, Numpy

---

## 3. Machine Learning Model & Dataset
* **Dataset**: Loan Prediction Dataset
* **Model**: K-Nearest Neighbors (KNN) Classifier
* **Preprocessing**: Categorical encoding (via saved `encoders.pkl` LabelEncoders) and Feature Standardization (via saved `scaler.pkl` StandardScaler).

---

## 4. Model Features & Target

### Target Variable
* `Loan_Status`:
  * `Y` = Approved (Loan Approved)
  * `N` = Rejected (Loan Rejected)

### 11 Input Features
1. **Gender**: Male, Female
2. **Married**: Yes, No
3. **Dependents**: 0, 1, 2, 3+ (Preprocessed: `3+` is mapped to `3`)
4. **Education**: Graduate, Not Graduate
5. **Self_Employed**: Yes, No
6. **ApplicantIncome**: Monthly applicant base income (Numeric)
7. **CoapplicantIncome**: Monthly co-applicant income (Numeric)
8. **LoanAmount**: Loan amount in thousands (Numeric)
9. **Loan_Amount_Term**: Term of loan in days (Numeric: e.g. 360, 180, 120, 84, 60, 36, 12)
10. **Credit_History**: Credit standing (1.0 = Good, 0.0 = Not Good)
11. **Property_Area**: Urban, Semiurban, Rural

---

## 5. API Endpoints (FastAPI Backend)

### `GET /`
* Checks system health and server connection.
* **Response**:
  ```json
  {
    "status": "online",
    "message": "Loan Approval Prediction API is running successfully.",
    "model_loaded": true
  }
  ```

### `POST /predict`
* Receives applicant parameters, encodes categoricals, standardizes financials, performs KNN classification, and returns the verdict.
* **Payload**:
  ```json
  {
    "Gender": "Male",
    "Married": "Yes",
    "Dependents": "2",
    "Education": "Graduate",
    "Self_Employed": "No",
    "ApplicantIncome": 8500,
    "CoapplicantIncome": 2000,
    "LoanAmount": 150,
    "Loan_Amount_Term": 360,
    "Credit_History": 1.0,
    "Property_Area": "Semiurban"
  }
  ```
* **Response**:
  ```json
  {
    "prediction": "Y",
    "status": "Approved"
  }
  ```

---

## 6. How the Prediction Flow Works
1. **Input**: User fills out the forms on the Next.js frontend or selects a quick application profile preset.
2. **REST API Transmission**: Next.js sends a POST request with the JSON payload to the FastAPI `/predict` endpoint.
3. **Backend Validation**: FastAPI uses Pydantic to validate parameters and maps `Dependents` value `3+` to `3`.
4. **Encoding & Scaling**: Categorical features are encoded using the pre-trained `encoders.pkl` and numeric features are scaled using the saved `scaler.pkl`.
5. **Inference**: Preprocessed features are fed into the loaded `knn_model.pkl` classifier.
6. **Decoding & Response**: Target predictions are decoded using `target_encoder.pkl` (e.g. `1` -> `Y`), and returned to the frontend.
7. **Rendering**: The Next.js frontend displays the approved/rejected status along with a disclaimer.

---

## 7. How to Run the Application

### Option A: One-Click Launch (Windows)
Double-click `start_all.bat` in the project root to launch both the FastAPI backend and Next.js frontend in separate terminal windows.
* Alternatively, run `run_backend.bat` and `run_frontend.bat` individually.

### Option B: Manual Setup & Execution

#### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI application:
   ```bash
   python main.py
   ```
   *The server runs locally at `http://127.0.0.1:8000`.*

#### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install Node.js package dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   *The client application runs at `http://127.0.0.1:3000`.*

---

## 8. Dataset & Model Training
* **Dataset File**: `train_u6lujuX_CVtuZ9i.csv` (included in the project root).
* **Jupyter Notebook**: `K_Nearest_Neighbor.ipynb` contains the full machine learning lifecycle:
  1. Data exploration and missing value imputation (median for numerical, mode for categorical).
  2. Categorical encoding via `LabelEncoder`.
  3. Feature scaling using `StandardScaler`.
  4. Default KNN model evaluation (Accuracy: ~80.49%).
  5. Neighbor tuning experiment with K = 3, 5, 7.
  6. Hyperparameter optimization using `GridSearchCV` over K=1..20 (Best K = 19, Accuracy: ~84.55%).
  7. Confusion matrix generation and accuracy comparison.
  8. Model export: saves `knn_model.pkl`, `scaler.pkl`, `encoders.pkl`, and `target_encoder.pkl` to both root and `backend/models/`.

---

## 9. Environment Variables
To customize the connection API URL, create an `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```


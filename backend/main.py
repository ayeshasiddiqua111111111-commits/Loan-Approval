import os
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Loan Approval Prediction API",
    description="FastAPI Backend for predicting loan status using a saved KNN model.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths for saved model files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Global variables to store the loaded models
knn_model = None
scaler = None
encoders = None
target_encoder = None

@app.on_event("startup")
def load_models():
    global knn_model, scaler, encoders, target_encoder
    try:
        knn_model_path = os.path.join(MODELS_DIR, "knn_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
        encoders_path = os.path.join(MODELS_DIR, "encoders.pkl")
        target_encoder_path = os.path.join(MODELS_DIR, "target_encoder.pkl")
        
        print(f"Loading models from: {MODELS_DIR}")
        knn_model = joblib.load(knn_model_path)
        scaler = joblib.load(scaler_path)
        encoders = joblib.load(encoders_path)
        target_encoder = joblib.load(target_encoder_path)
        print("All machine learning models and preprocessing assets loaded successfully!")
    except Exception as e:
        print(f"Error loading models on startup: {e}")
        raise RuntimeError(f"Could not load ML assets. Please check the paths. Detail: {e}")

class LoanApplication(BaseModel):
    Gender: str = Field(..., description="Gender (e.g. Male, Female)")
    Married: str = Field(..., description="Married status (e.g. Yes, No)")
    Dependents: str = Field(..., description="Number of dependents (e.g. 0, 1, 2, 3+)")
    Education: str = Field(..., description="Education status (e.g. Graduate, Not Graduate)")
    Self_Employed: str = Field(..., description="Self-employed status (e.g. Yes, No)")
    ApplicantIncome: float = Field(..., description="Applicant monthly income")
    CoapplicantIncome: float = Field(..., description="Co-applicant monthly income")
    LoanAmount: float = Field(..., description="Loan amount (in thousands)")
    Loan_Amount_Term: float = Field(..., description="Loan amount term (in days)")
    Credit_History: float = Field(..., description="Credit history score (1.0 for Good, 0.0 for Bad)")
    Property_Area: str = Field(..., description="Property area type (Rural, Semiurban, Urban)")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Loan Approval Prediction API is running successfully.",
        "model_loaded": knn_model is not None
    }

@app.post("/predict")
def predict_loan(app_data: LoanApplication):
    # Ensure models are loaded
    if knn_model is None or scaler is None or encoders is None or target_encoder is None:
        raise HTTPException(
            status_code=503,
            detail="Machine learning model components are not loaded on the server. Please check logs."
        )
        
    try:
        # 1. Preprocess Dependents ('3+' -> '3')
        dependents_val = app_data.Dependents
        if dependents_val == "3+":
            dependents_val = "3"
            
        # 2. Extract values for validation
        input_categorical = {
            "Gender": app_data.Gender,
            "Married": app_data.Married,
            "Dependents": dependents_val,
            "Education": app_data.Education,
            "Self_Employed": app_data.Self_Employed,
            "Property_Area": app_data.Property_Area
        }
        
        # 3. Validate input values against saved encoder classes
        for col, val in input_categorical.items():
            if val not in encoders[col].classes_:
                valid_classes = list(encoders[col].classes_)
                if col == "Dependents":
                    valid_classes.append("3+")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid value '{val}' for field '{col}'. Valid options are: {valid_classes}"
                )
                
        # 4. Transform categorical features using the saved LabelEncoders
        encoded_features = {}
        for col, val in input_categorical.items():
            encoded_features[col] = encoders[col].transform([val])[0]
            
        # 5. Combine all encoded and numerical features in the exact feature order
        feature_order = [
            "Gender", "Married", "Dependents", "Education", "Self_Employed",
            "ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term",
            "Credit_History", "Property_Area"
        ]
        
        features_dict = {
            "Gender": encoded_features["Gender"],
            "Married": encoded_features["Married"],
            "Dependents": encoded_features["Dependents"],
            "Education": encoded_features["Education"],
            "Self_Employed": encoded_features["Self_Employed"],
            "ApplicantIncome": app_data.ApplicantIncome,
            "CoapplicantIncome": app_data.CoapplicantIncome,
            "LoanAmount": app_data.LoanAmount,
            "Loan_Amount_Term": app_data.Loan_Amount_Term,
            "Credit_History": app_data.Credit_History,
            "Property_Area": encoded_features["Property_Area"]
        }
        
        # 6. Format as a pandas DataFrame to maintain feature names and prevent warning checks
        X_df = pd.DataFrame([features_dict], columns=feature_order)
        
        # 7. Apply the saved StandardScaler
        X_scaled = scaler.transform(X_df)
        
        # 8. Perform prediction using the KNN classifier
        prediction_encoded = knn_model.predict(X_scaled)[0]
        
        # 9. Decode output using target_encoder.pkl
        prediction_label = target_encoder.inverse_transform([prediction_encoded])[0]
        
        status = "Approved" if prediction_label == "Y" else "Rejected"
        
        return {
            "prediction": prediction_label,
            "status": status
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during model inference: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

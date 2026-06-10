"""
AI Prediction Dashboard — Flask Application
Supports: House Price Prediction + Car Price Prediction
Both models use GradientBoostingRegressor trained from notebook logic.
"""

from flask import Flask, render_template, request, jsonify
import numpy as np
import pandas as pd
import joblib
import os

app = Flask(__name__)

BASE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE, "models")

# ── Load artifacts at startup ─────────────────────────────────────────────────
def load_artifacts(name):
    path = os.path.join(MODELS_DIR, f"{name}_model.pkl")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")
    return joblib.load(path)

try:
    HOUSE = load_artifacts("house")
    CAR   = load_artifacts("car")
    print("✅ Both models loaded successfully.")
except Exception as e:
    print(f"❌ Model load error: {e}")
    HOUSE = CAR = None


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/house")
def house():
    return render_template("house.html")


@app.route("/car")
def car():
    if CAR is None:
        return render_template("car.html", error="Car model not loaded.", dropdowns={})
    dropdowns = {
        "brands":        CAR["brand_values"],
        "fuel_types":    CAR["fuel_type_values"],
        "transmissions": CAR["transmission_values"],
        "body_types":    CAR["body_type_values"],
        "conditions":    CAR["condition_values"],
    }
    return render_template("car.html", dropdowns=dropdowns)


# ── House Prediction ──────────────────────────────────────────────────────────
@app.route("/predict/house", methods=["POST"])
def predict_house():
    if HOUSE is None:
        return jsonify({"error": "House model is not available. Please train the model first."}), 503

    try:
        data = request.get_json(force=True)

        # --- Validate & parse inputs ---
        required = {
            "OverallQual": (1, 10),
            "GrLivArea":   (300, 10000),
            "TotalBsmtSF": (0, 8000),
            "1stFlrSF":    (100, 6000),
            "TotRmsAbvGrd":(2, 20),
        }
        cat_required = ["MSZoning", "Utilities", "BldgType", "Heating",
                        "KitchenQual", "SaleCondition", "LandSlope"]

        numeric_input = {}
        for field, (lo, hi) in required.items():
            raw = data.get(field)
            if raw is None or str(raw).strip() == "":
                return jsonify({"error": f"Field '{field}' is required."}), 400
            val = float(raw)
            if not (lo <= val <= hi):
                return jsonify({"error": f"{field} must be between {lo} and {hi}."}), 400
            numeric_input[field] = val

        cat_input = {}
        for field in cat_required:
            raw = data.get(field)
            if raw is None or str(raw).strip() == "":
                return jsonify({"error": f"Field '{field}' is required."}), 400
            cat_input[field] = str(raw).strip()

        # --- Build a single-row DataFrame ---
        row = {**numeric_input, **cat_input}
        df_input = pd.DataFrame([row])

        # --- One-hot encode categorical cols ---
        df_input = pd.get_dummies(df_input, columns=cat_required)

        # --- Scale numeric cols ---
        num_cols = HOUSE["numeric_columns"]
        scaler   = HOUSE["scaler"]
        for col in num_cols:
            if col not in df_input.columns:
                df_input[col] = 0.0
        df_input[num_cols] = scaler.transform(df_input[num_cols])

        # --- Align to training feature columns ---
        feature_cols = HOUSE["feature_columns"]
        for col in feature_cols:
            if col not in df_input.columns:
                df_input[col] = 0
        df_input = df_input[feature_cols]

        # --- Predict ---
        prediction = HOUSE["model"].predict(df_input)[0]
        prediction = max(0, float(prediction))

        return jsonify({
            "prediction": round(prediction, 2),
            "formatted":  f"${prediction:,.0f}",
        })

    except ValueError as ve:
        return jsonify({"error": f"Invalid value: {ve}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ── Car Prediction ────────────────────────────────────────────────────────────
@app.route("/predict/car", methods=["POST"])
def predict_car():
    if CAR is None:
        return jsonify({"error": "Car model is not available. Please train the model first."}), 503

    try:
        data = request.get_json(force=True)

        # --- Validate numeric inputs ---
        numeric_rules = {
            "Year":               (1990, 2025),
            "Mileage_km":         (0, 500000),
            "Engine_CC":          (500, 8000),
            "Horsepower":         (30, 800),
            "Num_Owners":         (1, 10),
            "Doors":              (2, 6),
            "Seats":              (2, 10),
            "Service_History":    (0, 1),
            "Accidents_Reported": (0, 10),
            "Insurance_Valid":    (0, 1),
        }
        cat_required = ["Brand", "Fuel_Type", "Transmission", "Body_Type", "Condition"]

        numeric_input = {}
        for field, (lo, hi) in numeric_rules.items():
            raw = data.get(field)
            if raw is None or str(raw).strip() == "":
                return jsonify({"error": f"Field '{field}' is required."}), 400
            val = float(raw)
            if not (lo <= val <= hi):
                return jsonify({"error": f"{field} must be between {lo} and {hi}."}), 400
            numeric_input[field] = val

        cat_input = {}
        for field in cat_required:
            raw = data.get(field)
            if raw is None or str(raw).strip() == "":
                return jsonify({"error": f"Field '{field}' is required."}), 400
            cat_input[field] = str(raw).strip()

        # --- Feature engineering (exact notebook logic) ---
        year         = numeric_input["Year"]
        mileage_km   = numeric_input["Mileage_km"]
        car_age      = 2025 - year
        mileage_py   = mileage_km / (car_age + 1)

        engineered = {
            "Car_Age":          car_age,
            "Mileage_km":       mileage_km,
            "Mileage_per_Year": mileage_py,
            "Engine_CC":        numeric_input["Engine_CC"],
            "Horsepower":       numeric_input["Horsepower"],
            "Num_Owners":       numeric_input["Num_Owners"],
            "Doors":            numeric_input["Doors"],
            "Seats":            numeric_input["Seats"],
            "Service_History":  numeric_input["Service_History"],
            "Accidents_Reported": numeric_input["Accidents_Reported"],
            "Insurance_Valid":  numeric_input["Insurance_Valid"],
            **cat_input,
        }

        df_input = pd.DataFrame([engineered])

        # --- One-hot encode ---
        df_input = pd.get_dummies(df_input, columns=cat_required)

        # --- Align to training feature columns FIRST ---
        feature_cols = CAR["feature_columns"]
        for col in feature_cols:
            if col not in df_input.columns:
                df_input[col] = 0
        df_input = df_input[feature_cols]

        # --- Scale ALL features (notebook scales entire X_train) ---
        scaler   = CAR["scaler"]
        df_scaled = scaler.transform(df_input)

        # --- Predict ---
        prediction = CAR["model"].predict(df_scaled)[0]
        prediction = max(0, float(prediction))

        return jsonify({
            "prediction": round(prediction, 2),
            "formatted":  f"${prediction:,.0f}",
        })

    except ValueError as ve:
        return jsonify({"error": f"Invalid value: {ve}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)

# 🏠🚗 AI Prediction Dashboard

A professional machine learning web application that predicts **House Prices** and **Car Resale Prices** using Gradient Boosting models — built with Flask, scikit-learn, and a Glassmorphism UI.

---

## 📸 Preview

> Landing page with two prediction modules, glassmorphism design, animated background, and real-time prediction result cards.

---

## 🧠 ML Models

| Module | Algorithm | Features | Scaler |
|---|---|---|---|
| 🏠 House Price | GradientBoostingRegressor | 12 (5 numeric + 7 categorical → ~36 after OHE) | StandardScaler (numeric only) |
| 🚗 Car Price | GradientBoostingRegressor | 16 (11 numeric + 5 categorical → ~38 after OHE) | StandardScaler (full matrix) |

### Feature Engineering (Car)
- `Car_Age = 2025 - Year`
- `Mileage_per_Year = Mileage_km / (Car_Age + 1)`

---

## 📁 Project Structure

```
PREDICITON/
│
├── app.py                    ← Flask application (routes + prediction logic)
├── requirements.txt          ← Python dependencies
│
├── models/                   ← Generated after running the notebook
│   ├── house_model.pkl
│   └── car_model.pkl
│
├── notebooks/
│   ├── combined.ipynb        ← Train BOTH models in one notebook ⭐
│   ├── train.csv             ← House price dataset
│   └── car_price_dataset.csv ← Car price dataset
│
├── templates/
│   ├── index.html            ← Landing page
│   ├── house.html            ← House prediction form
│   └── car.html              ← Car prediction form
│
└── static/
    ├── style.css             ← Glassmorphism UI
    └── script.js             ← Form handling + fetch + animations
```

---

## ⚙️ Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-prediction-dashboard.git
cd ai-prediction-dashboard
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Train the models
Open `notebooks/combined.ipynb` in Jupyter and **Run All Cells**.

This generates:
```
models/house_model.pkl
models/car_model.pkl
```

### 4. Launch the app
```bash
python app.py
```

Open your browser at **http://127.0.0.1:5000**

---

## 🔮 How Predictions Work

```
User fills form
      ↓
JavaScript validates inputs → JSON POST to Flask
      ↓
Flask applies preprocessing:
  • Feature engineering (Car: Car_Age, Mileage_per_Year)
  • pd.get_dummies (one-hot encoding)
  • Align columns to training feature set
  • StandardScaler.transform()
      ↓
model.predict() → price
      ↓
JSON response → animated result card in UI
```

---

## 🧪 Sample Test Values

### 🏠 House (mid-range)
| Field | Value |
|---|---|
| Overall Quality | 7 |
| Living Area | 1800 sq ft |
| Basement Area | 950 sq ft |
| First Floor | 1050 sq ft |
| Total Rooms | 7 |
| Zoning | RL |
| Building Type | 1Fam |
| Kitchen Quality | Gd |
| Sale Condition | Normal |
| Heating | GasA |
| Land Slope | Gtl |
| Utilities | AllPub |

**Expected:** ~$280,000 – $340,000

### 🚗 Car (mid-range)
| Field | Value |
|---|---|
| Brand | Toyota |
| Year | 2018 |
| Body Type | Sedan |
| Condition | Good |
| Fuel | Petrol |
| Transmission | Automatic |
| Engine | 2000 cc |
| Horsepower | 150 |
| Mileage | 45,000 km |
| Owners | 1 |
| Accidents | 0 |
| Service History | Yes |
| Insurance | Yes |
| Doors / Seats | 4 / 5 |

**Expected:** ~$7,000 – $10,000

---

## 🛠️ Tech Stack

- **Backend** — Python 3.10+, Flask 3.x
- **ML** — scikit-learn, GradientBoostingRegressor, StandardScaler, joblib
- **Frontend** — HTML5, CSS3 (Glassmorphism), Vanilla JavaScript (Fetch API)
- **Data** — pandas, numpy

---

## 📌 Notes

- `.pkl` model files are excluded from git (see `.gitignore`). Run the notebook to regenerate them.
- The two models are fully independent — datasets are never merged.
- All preprocessing in `app.py` exactly mirrors the notebook logic.

---

## 👤 Author

Neha Biju
B.Tech CSE | ML Internship Project
[GitHub](https://github.com/Nehaxx-26) · [LinkedIn](https://www.linkedin.com/in/nehabiju26/)

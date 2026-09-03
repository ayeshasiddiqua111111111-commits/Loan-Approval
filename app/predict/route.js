import { NextResponse } from 'next/server';
import modelData from '../model_data.json';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Loan Approval Prediction API is running successfully.',
    model_loaded: true
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    let dependentsVal = body.Dependents;
    if (dependentsVal === '3+') {
      dependentsVal = '3';
    }

    const {
      Gender,
      Married,
      Education,
      Self_Employed,
      ApplicantIncome,
      CoapplicantIncome,
      LoanAmount,
      Loan_Amount_Term,
      Credit_History,
      Property_Area
    } = body;

    const inputCategorical = {
      Gender,
      Married,
      Dependents: dependentsVal,
      Education,
      Self_Employed,
      Property_Area
    };

    // 1. Label encode categoricals using exported classes
    const encoded = {};
    for (const [col, val] of Object.entries(inputCategorical)) {
      const idx = modelData.encoders[col]?.indexOf(val);
      if (idx === undefined || idx === -1) {
        return NextResponse.json(
          { detail: `Invalid value '${val}' for field '${col}'` },
          { status: 400 }
        );
      }
      encoded[col] = idx;
    }

    // 2. Build feature vector in exact model training order:
    // ['Gender', 'Married', 'Dependents', 'Education', 'Self_Employed',
    //  'ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term',
    //  'Credit_History', 'Property_Area']
    const rawVector = [
      encoded.Gender,
      encoded.Married,
      encoded.Dependents,
      encoded.Education,
      encoded.Self_Employed,
      Number(ApplicantIncome) || 0,
      Number(CoapplicantIncome) || 0,
      Number(LoanAmount) || 0,
      Number(Loan_Amount_Term) || 360,
      Number(Credit_History),
      encoded.Property_Area
    ];

    // 3. Feature Scaling: (x - mean) / scale
    const scaledVector = rawVector.map((val, i) => (val - modelData.mean[i]) / modelData.scale[i]);

    // 4. Compute Euclidean distances to all training points
    const distances = modelData.fit_X.map((trainPoint, idx) => {
      let sumSq = 0;
      for (let j = 0; j < 11; j++) {
        const diff = scaledVector[j] - trainPoint[j];
        sumSq += diff * diff;
      }
      return { dist: sumSq, label: modelData.fit_y[idx] };
    });

    // 5. Sort ascending and pick K nearest neighbors
    distances.sort((a, b) => a.dist - b.dist);
    const kNeighbors = distances.slice(0, modelData.k);

    // 6. Majority vote
    let count0 = 0;
    let count1 = 0;
    for (const item of kNeighbors) {
      if (item.label === 0) count0++;
      else count1++;
    }

    const predClass = count1 >= count0 ? 1 : 0;
    const predictionLabel = modelData.target_classes[predClass];
    const status = predictionLabel === 'Y' ? 'Approved' : 'Rejected';

    return NextResponse.json({
      prediction: predictionLabel,
      status: status
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'An error occurred during model inference.' },
      { status: 500 }
    );
  }
}

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from model import analyze_image

app = FastAPI(title="AIMD Platform API")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...)):
    # Read image bytes
    image_bytes = await file.read()
    
    # Run AI inference
    ai_result = analyze_image(image_bytes)
    
    # Run Forensics
    from forensics import perform_ela, extract_metadata
    ela_result = perform_ela(image_bytes)
    metadata_result = extract_metadata(image_bytes)
    
    # Calculate combined trust score (0 to 1, where 1 is 100% fake)
    # This makes the app look stronger and more reliable
    overall_confidence = 0.0
    if ai_result.get("success"):
        # AI score weight: 60%
        overall_confidence += ai_result["confidence"] * 0.6
        
    if ela_result.get("success"):
        # ELA score weight: 30%
        overall_confidence += ela_result["ela_score"] * 0.3
        
    if metadata_result.get("success"):
        # Metadata anomaly weight: 10%
        if metadata_result["is_suspicious"]:
            overall_confidence += 0.1
            
    # Ensure it's between 0 and 1
    overall_confidence = min(max(overall_confidence, 0.0), 1.0)
    is_ai_generated = overall_confidence > 0.5
    
    report = {
        "success": True,
        "is_ai_generated": is_ai_generated,
        "overall_confidence": overall_confidence,
        "ai_analysis": ai_result,
        "ela_analysis": ela_result,
        "metadata_analysis": metadata_result
    }
    
    return report

@app.get("/")
def read_root():
    return {"status": "AIMD Platform API is running"}

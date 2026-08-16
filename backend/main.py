from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from model import analyze_image
from forensics import perform_ela, extract_metadata

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
    if not image_bytes:
        return {"success": False, "error": "No image data provided."}
    
    # Run AI inference
    ai_result = analyze_image(image_bytes)
    if not ai_result.get("success"):
        return {
            "success": False,
            "error": ai_result.get("error", "Failed to analyze image with AI model.")
        }
    
    # Run Forensics
    ela_result = perform_ela(image_bytes)
    metadata_result = extract_metadata(image_bytes)
    
    # Calculate fake probability (0 to 1, where 1 is 100% fake)
    ai_fake_score = ai_result.get("fake_score", 0.5)
    ela_score = ela_result.get("ela_score", 0.0) if ela_result.get("success") else 0.0
    metadata_score = 0.1 if (metadata_result.get("success") and metadata_result.get("is_suspicious")) else 0.0
    
    # Weighted combination of indicators
    # AI model: 70%, ELA: 20%, Metadata: 10%
    combined_fake_score = (ai_fake_score * 0.70) + (ela_score * 0.20) + metadata_score
    combined_fake_score = min(max(combined_fake_score, 0.0), 1.0)
    
    is_ai_generated = combined_fake_score >= 0.5
    
    # Display confidence is how confident the model is in its final verdict
    display_confidence = combined_fake_score if is_ai_generated else (1.0 - combined_fake_score)
    
    report = {
        "success": True,
        "is_ai_generated": is_ai_generated,
        "confidence": round(display_confidence, 4),
        "overall_confidence": round(display_confidence, 4),
        "fake_probability": round(combined_fake_score, 4),
        "all_scores": ai_result.get("all_scores", []),
        "ai_analysis": ai_result,
        "ela_analysis": ela_result,
        "metadata_analysis": metadata_result
    }
    
    return report

@app.get("/")
def read_root():
    return {"status": "AIMD Platform API is running"}

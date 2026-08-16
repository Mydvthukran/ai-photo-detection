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
    
    # Run analysis
    result = analyze_image(image_bytes)
    
    return result

@app.get("/")
def read_root():
    return {"status": "AIMD Platform API is running"}

import io
from PIL import Image
from transformers import pipeline

# Initialize the pipeline globally so it only loads once
# We use a pre-trained model for deepfake detection
try:
    print("Loading AI model...")
    pipe = pipeline("image-classification", model="dima806/deepfake_vs_real_image_detection")
    print("AI model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    pipe = None

def analyze_image(image_bytes: bytes):
    try:
        # Open the image using PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Ensure image is in RGB format
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        if pipe is None:
            return {"error": "Model failed to load."}
            
        # Run inference
        results = pipe(image)
        
        # Format the results
        # results usually looks like [{'label': 'FAKE', 'score': 0.98}, {'label': 'REAL', 'score': 0.02}]
        # Let's sort and extract the highest confidence
        
        # Sort by score descending
        sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)
        top_prediction = sorted_results[0]
        
        is_ai_generated = top_prediction['label'].upper() == "FAKE"
        confidence = top_prediction['score']
        
        return {
            "success": True,
            "is_ai_generated": is_ai_generated,
            "confidence": float(confidence),
            "label": top_prediction['label'],
            "all_scores": results
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

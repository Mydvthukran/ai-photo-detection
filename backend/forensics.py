import io
import base64
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS

def perform_ela(image_bytes: bytes, quality: int = 90) -> dict:
    """
    Performs Error Level Analysis (ELA) on an image.
    Saves the image at a known quality and compares it to the original.
    Returns a base64 string of the ELA heatmap and an ELA score.
    """
    try:
        original = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Save at known quality to a bytes buffer
        compressed_io = io.BytesIO()
        original.save(compressed_io, 'JPEG', quality=quality)
        compressed_io.seek(0)
        
        compressed = Image.open(compressed_io)
        
        # Calculate difference
        diff = ImageChops.difference(original, compressed)
        extrema = diff.getextrema()
        
        # Extrema is a list of tuples like (min, max) for each band (R, G, B)
        max_diff = max([ex[1] for ex in extrema])
        if max_diff == 0:
            max_diff = 1
            
        scale = 255.0 / max_diff
        ela_image = ImageEnhance.Brightness(diff).enhance(scale)
        
        # Calculate a basic ELA "tamper score" based on variance of difference
        # High uniform difference usually means real (compression affects whole image)
        # High localized difference means tampered. We'll use a simplified metric.
        # Let's just use the max_diff as a basic proxy for the score for this MVP.
        # If max_diff is very high (> 100), there's high probability of tampering/artifacts.
        ela_score = min(max_diff / 150.0, 1.0) 
        
        # Convert ELA image to base64 for frontend
        buffered = io.BytesIO()
        ela_image.save(buffered, format="JPEG")
        ela_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return {
            "success": True,
            "heatmap_base64": f"data:image/jpeg;base64,{ela_base64}",
            "ela_score": ela_score,
            "max_difference": max_diff
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def extract_metadata(image_bytes: bytes) -> dict:
    """
    Extracts EXIF metadata from the image.
    Deepfakes or AI generated images often lack EXIF data like camera model, GPS, etc.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif_data = image.getexif()
        
        metadata = {}
        if exif_data:
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                # Keep it simple, convert values to strings
                metadata[tag] = str(value)
                
        # Analyze metadata for "authenticity"
        # If camera make/model exists, it's a strong indicator of real photo (though can be spoofed)
        has_camera_info = 'Make' in metadata or 'Model' in metadata
        is_suspicious = len(metadata) < 3 and not has_camera_info
        
        return {
            "success": True,
            "metadata": metadata,
            "is_suspicious": is_suspicious,
            "total_tags": len(metadata)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

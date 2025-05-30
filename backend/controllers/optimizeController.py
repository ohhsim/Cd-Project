from fastapi.responses import JSONResponse
import os
import uuid
from python.optimizer import run_optimization

UPLOAD_DIR = "uploads"

async def optimize_code(file):
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
        
        with open(file_path, "wb") as f:
            f.write(await file.read())

        optimized_output = run_optimization(file_path)
        return JSONResponse(status_code=200, content={
            "status": "success",
            "original_file": file.filename,
            "optimized_result": optimized_output
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


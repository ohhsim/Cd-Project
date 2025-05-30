from fastapi import APIRouter, UploadFile, File
from controllers.optimizeController import optimize_code
from utils.logger import setup_logger

router = APIRouter(prefix="/api/optimize", tags=["Optimizer"])
logger = setup_logger()

@router.post("/")
async def optimize(file: UploadFile = File(...)):
    logger.info(f"📁 Received file: {file.filename}")
    return await optimize_code(file)

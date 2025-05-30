from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend access (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Server is running"}

@app.post("/api/optimize")
async def optimize_code(file: UploadFile = File(...)):
    contents = await file.read()
    code = contents.decode("utf-8")

    # Dummy optimization: just reverse the code as a placeholder
    optimized_code = "\n".join(reversed(code.splitlines()))

    return {"optimized_code": optimized_code}

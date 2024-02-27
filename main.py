from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

app = FastAPI()

app.mount("/static", StaticFiles(directory="dist"), name="static")


@app.get("/")
async def root():
    return FileResponse("dist/index.html")

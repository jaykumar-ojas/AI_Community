from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

from routes.imageSearch import router as imageSearch
from routes.JobRoutes import router as JobRoutes
from routes.S3Routes import router as S3Routes
from routes.makeEmbedding import router as makeEmbedding

PORT = os.getenv("PORT")



app = FastAPI(title="Image Search API", description="API for searching images using CLIP embeddings")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(imageSearch)
app.include_router(JobRoutes)
app.include_router(makeEmbedding)
app.include_router(S3Routes)





if __name__ == "__main__":
    port = int(PORT) if PORT else 8000
    uvicorn.run("searchengine:app", host="0.0.0.0", port=port, reload=True)
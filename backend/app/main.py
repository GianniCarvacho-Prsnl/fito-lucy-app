from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importaremos los routers más adelante
# from app.routers import pets

app = FastAPI(
    title="PawTracker API",
    description="API para la gestión de mascotas y más",
    version="0.1.0"
)

# Configuración de CORS
origins = [
    "http://localhost:5173",  # URL del frontend en desarrollo (Vite)
    "http://127.0.0.1:5173", # Otra posible URL de desarrollo
    "http://localhost:4173",  # URL del frontend en preview (Vite)
    # Añadir aquí la URL del frontend en producción si es necesario
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Permite los orígenes especificados
    allow_credentials=True,   # Permite cookies y cabeceras de autenticación
    allow_methods=["*"],      # Permite todos los métodos HTTP (GET, POST, PUT, etc.)
    allow_headers=["*"],      # Permite todas las cabeceras
)

# Incluir routers (lo haremos más adelante)
# app.include_router(pets.router, prefix="/api")

# Endpoint raíz de prueba
@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de PawTracker V2"}

# Endpoint de salud para verificar que la API está corriendo
@app.get("/health")
async def health_check():
    return {"status": "ok"} 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importamos el router de mascotas
from app.routers import pets
# Importamos también el router de perfiles
from app.routers import profiles
# Importamos la configuración para usar el prefijo API
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
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

# Incluir el router de mascotas con su prefijo
app.include_router(pets.router, prefix=settings.API_V1_STR + "/pets")
# Incluir el router de perfiles con su prefijo
app.include_router(profiles.router, prefix=settings.API_V1_STR + "/profiles")

# Endpoint raíz de prueba
@app.get("/")
async def root():
    return {"message": f"Bienvenido a {settings.PROJECT_NAME}"}

# Endpoint de salud para verificar que la API está corriendo
@app.get("/health")
async def health_check():
    return {"status": "ok"} 
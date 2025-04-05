import os
from pydantic_settings import BaseSettings
from typing import List, Optional
from dotenv import load_dotenv

# Carga las variables de entorno del archivo .env
# Es útil hacerlo aquí para que estén disponibles al importar Settings
load_dotenv()

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str

    # API Config
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Opcional: Nombre del proyecto y versión API
    PROJECT_NAME: str = "PawTracker API"
    API_V1_STR: str = "/api"
    
    # Opcional: Entorno (development/production)
    ENVIRONMENT: Optional[str] = "development"
    
    # Configuración de Pydantic Settings
    class Config:
        # Lee las variables desde el archivo .env si existen
        env_file = ".env"
        # Permite que las variables de entorno del sistema sobrescriban las del .env
        env_file_encoding = 'utf-8'
        # No distingue mayúsculas de minúsculas para las variables de entorno
        case_sensitive = False 

# Instancia global de la configuración
settings = Settings()

# Validación rápida al iniciar
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY or not settings.SUPABASE_JWT_SECRET:
    raise ValueError("Faltan variables de entorno críticas de Supabase (URL, KEY, JWT_SECRET)")

print(f"Configuración cargada para el entorno: {settings.ENVIRONMENT}")
print(f"Supabase URL: {settings.SUPABASE_URL}") 
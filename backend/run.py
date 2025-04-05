import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    # Cargar variables de entorno desde .env
    # Asegúrate de crear un archivo .env basado en .env.example
    print("Cargando variables de entorno...")
    load_dotenv()
    
    # Obtener configuración del host y puerto
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    print(f"Iniciando servidor en {host}:{port}...")
    
    # Ejecutar la aplicación con Uvicorn
    # reload=True es útil para desarrollo, se reinicia automáticamente con cambios
    uvicorn.run(
        "app.main:app", 
        host=host, 
        port=port, 
        reload=True, 
        log_level="info" # Puedes cambiar a "debug" para más detalles
    ) 
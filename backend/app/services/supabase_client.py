from supabase import create_client, Client
from app.core.config import settings
# import httpx # No es necesario importar httpx aquí si no lo usamos explícitamente
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Crea y retorna una instancia del cliente Supabase."""
    try:
        # Usamos la inicialización más simple, que funcionó en la prueba
        supabase_client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
        logger.info("Cliente Supabase inicializado exitosamente (simple).")
        return supabase_client
    except Exception as e:
        logger.error(f"Error al inicializar el cliente Supabase: {e}")
        import traceback
        traceback.print_exc() # Imprimir stacktrace para depuración
        raise ConnectionError(f"No se pudo inicializar el cliente Supabase: {e}") from e

# Crear una instancia global del cliente para ser usada en la aplicación
try:
    supabase_client_instance: Client = get_supabase_client()
except ConnectionError as e:
    logger.critical(f"FALLO CRÍTICO: No se pudo crear la instancia del cliente Supabase al inicio: {e}")
    # En un caso real, podríamos querer que la aplicación no inicie si no puede conectarse
    # sys.exit(1) 
    supabase_client_instance = None # O manejarlo de otra forma

# Función para obtener la instancia (útil para dependencias en FastAPI)
def get_db() -> Client:
    if supabase_client_instance is None:
        # Si falló la inicialización al inicio, lanzamos un error aquí
        # para que las peticiones fallen apropiadamente.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Servicio de base de datos no disponible. Contacte al administrador."
        )
    return supabase_client_instance 
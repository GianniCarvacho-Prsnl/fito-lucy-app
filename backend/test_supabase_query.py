import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
# import httpx # Ya no necesitamos configurar httpx explícitamente aquí
import json # Para imprimir diccionarios de forma legible

# Configurar logging básico para ver mensajes
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_test():
    # Cargar variables de entorno desde .env
    logger.info("Cargando variables de entorno desde .env...")
    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    # --- IMPORTANTE: Necesitas un ID de usuario válido --- 
    # Reemplaza esto con un ID de usuario real de tu tabla 'users' 
    # o agrégalo a tu archivo .env como TEST_USER_ID
    test_user_id = os.getenv("TEST_USER_ID", "146f3e41-772b-4f02-ad04-5e679e386a90") 
    # ----------------------------------------------------

    if not supabase_url or not supabase_key:
        logger.error("Error: Faltan SUPABASE_URL o SUPABASE_KEY en el archivo .env")
        sys.exit(1)
        
    # Quitamos la advertencia del placeholder ya que lo has reemplazado
    # if test_user_id == "TU_USER_ID_DE_PRUEBA_AQUI":
    #     logger.warning("Advertencia: No se encontró TEST_USER_ID en .env. Usando placeholder.")
    #     logger.warning("La consulta probablemente fallará o devolverá vacío si no reemplazas el placeholder.")

    logger.info(f"Usando Supabase URL: {supabase_url}")
    logger.info(f"Usando User ID para prueba: {test_user_id}")

    supabase_client: Client | None = None
    try:
        logger.info("Inicializando cliente Supabase (v1.0.3 - simple)...")
        # Inicialización simplificada sin el diccionario 'options'
        supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Cliente Supabase inicializado.")

        logger.info(f"Realizando consulta: Obtener mascotas para owner_id = {test_user_id}")
        
        # Ejecutar la consulta para obtener mascotas
        # Usamos count='exact' para obtener el número total de filas que coinciden
        response = supabase_client.table("pets").select("*", count='exact').eq("owner_id", test_user_id).execute()
        
        # La respuesta en v1.0.3 es un objeto con atributos data, count, error
        logger.info(f"Respuesta recibida de Supabase.")

        # Verificar si hubo un error en la respuesta de Supabase
        if hasattr(response, 'error') and response.error:
             logger.error(f"Error en la respuesta de Supabase: {response.error}")
             return False

        # Procesar datos
        if hasattr(response, 'data'):
            pets_data = response.data
            # Asegurarse de que count existe antes de usarlo
            count = response.count if hasattr(response, 'count') and response.count is not None else len(pets_data)
            logger.info(f"Consulta exitosa. Número de mascotas encontradas: {count}")
            
            if pets_data:
                logger.info("Datos de las mascotas:")
                # Imprimir de forma más legible
                print(json.dumps(pets_data, indent=2))
            else:
                logger.info("No se encontraron mascotas para este usuario.")
            return True
        else:
             logger.error("La respuesta de Supabase no tiene el atributo 'data' esperado.")
             print("Respuesta completa:", response) # Imprimir toda la respuesta para depurar
             return False

    except httpx.ConnectError as e:
        logger.error(f"Error de conexión HTTPX: {e}. Verifica la URL de Supabase y tu conexión a internet.")
        return False
    except Exception as e:
        logger.error(f"Error inesperado durante la consulta a Supabase: {e}")
        import traceback
        traceback.print_exc() # Imprimir stacktrace completo
        return False

if __name__ == "__main__":
    print("--- Iniciando prueba de consulta a Supabase --- ")
    success = run_test()
    if success:
        print("--- ✅ Prueba completada exitosamente --- ")
    else:
        print("--- ❌ Prueba fallida --- ") 
from supabase import Client
from typing import List, Dict, Any, Optional
import uuid
from datetime import date
import logging
from fastapi import UploadFile
import shutil

# Podríamos definir excepciones personalizadas para la capa de servicio
class PetNotFoundError(Exception):
    pass

class PetAccessForbiddenError(Exception):
    pass

class PetDatabaseError(Exception):
    pass

class StorageUploadError(Exception):
    pass

logger = logging.getLogger(__name__)

async def get_pets_by_owner(db: Client, owner_id: str) -> List[Dict[str, Any]]:
    """Obtiene todas las mascotas para un owner_id específico."""
    logger.info(f"Service: Obteniendo mascotas para owner_id: {owner_id}")
    try:
        response = db.table("pets").select("*", count='exact').eq("owner_id", owner_id).execute()
        logger.debug(f"Service: Respuesta get_pets_by_owner: {response}")
        
        if hasattr(response, 'error') and response.error:
            logger.error(f"Service: Error Supabase en get_pets_by_owner: {response.error}")
            raise PetDatabaseError(f"Error al consultar mascotas: {response.error.message}")
        
        return response.data if hasattr(response, 'data') else []
    except Exception as e:
        logger.error(f"Service: Excepción inesperada en get_pets_by_owner: {e}", exc_info=True)
        raise PetDatabaseError(f"Error inesperado al obtener mascotas: {e}") from e

async def create_new_pet(db: Client, owner_id: str, pet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Crea una nueva mascota en la base de datos."""
    logger.info(f"Service: Creando mascota para owner_id: {owner_id}")
    
    # Preparar datos: añadir owner_id y convertir fecha
    data_to_insert = pet_data.copy()
    data_to_insert["owner_id"] = owner_id
    if data_to_insert.get("birthdate") and isinstance(data_to_insert["birthdate"], date):
        logger.debug("Service: Convirtiendo birthdate a ISO string")
        data_to_insert["birthdate"] = data_to_insert["birthdate"].isoformat()
        
    logger.debug(f"Service: Datos a insertar: {data_to_insert}")
    
    try:
        response = db.table("pets").insert(data_to_insert).execute()
        logger.debug(f"Service: Respuesta create_new_pet: {response}")

        if hasattr(response, 'error') and response.error:
            logger.error(f"Service: Error Supabase en create_new_pet: {response.error}")
            raise PetDatabaseError(f"Error al crear mascota: {response.error.message}")
        
        if hasattr(response, 'data') and response.data:
            return response.data[0]
        else:
             logger.error("Service: Respuesta inesperada de Supabase al crear (sin data)")
             raise PetDatabaseError("Respuesta inesperada del servicio de BD al crear")
             
    except Exception as e:
        logger.error(f"Service: Excepción inesperada en create_new_pet: {e}", exc_info=True)
        raise PetDatabaseError(f"Error inesperado al crear mascota: {e}") from e

async def get_pet_by_id(db: Client, pet_id: uuid.UUID, user_id: str) -> Dict[str, Any]:
    """Obtiene una mascota por ID, verificando la propiedad."""
    logger.info(f"Service: Obteniendo mascota ID: {pet_id} para user_id: {user_id}")
    try:
        response = db.table("pets").select("*").eq("id", str(pet_id)).maybe_single().execute()
        logger.debug(f"Service: Respuesta get_pet_by_id: {response}")

        if hasattr(response, 'error') and response.error:
            logger.error(f"Service: Error Supabase en get_pet_by_id: {response.error}")
            raise PetDatabaseError(f"Error al obtener mascota por ID: {response.error.message}")

        if not response.data:
            logger.warning(f"Service: Mascota {pet_id} no encontrada.")
            raise PetNotFoundError(f"Mascota con ID {pet_id} no encontrada")
        
        pet_data = response.data
        if str(pet_data.get("owner_id")) != str(user_id):
            logger.warning(f"Service: Intento de acceso no autorizado a mascota {pet_id} por usuario {user_id}")
            raise PetAccessForbiddenError("No tienes permiso para acceder a esta mascota")
        
        logger.info(f"Service: Verificación de propiedad OK para mascota {pet_id}")
        return pet_data

    except (PetNotFoundError, PetAccessForbiddenError) as e:
        raise e # Re-lanzar excepciones personalizadas
    except Exception as e:
        logger.error(f"Service: Excepción inesperada en get_pet_by_id: {e}", exc_info=True)
        raise PetDatabaseError(f"Error inesperado al obtener mascota por ID: {e}") from e

async def update_existing_pet(db: Client, pet_id: uuid.UUID, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Actualiza una mascota existente, verificando la propiedad."""
    logger.info(f"Service: Actualizando mascota ID: {pet_id} para user_id: {user_id}")
    
    # 1. Verificar propiedad (reutiliza la lógica de get_pet_by_id)
    await get_pet_by_id(db=db, pet_id=pet_id, user_id=user_id) 
    # Si no lanza excepción, la mascota existe y pertenece al usuario
    
    # 2. Preparar datos para actualizar (solo fecha, el resto ya viene filtrado del router)
    data_to_update = update_data.copy()
    if data_to_update.get("birthdate") and isinstance(data_to_update["birthdate"], date):
        logger.debug("Service: Convirtiendo birthdate a ISO string en update")
        data_to_update["birthdate"] = data_to_update["birthdate"].isoformat()
        
    logger.debug(f"Service: Datos a actualizar: {data_to_update}")

    # 3. Ejecutar actualización
    try:
        response = db.table("pets").update(data_to_update).eq("id", str(pet_id)).execute()
        logger.debug(f"Service: Respuesta update_existing_pet: {response}")

        if hasattr(response, 'error') and response.error:
            logger.error(f"Service: Error Supabase en update_existing_pet: {response.error}")
            raise PetDatabaseError(f"Error al actualizar mascota: {response.error.message}")
        
        if hasattr(response, 'data') and response.data:
            return response.data[0]
        else:
            logger.error("Service: Respuesta inesperada de Supabase al actualizar (sin data)")
            raise PetDatabaseError("Respuesta inesperada del servicio de BD al actualizar")

    except Exception as e:
        logger.error(f"Service: Excepción inesperada en update_existing_pet: {e}", exc_info=True)
        raise PetDatabaseError(f"Error inesperado al actualizar mascota: {e}") from e

async def delete_pet_by_id(db: Client, pet_id: uuid.UUID, user_id: str) -> None:
    """Elimina una mascota por ID, verificando la propiedad."""
    logger.info(f"Service: Eliminando mascota ID: {pet_id} para user_id: {user_id}")
    
    # 1. Verificar propiedad (reutiliza la lógica de get_pet_by_id)
    await get_pet_by_id(db=db, pet_id=pet_id, user_id=user_id)
    # Si no lanza excepción, la mascota existe y pertenece al usuario
    
    # 2. Ejecutar eliminación
    try:
        response = db.table("pets").delete().eq("id", str(pet_id)).execute()
        logger.debug(f"Service: Respuesta delete_pet_by_id: {response}")

        if hasattr(response, 'error') and response.error:
            logger.error(f"Service: Error Supabase en delete_pet_by_id: {response.error}")
            raise PetDatabaseError(f"Error al eliminar mascota: {response.error.message}")
            
        logger.info(f"Service: Mascota {pet_id} eliminada exitosamente.")
        # No retorna nada en caso de éxito

    except Exception as e:
        logger.error(f"Service: Excepción inesperada en delete_pet_by_id: {e}", exc_info=True)
        raise PetDatabaseError(f"Error inesperado al eliminar mascota: {e}") from e

async def upload_photo_to_storage(db: Client, user_id: str, file: UploadFile) -> str:
    """Sube un archivo a Supabase Storage y devuelve la URL pública."""
    logger.info(f"Service: Subiendo foto para usuario {user_id}, archivo: {file.filename}, tipo: {file.content_type}")
    
    # Validaciones básicas (podrían ser más extensas)
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"Service: Intento de subir archivo no imagen: {file.content_type}")
        raise StorageUploadError("Tipo de archivo no permitido. Solo se aceptan imágenes.")
        
    # Crear un nombre de archivo único para evitar colisiones
    # Podríamos usar parte del user_id o pet_id si quisiéramos organizar por carpetas
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg' # Extensión por defecto
    unique_filename = f"user_{user_id}/{uuid.uuid4()}.{file_extension}"
    
    logger.debug(f"Service: Nombre de archivo único generado: {unique_filename}")
    
    # Leer el contenido del archivo. UploadFile tiene un método read()
    try:
        contents = await file.read()
    except Exception as e:
         logger.error(f"Service: Error al leer el archivo subido: {e}")
         raise StorageUploadError("No se pudo leer el archivo enviado.")
    finally:
         await file.close() # Siempre cerrar el archivo

    # Subir a Supabase Storage
    storage_bucket = "pet_photos" # Nombre del bucket en Supabase
    try:
        # La v1.x de supabase-py usa `storage.from_(bucket).upload(...)`
        # Devuelve {'Key': 'path/to/file'} en éxito
        # Necesitamos pasar bytes al método upload
        upload_response = db.storage.from_(storage_bucket).upload(
            path=unique_filename, 
            file=contents, 
            file_options={"content-type": file.content_type} # Especificar content type
        )
        logger.debug(f"Service: Respuesta de Supabase Storage (upload): {upload_response}")
        
        # Verificar si hubo error (en v1, el error se lanza como excepción)
        # La respuesta exitosa no tiene un campo 'error' explícito
        # Si llegamos aquí sin excepción, la subida fue probablemente exitosa

        # Obtener la URL pública
        public_url_response = db.storage.from_(storage_bucket).get_public_url(unique_filename)
        logger.debug(f"Service: Respuesta de Supabase Storage (get_public_url): {public_url_response}")
        
        # En v1.x, get_public_url devuelve la URL directamente como string
        if isinstance(public_url_response, str):
            logger.info(f"Service: Foto subida exitosamente a: {public_url_response}")
            return public_url_response
        else:
            # Si no es string, algo falló al obtener la URL pública
            logger.error(f"Service: No se pudo obtener la URL pública después de subir. Respuesta: {public_url_response}")
            raise StorageUploadError("Archivo subido pero no se pudo obtener la URL pública.")

    except Exception as e:
        # Capturar cualquier excepción durante la subida o la obtención de URL
        logger.error(f"Service: Error durante la operación de Supabase Storage: {e}", exc_info=True)
        # Podríamos intentar extraer un mensaje más específico del error si es posible
        raise StorageUploadError(f"Error al interactuar con el almacenamiento: {e}") from e 
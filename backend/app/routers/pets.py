from fastapi import APIRouter, Depends, HTTPException, status, Response, File, UploadFile
from typing import List, Optional, Dict # Aseguramos Optional para PetUpdate
from supabase import Client # Para type hinting
import uuid # Para validar el owner_id
from datetime import date # Necesario para la conversión de fecha en update

from app.models.pet import Pet, PetCreate, PetUpdate # Añadimos PetUpdate
from app.services.supabase_client import get_db # Importamos el proveedor del cliente Supabase
# Importamos la dependencia de autenticación real
from app.core.auth import get_current_user 
# Importar el nuevo servicio y las excepciones personalizadas
from app.services import pet_service
from app.services.pet_service import PetNotFoundError, PetAccessForbiddenError, PetDatabaseError, StorageUploadError

# Ya no necesitamos el placeholder
# async def get_current_user_placeholder():
#     ...

router = APIRouter(
    # El prefijo se definirá al incluir el router en main.py
    tags=["Pets"], # Etiqueta para agrupar endpoints en la documentación
    responses={
        404: {"description": "Not Found"},
        403: {"description": "Access Forbidden"},
        400: {"description": "Bad Request"}, # Para errores de subida
        500: {"description": "Internal Server Error"}
    }
)

# --- FUNCIÓN AUXILIAR PARA VERIFICAR PROPIEDAD --- 
async def _get_pet_and_verify_owner(pet_id: uuid.UUID, user_id: str, db: Client) -> dict:
    """
    Obtiene una mascota por ID y verifica que pertenezca al user_id proporcionado.
    Lanza HTTPException 404 si no se encuentra o 403 si no pertenece al usuario.
    Devuelve los datos de la mascota si la verificación es exitosa.
    """
    print(f"_get_pet_and_verify_owner: Verificando mascota ID: {pet_id} para user_id: {user_id}")
    try:
        # Seleccionamos todos los datos, no solo owner_id, para devolverlos si éxito
        response = db.table("pets").select("*").eq("id", str(pet_id)).maybe_single().execute()
        
        # print("Respuesta cruda (verificación owner):", response)

        if hasattr(response, 'error') and response.error:
             print(f"Error Supabase (verificación owner): {response.error}")
             # Usar 500 aquí, ya que es un error inesperado de la BD al verificar
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error de BD al verificar mascota")

        if not response.data:
            print(f"Mascota {pet_id} no encontrada.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mascota con ID {pet_id} no encontrada")
        
        pet_data = response.data
        if str(pet_data.get("owner_id")) != str(user_id):
            print(f"Conflicto propietario: Mascota {pet_id} pertenece a {pet_data.get('owner_id')}, no a {user_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para acceder/modificar esta mascota")
        
        print(f"Verificación de propiedad OK para mascota {pet_id}")
        return pet_data # Devuelve los datos completos de la mascota encontrada

    except HTTPException as http_exc:
        # Re-lanzar las excepciones HTTP que generamos nosotros mismos
        raise http_exc
    except Exception as e:
        # Capturar otros errores inesperados durante la verificación
        print(f"Error inesperado en _get_pet_and_verify_owner: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al verificar la mascota")

@router.get("/", response_model=List[Pet])
async def read_pets(
    *, # Hace que los siguientes argumentos sean solo por nombre
    db: Client = Depends(get_db), # Inyecta el cliente Supabase
    # Usamos la dependencia real para obtener el usuario verificado
    current_user: dict = Depends(get_current_user) 
):
    """
    Obtiene una lista de todas las mascotas pertenecientes al usuario actual.
    """
    user_id = current_user.get("id") # El ID viene del token verificado ('sub' claim)
    if not user_id:
        # Esto no debería ocurrir si get_current_user funciona, pero es una salvaguarda
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado después de la autenticación")

    print(f"Endpoint read_pets: Obteniendo mascotas para user_id: {user_id}")
    
    try:
        pets = await pet_service.get_pets_by_owner(db=db, owner_id=str(user_id))
        return pets
    except PetDatabaseError as e:
        # Captura errores de BD del servicio
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        # Otros errores inesperados
        print(f"Error inesperado en router read_pets: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno")

# --- NUEVO ENDPOINT --- 
@router.post("/", response_model=Pet, status_code=status.HTTP_201_CREATED)
async def create_pet(
    *, 
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    pet_in: PetCreate # Recibe los datos de la mascota del cuerpo de la petición
):
    """
    Crea una nueva mascota para el usuario actual.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")
        
    # Validar que el user_id parece un UUID (defensa adicional)
    try:
        uuid.UUID(user_id)
    except ValueError:
         print(f"Error: user_id obtenido del token no es un UUID válido: {user_id}")
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identificador de usuario inválido")

    print(f"Endpoint create_pet: Creando mascota para user_id: {user_id}")
    print(f"Datos recibidos (antes de convertir fecha): {pet_in.model_dump()}")

    # Preparamos los datos para insertar, añadiendo el owner_id
    pet_data_to_insert = pet_in.model_dump()
    pet_data_to_insert["owner_id"] = str(user_id)

    # --- CORRECCIÓN: Convertir 'date' a string 'YYYY-MM-DD' --- 
    if pet_data_to_insert.get("birthdate"):
        # Verificar si es un objeto date (podría ser None)
        from datetime import date
        if isinstance(pet_data_to_insert["birthdate"], date):
            print(f"Convirtiendo birthdate ({type(pet_data_to_insert['birthdate'])}) a string ISO")
            pet_data_to_insert["birthdate"] = pet_data_to_insert["birthdate"].isoformat()
        # Si ya es string (poco probable con Pydantic), asumimos formato correcto
    # ----------------------------------------------------------

    print(f"Datos a insertar en Supabase: {pet_data_to_insert}")
    
    try:
        # Insertar en Supabase
        created_pet = await pet_service.create_new_pet(db=db, owner_id=str(user_id), pet_data=pet_data_to_insert)
        return created_pet
    except PetDatabaseError as e:
        # Puede ser un 400 Bad Request si Supabase devolvió error (ej: constraint)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error inesperado en router create_pet: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al crear mascota")

# --- NUEVO ENDPOINT --- 
@router.put("/{pet_id}", response_model=Pet)
async def update_pet(
    *, 
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    pet_id: uuid.UUID, # Obtiene el ID de la mascota de la ruta y valida que sea UUID
    pet_in: PetUpdate # Obtiene los datos a actualizar del cuerpo
):
    """
    Actualiza una mascota existente perteneciente al usuario actual.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")

    print(f"Endpoint update_pet: Actualizando mascota ID: {pet_id} para user_id: {user_id}")
    print(f"Datos de actualización recibidos: {pet_in.model_dump(exclude_unset=True)}")

    # 1. Verificar propiedad usando la función auxiliar
    # La función ya lanza 404 o 403 si es necesario
    await _get_pet_and_verify_owner(pet_id=pet_id, user_id=user_id, db=db)
    
    # 2. Preparar datos para la actualización
    # Usamos exclude_unset=True para obtener solo los campos que el cliente envió
    update_data = pet_in.model_dump(exclude_unset=True)
    
    # Si no se envió ningún dato para actualizar, devolver error o la mascota sin cambios
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar")

    # --- Convertir 'date' a string 'YYYY-MM-DD' si está presente --- 
    if "birthdate" in update_data and update_data["birthdate"] is not None:
        if isinstance(update_data["birthdate"], date):
            print(f"Convirtiendo birthdate en actualización a string ISO")
            update_data["birthdate"] = update_data["birthdate"].isoformat()
    # ----------------------------------------------------------
    
    # Añadir timestamp de actualización (opcional, depende de tu esquema/triggers)
    # update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    print(f"Datos a actualizar en Supabase: {update_data}")

    # 3. Realizar la actualización en Supabase
    try:
        updated_pet = await pet_service.update_existing_pet(
            db=db, pet_id=pet_id, user_id=str(user_id), update_data=update_data
        )
        return updated_pet
    except PetNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PetAccessForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except PetDatabaseError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error inesperado en router update_pet: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al actualizar mascota")

# --- NUEVO ENDPOINT --- 
@router.get("/{pet_id}", response_model=Pet)
async def read_pet(
    *, 
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    pet_id: uuid.UUID # Obtiene el ID de la mascota de la ruta y valida que sea UUID
):
    """
    Obtiene los detalles de una mascota específica perteneciente al usuario actual.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")

    print(f"Endpoint read_pet: Obteniendo mascota ID: {pet_id} para user_id: {user_id}")

    # Usamos la función auxiliar para obtener y verificar
    # Ya maneja 404 y 403
    pet_data = await _get_pet_and_verify_owner(pet_id=pet_id, user_id=user_id, db=db)
    
    # Si la función anterior no lanzó excepción, pet_data es válido
    return pet_data

# --- NUEVO ENDPOINT --- 
@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    *, 
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    pet_id: uuid.UUID # Obtiene el ID de la mascota de la ruta
):
    """
    Elimina una mascota perteneciente al usuario actual.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")

    print(f"Endpoint delete_pet: Eliminando mascota ID: {pet_id} para user_id: {user_id}")

    # 1. Verificar propiedad usando la función auxiliar
    # La función ya lanza 404 o 403 si es necesario
    await _get_pet_and_verify_owner(pet_id=pet_id, user_id=user_id, db=db)
    
    # 2. Realizar la eliminación en Supabase
    try:
        await pet_service.delete_pet_by_id(db=db, pet_id=pet_id, user_id=str(user_id))
        # Si no hay excepción, la eliminación fue exitosa (o la mascota no existía y pertenecía al usuario)
        # Devolvemos 204
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except PetNotFoundError as e:
        # Si queremos ser estrictos y devolver 404 si no existe al eliminar
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PetAccessForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except PetDatabaseError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Error inesperado en router delete_pet: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al eliminar mascota")

# --- NUEVO ENDPOINT PARA SUBIDA DE FOTOS --- 
@router.post("/upload_photo", response_model=Dict[str, str])
async def upload_pet_photo(
    *, 
    db: Client = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    file: UploadFile = File(...) # Recibe el archivo como parte de form-data
):
    """
    Sube una foto para una mascota al almacenamiento y devuelve la URL pública.
    Nota: Esta versión simple solo sube la foto. No la asocia automáticamente
    a una mascota específica en la base de datos. Se podría extender para
    recibir un `pet_id` y actualizar el campo `photo_url` de esa mascota.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")

    print(f"Endpoint upload_pet_photo: Recibido archivo: {file.filename}, tipo: {file.content_type}, para user: {user_id}")

    try:
        public_url = await pet_service.upload_photo_to_storage(
            db=db, user_id=str(user_id), file=file
        )
        # Devuelve un diccionario simple con la URL
        return {"photo_url": public_url}
        
    except StorageUploadError as e:
        # Errores específicos de la subida (ej. tipo inválido, error de lectura, error de storage)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Otros errores inesperados
        print(f"Error inesperado en router upload_pet_photo: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al subir la foto") 
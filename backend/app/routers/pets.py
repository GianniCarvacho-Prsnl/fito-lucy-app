from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List, Optional # Aseguramos Optional para PetUpdate
from supabase import Client # Para type hinting
import uuid # Para validar el owner_id
from datetime import date # Necesario para la conversión de fecha en update

from app.models.pet import Pet, PetCreate, PetUpdate # Añadimos PetUpdate
from app.services.supabase_client import get_db # Importamos el proveedor del cliente Supabase
# Importamos la dependencia de autenticación real
from app.core.auth import get_current_user 

# Ya no necesitamos el placeholder
# async def get_current_user_placeholder():
#     ...

router = APIRouter(
    # El prefijo se definirá al incluir el router en main.py
    tags=["Pets"], # Etiqueta para agrupar endpoints en la documentación
    responses={404: {"description": "Not Found"}} # Respuesta común
)

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
        # Usamos la service_role key, así que RLS se omite, pero filtramos explícitamente
        response = db.table("pets").select("*", count='exact').eq("owner_id", str(user_id)).execute()
        
        # Debug: Imprimir la respuesta cruda de Supabase
        print("Respuesta cruda de Supabase:", response)
        
        if hasattr(response, 'error') and response.error:
            print(f"Error de Supabase al obtener mascotas: {response.error}")
            # Considerar si el error es específico (ej. 4xx) o genérico (500)
            # Por ahora, lo tratamos como error interno del servidor
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                detail=f"Error de base de datos al consultar mascotas")
        
        if hasattr(response, 'data'):
             # Pydantic validará automáticamente que los datos coincidan con List[Pet]
             print(f"Mascotas encontradas: {len(response.data)}")
             return response.data
        else:
            # Si la respuesta no tiene 'data', algo inesperado ocurrió
            print("Respuesta inesperada de Supabase (sin data)")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                detail="Respuesta inesperada del servicio de base de datos")

    except HTTPException as http_exc:
        # Re-lanzar excepciones HTTP que ya hayamos generado (como 401 de get_current_user)
        raise http_exc
    except ConnectionError as conn_err:
         print(f"Error de conexión a Supabase: {conn_err}")
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                             detail="No se pudo conectar al servicio de base de datos")
    except Exception as e:
        print(f"Error inesperado en read_pets: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail="Ocurrió un error interno al procesar la solicitud")

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
        response = db.table("pets").insert(pet_data_to_insert).execute()
        
        print("Respuesta cruda de Supabase (insert):", response)

        if hasattr(response, 'error') and response.error:
            print(f"Error de Supabase al crear mascota: {response.error}")
            # Aquí podríamos intentar dar un error más específico si es posible
            # ej. si es una violación de constraint, podría ser un 409 Conflict o 400 Bad Request
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                                detail=f"Error de base de datos al crear mascota: {response.error.message}")
        
        if hasattr(response, 'data') and response.data:
             created_pet_data = response.data[0] # Insert devuelve una lista con el elemento creado
             print(f"Mascota creada exitosamente con ID: {created_pet_data.get('id')}")
             # FastAPI/Pydantic validarán que coincida con el response_model Pet
             return created_pet_data
        else:
            print("Respuesta inesperada de Supabase al crear mascota (sin data)")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                detail="Error inesperado del servicio de base de datos al crear mascota")

    except HTTPException as http_exc:
        raise http_exc
    except ConnectionError as conn_err:
         print(f"Error de conexión a Supabase: {conn_err}")
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                             detail="No se pudo conectar al servicio de base de datos")
    except Exception as e:
        print(f"Error inesperado en create_pet: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail="Ocurrió un error interno al crear la mascota")

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

    # 1. Verificar que la mascota existe y pertenece al usuario
    try:
        existing_pet_response = db.table("pets").select("owner_id").eq("id", str(pet_id)).maybe_single().execute()
        
        print("Respuesta cruda de Supabase (verificación owner):", existing_pet_response)

        if hasattr(existing_pet_response, 'error') and existing_pet_response.error:
             print(f"Error de Supabase al verificar mascota: {existing_pet_response.error}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error de base de datos al verificar mascota")

        if not existing_pet_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mascota con ID {pet_id} no encontrada")
        
        if str(existing_pet_response.data.get("owner_id")) != str(user_id):
            print(f"Conflicto de propietario: Mascota {pet_id} pertenece a {existing_pet_response.data.get('owner_id')}, no a {user_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para modificar esta mascota")
        
        print(f"Verificación de propiedad OK para mascota {pet_id}")

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error inesperado durante la verificación de propiedad: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al verificar la mascota")

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
        response = db.table("pets").update(update_data).eq("id", str(pet_id)).execute()

        print("Respuesta cruda de Supabase (update):", response)
        
        if hasattr(response, 'error') and response.error:
            print(f"Error de Supabase al actualizar mascota: {response.error}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                                detail=f"Error de base de datos al actualizar mascota: {response.error.message}")
        
        if hasattr(response, 'data') and response.data:
             updated_pet_data = response.data[0]
             print(f"Mascota {pet_id} actualizada exitosamente.")
             return updated_pet_data
        else:
            # Esto podría pasar si el ID era correcto pero algo falló silenciosamente
            print("Respuesta inesperada de Supabase al actualizar (sin data)")
            # Podríamos re-leer la mascota para asegurar o devolver un error
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                detail="Error inesperado del servicio de base de datos al actualizar mascota")

    except HTTPException as http_exc:
        raise http_exc
    except ConnectionError as conn_err:
         print(f"Error de conexión a Supabase: {conn_err}")
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                             detail="No se pudo conectar al servicio de base de datos")
    except Exception as e:
        print(f"Error inesperado en update_pet: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail="Ocurrió un error interno al actualizar la mascota")

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

    try:
        # Seleccionamos todos los campos de la mascota por su ID
        response = db.table("pets").select("*").eq("id", str(pet_id)).maybe_single().execute()
        
        print("Respuesta cruda de Supabase (get by id):", response)

        if hasattr(response, 'error') and response.error:
            print(f"Error de Supabase al obtener mascota por ID: {response.error}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                detail=f"Error de base de datos al obtener mascota: {response.error.message}")

        # maybe_single() devuelve None en response.data si no se encuentra
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mascota con ID {pet_id} no encontrada")
        
        pet_data = response.data

        # Verificar propiedad
        if str(pet_data.get("owner_id")) != str(user_id):
            print(f"Conflicto de propietario en GET: Mascota {pet_id} pertenece a {pet_data.get('owner_id')}, no a {user_id}")
            # Aunque RLS debería prevenir esto si la política está bien, es una doble verificación
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver esta mascota")

        print(f"Mascota {pet_id} encontrada y verificada.")
        # FastAPI/Pydantic validarán que pet_data coincida con el response_model Pet
        return pet_data

    except HTTPException as http_exc:
        raise http_exc
    except ConnectionError as conn_err:
         print(f"Error de conexión a Supabase: {conn_err}")
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                             detail="No se pudo conectar al servicio de base de datos")
    except Exception as e:
        print(f"Error inesperado en read_pet: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail="Ocurrió un error interno al obtener la mascota")

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

    # 1. Verificar que la mascota existe y pertenece al usuario (igual que en PUT y GET/{id})
    try:
        existing_pet_response = db.table("pets").select("owner_id").eq("id", str(pet_id)).maybe_single().execute()
        
        print("Respuesta cruda de Supabase (verificación owner):", existing_pet_response)

        if hasattr(existing_pet_response, 'error') and existing_pet_response.error:
             print(f"Error de Supabase al verificar mascota para eliminar: {existing_pet_response.error}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error de BD al verificar mascota")

        # Si no se encuentra, ya no existe, podemos considerar la operación exitosa o devolver 404
        # Devolver 404 es más explícito si el cliente esperaba que existiera.
        if not existing_pet_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Mascota con ID {pet_id} no encontrada para eliminar")
        
        # Verificar propiedad
        if str(existing_pet_response.data.get("owner_id")) != str(user_id):
            print(f"Conflicto de propietario al eliminar: Mascota {pet_id} no pertenece a {user_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para eliminar esta mascota")
        
        print(f"Verificación de propiedad OK para eliminar mascota {pet_id}")

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error inesperado durante la verificación para eliminar: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al verificar la mascota para eliminar")

    # 2. Realizar la eliminación en Supabase
    try:
        response = db.table("pets").delete().eq("id", str(pet_id)).execute()

        print("Respuesta cruda de Supabase (delete):", response)
        
        # Verificar errores específicos de la operación DELETE
        if hasattr(response, 'error') and response.error:
            print(f"Error de Supabase al eliminar mascota: {response.error}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                                detail=f"Error de base de datos al eliminar mascota: {response.error.message}")
        
        # Nota: DELETE exitoso en Supabase v1.x a menudo devuelve data=[] o data=None
        # No necesariamente devuelve los datos eliminados.
        # El éxito se infiere por la ausencia de error y el status code 204.
        print(f"Mascota {pet_id} eliminada exitosamente.")
        
        # No devolvemos cuerpo, solo el status 204 definido en el decorador
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except HTTPException as http_exc:
        raise http_exc
    except ConnectionError as conn_err:
         print(f"Error de conexión a Supabase: {conn_err}")
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                             detail="No se pudo conectar al servicio de base de datos")
    except Exception as e:
        print(f"Error inesperado en delete_pet: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                            detail="Ocurrió un error interno al eliminar la mascota") 
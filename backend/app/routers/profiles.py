# backend/app/routers/profiles.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict
import uuid # Para construir el UUID desde el string id
from datetime import datetime # Para el updated_at simulado

# Importar la dependencia de autenticación correcta
from app.core.auth import get_current_user 
# Importar los esquemas de perfil
from app.schemas.profile import ProfileRead, ProfileUpdate
# Importar el cliente Supabase para interactuar con la BD (necesario para el servicio futuro)
from app.services.supabase_client import get_db 
from supabase import Client # Para type hinting de 'db'

# Placeholder para el servicio de perfil que crearemos después
# from app.services import profile_service 
# Importamos el servicio de perfil que ya creamos
from app.services import profile_service

# Creamos el router
router = APIRouter()

# Endpoint para obtener el perfil del usuario actual
@router.get("/me", 
            response_model=ProfileRead, 
            summary="Obtener perfil del usuario actual",
            tags=["Profiles"]) # Añadimos una etiqueta para Swagger UI
async def read_profile_me(
    # db: Client = Depends(get_db), # Ya no necesitamos inyectar db aquí si el servicio lo maneja
    current_user: dict = Depends(get_current_user) # Correcto: recibe dict
) -> Any:
    """
    Obtiene el perfil del usuario actualmente autenticado desde la tabla profiles.
    """
    user_id_str = current_user.get("id") 
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")
    
    try:
        user_id = uuid.UUID(user_id_str) # Convertir a UUID para el esquema
    except ValueError:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID de usuario inválido")

    print(f"read_profile_me: Obteniendo perfil para user_id: {user_id}")

    # --- Lógica Temporal (Placeholder) ---
    # ... (código placeholder eliminado)
    # --- Fin Lógica Temporal ---

    # --- Inicio Lógica Real con Servicio ---
    try:
        profile = await profile_service.get_profile_by_id(profile_id=user_id)
        if not profile:
            # Si no se encuentra el perfil en la tabla profiles, devolvemos 404
            # Esto sucederá hasta que implementemos el trigger
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
        return profile
    except HTTPException as http_exc:
        # Re-lanzar excepciones HTTP conocidas (como 404 o 500 del servicio)
        raise http_exc
    except Exception as e:
        # Capturar cualquier otro error inesperado
        print(f"Error inesperado al obtener perfil: {e}") # Loggear el error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al intentar obtener el perfil."
        )
    # --- Fin Lógica Real con Servicio ---

    # Devolvemos datos de ejemplo mapeados al esquema ProfileRead
    # ... (código de retorno placeholder eliminado)

# Endpoint para actualizar el perfil del usuario actual
@router.put("/me", 
            response_model=ProfileRead, 
            summary="Actualizar perfil del usuario actual",
            tags=["Profiles"])
async def update_profile_me(
    *, 
    profile_in: ProfileUpdate, # Datos a actualizar desde el body
    db: Client = Depends(get_db), # Inyectamos cliente Supabase
    current_user: dict = Depends(get_current_user) # Correcto: recibe dict
) -> Any:
    """
    Actualiza el perfil del usuario actualmente autenticado.
    """
    user_id_str = current_user.get("id")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no identificado")
        
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID de usuario inválido")

    print(f"update_profile_me: Actualizando perfil para user_id: {user_id}")
    update_data = profile_in.model_dump(exclude_unset=True) # Obtiene solo los campos enviados
    print(f"Datos recibidos para actualizar: {update_data}")

    if not update_data:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para actualizar")

    # --- Lógica Temporal (Placeholder) ---
    # En el futuro, llamaremos a:
    # updated_profile = await profile_service.update_profile(db=db, user_id=user_id, profile_in=profile_in)
    # if not updated_profile:
    #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado para actualizar")
    # return updated_profile
    # --- Fin Lógica Temporal ---

    # --- Inicio Lógica Real con Servicio ---
    try:
        updated_profile = await profile_service.update_profile(
            profile_id=user_id, # Pasamos el UUID del usuario
            profile_data=profile_in # Pasamos el objeto ProfileUpdate directamente
        )
        if not updated_profile:
            # El servicio devuelve None si el perfil no se encontró para actualizar
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado para actualizar")
        return updated_profile
    except HTTPException as http_exc:
        # Re-lanzar excepciones HTTP que vengan del servicio (ej: error 500 de DB)
        raise http_exc
    except Exception as e:
        # Capturar cualquier otro error inesperado
        print(f"Error inesperado al actualizar perfil: {e}") # Loggear el error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al intentar actualizar el perfil."
        )
    # --- Fin Lógica Real con Servicio ---

    # Simulamos la actualización y devolvemos un perfil "actualizado"
    # Idealmente, leeríamos el perfil existente y lo fusionaríamos con update_data
    # return ProfileRead(
    #     id=user_id, 
    #     username=update_data.get("username", f"usuario_{str(user_id)[:8]}"),
    #     full_name=update_data.get("full_name", "Nombre Placeholder Actualizado"),
    #     avatar_url=str(update_data.get("avatar_url")) if update_data.get("avatar_url") else None,
    #     website=str(update_data.get("website")) if update_data.get("website") else None,
    #     updated_at=datetime.now() 
    # ) 
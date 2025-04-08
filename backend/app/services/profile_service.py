from app.schemas.profile import ProfileRead, ProfileUpdate
import uuid
from datetime import datetime

async def update_profile(profile_id: uuid.UUID, profile_data: ProfileUpdate) -> ProfileRead | None:
    """
    Actualiza un perfil de usuario existente en Supabase.

    Args:
        profile_id: El UUID del perfil a actualizar.
        profile_data: Un objeto ProfileUpdate con los datos a actualizar.

    Returns:
        Un objeto ProfileRead con los datos actualizados si la actualización fue exitosa, None si no se encontró el perfil.

    Raises:
        HTTPException: Si ocurre un error durante la actualización en la base de datos.
    """
    # Convertimos el modelo Pydantic a un diccionario, excluyendo valores no establecidos
    # y asegurando que HttpUrl se convierta a string si es necesario.
    update_values = profile_data.model_dump(exclude_unset=True)

    # Convertir HttpUrl a string si están presentes
    if 'avatar_url' in update_values and update_values['avatar_url'] is not None:
        update_values['avatar_url'] = str(update_values['avatar_url'])
    if 'website' in update_values and update_values['website'] is not None:
        update_values['website'] = str(update_values['website'])
        
    # Añadir timestamp de actualización si no se provee uno específico (Supabase podría manejarlo automáticamente también)
    if not update_values: # Si no hay nada que actualizar
        # Podríamos devolver el perfil existente o simplemente None/error.
        # Por ahora, busquemos el perfil existente.
        existing_profile = await get_profile_by_id(profile_id)
        return existing_profile

    update_values['updated_at'] = datetime.now() # Asegurarse que la zona horaria sea consistente

    try:
        response = await db.table('profiles').update(update_values).eq('id', str(profile_id)).execute()

        # La respuesta de update puede no contener los datos actualizados directamente de forma útil,
        # o puede devolver una lista. Si la lista devuelta tiene datos, la actualización ocurrió.
        # Es más seguro volver a buscar el perfil para obtener el estado final.
        if response.data:
            updated_profile_data = await get_profile_by_id(profile_id)
            return updated_profile_data
        else:
            # Si response.data está vacío, puede significar que el 'id' no existía.
            return None
    except Exception as e:
        # Loggear el error 'e'
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el perfil en la base de datos."
        ) 
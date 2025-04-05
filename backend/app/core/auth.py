from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, ValidationError
from typing import Optional

from app.core.config import settings # Importamos nuestra configuración

# Esquema Pydantic para validar el payload esperado dentro del JWT de Supabase
# Puedes ajustar esto según lo que necesites del payload
class TokenPayload(BaseModel):
    sub: str # Subject, que es el user_id en Supabase
    aud: str # Audience, debería ser 'authenticated'
    exp: int # Expiration time
    # Puedes añadir otros campos que esperes o necesites, como 'email', 'role', etc.

# Usamos HTTPBearer para extraer automáticamente el token "Bearer ..."
reusable_oauth2 = HTTPBearer(auto_error=False) # auto_error=False para manejar el error nosotros mismos

async def get_current_user(
    token: Optional[HTTPAuthorizationCredentials] = Depends(reusable_oauth2)
) -> dict: # Devolvemos un diccionario con los datos del usuario (al menos el ID)
    """
    Dependencia para obtener el usuario actual verificado a partir de un token JWT.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Decodificar el token usando el secreto JWT de Supabase
        # Supabase usa el algoritmo HS256 por defecto
        payload = jwt.decode(
            token.credentials, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            audience="authenticated" # Validar que el token es para usuarios autenticados
        )
        
        # Validar el contenido del payload con Pydantic
        token_data = TokenPayload(**payload)
        
        # Aquí podrías opcionalmente buscar al usuario en tu BD si necesitaras más datos
        # user = get_user_from_db(token_data.sub)
        # if not user:
        #     raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Por ahora, devolvemos la información básica del token (incluyendo el user_id/sub)
        # Asegurándonos de devolver una estructura similar a la del placeholder (con 'id')
        user_info = {"id": token_data.sub, **payload} # Incluimos 'id' y el resto del payload
        return user_info

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token ha expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTClaimsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error en las claims del token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (JWTError, ValidationError) as e: # Captura errores de JOSE y Pydantic
        print(f"Error de validación JWT o Payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar el token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Captura cualquier otro error inesperado durante la verificación
        print(f"Error inesperado en get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la autenticación",
        ) 
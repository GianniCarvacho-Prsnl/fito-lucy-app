from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
import uuid # Para el tipo de ID

# Modelo base con campos comunes
class PetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la mascota")
    species: str = Field(..., min_length=1, max_length=50, description="Especie de la mascota (ej: Perro, Gato)")
    breed: Optional[str] = Field(None, max_length=50, description="Raza de la mascota")
    birthdate: Optional[date] = Field(None, description="Fecha de nacimiento")
    gender: Optional[str] = Field(None, max_length=20, description="Género (ej: Macho, Hembra)")
    photo_url: Optional[str] = Field(None, description="URL de la foto de la mascota")

    # Permitir valores extra en el modelo (útil si Supabase devuelve más campos)
    class Config:
        extra = "allow"
        # Para validar tipos como UUID y datetime correctamente
        from_attributes = True 

# Modelo para crear una mascota (requiere owner_id)
class PetCreate(PetBase):
    # No incluimos owner_id aquí, se obtendrá del usuario autenticado
    pass 

# Modelo para actualizar una mascota (todos los campos son opcionales)
# Hereda de PetBase pero podemos definirlo explícitamente para claridad
class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre de la mascota")
    species: Optional[str] = Field(None, min_length=1, max_length=50, description="Especie de la mascota (ej: Perro, Gato)")
    breed: Optional[str] = Field(None, max_length=50, description="Raza de la mascota")
    birthdate: Optional[date] = Field(None, description="Fecha de nacimiento")
    gender: Optional[str] = Field(None, max_length=20, description="Género (ej: Macho, Hembra)")
    photo_url: Optional[str] = Field(None, description="URL de la foto de la mascota")

    # Permitir valores extra en el modelo
    class Config:
        extra = "allow"
        from_attributes = True

# Modelo para representar una mascota como viene de la BD (incluye IDs y timestamps)
class PetInDBBase(PetBase):
    id: uuid.UUID # Supabase usa UUID por defecto para IDs
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

# Modelo final para respuestas de la API (puede ser igual a PetInDBBase o añadir/quitar campos)
class Pet(PetInDBBase):
    pass 
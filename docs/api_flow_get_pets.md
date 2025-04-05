# Flujo Detallado: Obtener Mascotas del Usuario (`GET /api/pets/`)

Este documento describe el flujo completo, desde que el usuario interactúa con el frontend hasta que se muestran sus mascotas, utilizando la API backend implementada con FastAPI.

**Contexto Inicial:**

*   Usuario ha iniciado sesión en el Frontend (React) usando Supabase Auth.
*   El Frontend tiene almacenado un token JWT válido para la sesión del usuario.
*   El Backend (FastAPI) está corriendo y configurado con:
    *   Una conexión a Supabase usando la `service_role key`.
    *   El `SUPABASE_JWT_SECRET` correcto para verificar tokens.
    *   RLS (Row Level Security) está **activado** en la tabla `pets` de Supabase, con una política `SELECT` que permite a los usuarios `authenticated` leer filas donde `auth.uid() = owner_id`.

**Flujo Paso a Paso:**

1.  **Frontend - Interacción del Usuario:**
    *   El usuario navega a la página "Mis Mascotas" (o al Dashboard que muestra las mascotas).
    *   El componente React responsable (ej: `PetList.tsx` o `Dashboard.tsx`) se monta o actualiza.

2.  **Frontend - Llamada al Servicio (`useEffect`):**
    *   Dentro de un hook `useEffect`, el componente detecta que necesita cargar las mascotas.
    *   Llama a la función `petService.getPets()` ubicada en `frontend/src/services/petService.ts`.

3.  **Frontend - `petService.getPets()`:**
    *   Esta función asíncrona se ejecuta.
    *   **Obtener Token:** Primero, llama a `supabase.auth.getSession()` para obtener la sesión activa del usuario gestionada por `supabase-js`.
    *   Extrae el `access_token` (JWT) de la sesión. Si no hay sesión o token, lanza un error.
    *   **Preparar Petición:** Construye la URL completa del endpoint backend: `http://localhost:8000/api/pets/` (o la URL configurada en `VITE_API_BASE_URL`).
    *   **Realizar Petición:** Usa la función `fetch` (o `axios`) para realizar una petición `GET` a la URL del backend.
    *   **Añadir Cabecera de Autorización:** **Crucialmente**, añade la cabecera `Authorization` a la petición con el valor `Bearer <tu-jwt-access-token>`.
    *   **Esperar Respuesta:** Espera la respuesta del backend.

4.  **Backend - Recepción de la Petición (FastAPI):**
    *   El servidor Uvicorn recibe la petición `GET` en la ruta `/api/pets/`.
    *   FastAPI dirige la petición a la función `read_pets` definida en `backend/app/routers/pets.py` porque coincide la ruta y el método.

5.  **Backend - Inyección de Dependencias:**
    *   FastAPI analiza los parámetros de `read_pets` que usan `Depends()`:
        *   `db: Client = Depends(get_db)`: Llama a la función `get_db` (en `supabase_client.py`), la cual retorna la instancia global `supabase_client_instance` (que fue inicializada con la `service_role key`). Esta instancia se asigna al parámetro `db`.
        *   `current_user: dict = Depends(get_current_user)`: Llama a la función `get_current_user` (en `auth.py`).

6.  **Backend - Verificación de Autenticación (`get_current_user`):**
    *   La función `get_current_user` se ejecuta:
        *   Usa `HTTPBearer` para extraer el token de la cabecera `Authorization: Bearer ...`. Si no existe, lanza un error `401 Unauthorized`.
        *   Usa la librería `jose.jwt.decode()` para verificar la firma del token usando el `settings.SUPABASE_JWT_SECRET` y el algoritmo `HS256`.
        *   Valida las *claims* estándar como la audiencia (`aud: 'authenticated'`) y la expiración (`exp`). Si alguna validación falla (firma inválida, token expirado, claim incorrecta), lanza un error `401 Unauthorized`.
        *   Si el token es válido, extrae el *payload* (que contiene el `sub` - Subject, que es el `user_id`).
        *   Devuelve un diccionario con la información del usuario (como mínimo `{"id": "user_uuid_del_token"}`).

7.  **Backend - Ejecución del Endpoint (`read_pets`):**
    *   La ejecución de `read_pets` continúa, ahora con la instancia `db` (cliente Supabase con `service_role`) y el diccionario `current_user` (con el ID del usuario validado).
    *   Extrae el `user_id` del diccionario `current_user`.
    *   **Consulta a Supabase:** Ejecuta la consulta: `db.table("pets").select("*").eq("owner_id", str(user_id)).execute()`.
    *   **Interacción con Supabase DB:**
        *   La librería `supabase-py` envía la consulta a la API de Supabase (PostgREST).
        *   Como la conexión se hizo con la `service_role key`, **RLS es omitido** para esta consulta específica. Supabase confía en que el backend ya hizo la validación necesaria.
        *   La base de datos ejecuta la consulta `SELECT * FROM pets WHERE owner_id = 'user_uuid_del_token'`.
        *   La base de datos devuelve las filas que coinciden.
    *   La librería `supabase-py` recibe la respuesta y la devuelve a la función `read_pets` (como un objeto con atributos `data` y `count`).

8.  **Backend - Procesamiento de la Respuesta:**
    *   `read_pets` verifica si hubo errores en la respuesta de Supabase.
    *   Si no hay errores, toma `response.data` (que es una lista de diccionarios, cada uno representando una mascota).
    *   **Validación de Respuesta (Pydantic):** Gracias a `response_model=List[Pet]`, FastAPI automáticamente intenta validar que la estructura de `response.data` coincida con una lista de modelos `Pet`. Si no coincide (ej: falta un campo requerido en `Pet` o el tipo es incorrecto), FastAPI lanzaría un error interno (usualmente 500).
    *   Si la validación es exitosa, FastAPI serializa `response.data` a JSON.
    *   **Envío de Respuesta:** El backend envía una respuesta HTTP `200 OK` con el cuerpo JSON conteniendo la lista de mascotas.

9.  **Frontend - Recepción de la Respuesta (`petService.getPets`):**
    *   La función `fetch` en `petService.getPets()` recibe la respuesta.
    *   Verifica si `response.ok` es `true` (status 2xx). Si no, lanza un error.
    *   Parsea el cuerpo de la respuesta JSON usando `response.json()`.
    *   Devuelve la lista de objetos `Pet` al llamador (el componente React).

10. **Frontend - Actualización de Estado y Renderizado:**
    *   El hook `useEffect` en el componente recibe la lista de mascotas.
    *   Llama a `setPets(petsData)` para actualizar el estado del componente.
    *   React detecta el cambio de estado y vuelve a renderizar el componente, mostrando ahora la lista de mascotas obtenida del backend.

**Fin del Flujo.** 

"Configura un proyecto con la siguiente estructura:

Para el frontend:
- Crea un proyecto React con Vite y Tailwind CSS
- Instala @supabase/supabase-js para la integración con Supabase para login y BBDD
- Configura react-router-dom para la navegación
- Configura una estructura de carpetas organizada (components, pages, hooks, services, utils)

Para el backend:
- Configura un proyecto FastAPI básico
- Instala supabase-py para interactuar con Supabase
- Crea una estructura de carpetas para routers, models y services
- Configura CORS para permitir la comunicación con el frontend

Proporciona también instrucciones sobre cómo configurar las variables de entorno para Supabase en ambos proyectos."


"Genera las instrucciones para configurar Supabase para el proyecto PawTracker:

1. Esquema de la base de datos para las siguientes tablas:
   - users (gestionado por Supabase Auth)
   - pets (id, owner_id, name, species, breed, birthdate, gender, photo_url, created_at)
 
2. Instrucciones para:
   - Configurar Row Level Security (RLS) para que los usuarios solo vean sus propias mascotas
   - Crear las políticas de inserción, actualización y eliminación adecuadas
   - Habilitar autenticación por email en Supabase

3. Código para inicializar el cliente de Supabase en el frontend y backend"



"Desarrolla los componentes de autenticación para el frontend usando Supabase Auth:

1. Componente de Login con email/password
2. Componente de Registro
3. Componente de Recuperación de contraseña
4. Contexto de autenticación (React Context) para gestionar el estado del usuario
5. Rutas protegidas que redirijan a usuarios no autenticados

Crea también un servicio en el backend que:
1. Verifique tokens JWT de Supabase
2. Proporcione endpoints para obtener información del usuario actual"



"Implementa la funcionalidad de gestión de mascotas:

Para el frontend:
1. Página de listado de mascotas del usuario
2. Formulario para añadir una nueva mascota (con validación)
3. Formulario para editar una mascota existente
4. Opción para eliminar mascotas
5. Vista de detalle de mascota que muestre información básica
6. Componente para subir fotos de las mascotas

Para el backend:
1. Endpoints CRUD para gestionar mascotas
2. Middleware de autenticación para verificar el usuario actual
3. Lógica para vincular mascotas al usuario mediante owner_id
4. Funcionalidad para procesar y almacenar imágenes"


"Desarrolla los componentes de interfaz de usuario principales:

1. Layout principal con:
   - Barra de navegación responsiva
   - Sidebar para navegación entre secciones
   - Footer con información básica
   
2. Dashboard inicial que muestre:
   - Resumen de mascotas registradas
   - Tarjetas con información básica de cada mascota
   - Estado de la sesión actual
   
3. Implementa un tema claro/oscuro básico usando Tailwind
4. Añade componentes de feedback (toast, alertas) para informar al usuario sobre el resultado de sus acciones"



"Genera código para probar las funcionalidades implementadas:

1. Pruebas básicas para los componentes de React usando Vitest o Jest
2. Pruebas para los endpoints de la API usando pytest
3. Documentación de la API usando Swagger UI integrado en FastAPI

Crea también un README.md detallado con:
1. Instrucciones de instalación y configuración
2. Descripción de las funcionalidades implementadas
3. Guía para desarrolladores sobre cómo extender el proyecto
4. Próximos pasos planificados para la Fase 2"


Próximos Pasos (Fase 2 - para después)
Para la Fase 2 nos centraremos en:

Gestión de vacunas
Calendario de citas veterinarias
Dashboard con información relevante
Gestión de documentos médicos
Notificaciones y recordatorios
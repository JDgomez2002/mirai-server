## Desarrollo de un servicio y su infraestructura para abastecer un sistema inteligente de orientación vocacional, generación de temarios de estudio a medida y generación de sugerencias de especialización profesional, enfocado a estudiantes graduandos con aspiración a estudiar una licenciatura

### Universidad del Valle de Guatemala

## José Daniel Gómez Cabrera 21429

El presente repositorio presenta el desarrollo del servicio y su infraestructura para abastecer un sistema inteligente de orientación vocacional, generación de temarios de estudio a medida y generación de sugerencias de especialización profesional, enfocado a estudiantes graduandos con aspiración a estudiar una licenciatura.

## Diagrama del prototipo inicial del sistema (Mayo 2025)

![Diagrama del prototipo Mayo 2025](./assets/diagrama.png?raw=true "Diagrama del prototipo Mayo 2025")

## Instrucciones de ejecución

```
npm install
npm run deploy
```

## Rutas del API

El servicio expone las siguientes rutas principales:

### Autenticación

- `/auth`: Endpoints relacionados con la autenticación de usuarios y gestión de sesiones.

### Rutas Protegidas

Las siguientes rutas requieren autenticación mediante token JWT:

- `/user`: Gestión de perfiles de usuario y configuraciones personales.
- `/assessment`: Evaluaciones y pruebas vocacionales.
- `/career`: Información sobre carreras universitarias y programas académicos.
- `/recommendation`: Sistema de recomendaciones personalizadas basadas en el perfil del usuario.
- `/plan`: Generación y gestión de planes de estudio personalizados.

## Modelo de prioridades del prototipo e infraestructura del servicio

```
career-path-api/
├── config/
│   ├── database.js        # Configuración de la base de datos
│   ├── auth.js            # Configuración de autenticación (JWT, etc.)
│   ├── ai-models.js       # Configuración de conexión a modelos de IA
│   └── app.js             # Configuración general de la aplicación
├── middlewares/
│   ├── auth.middleware.js # Middleware de autenticación
│   ├── error.middleware.js # Manejo centralizado de errores
│   ├── logger.middleware.js # Registro de actividad
│   └── validator.middleware.js # Validación de datos de entrada
├── models/
│   ├── user.model.js      # Modelo de usuario
│   ├── assessment.model.js # Modelo para pruebas y evaluaciones
│   ├── career.model.js    # Modelo de carreras universitarias
│   ├── recommendation.model.js # Modelo para recomendaciones
│   └── studyPlan.model.js # Modelo para planes de estudio
├── controllers/
│   ├── auth.controller.js # Controlador de autenticación
│   ├── user.controller.js # Controlador de usuarios
│   ├── assessment.controller.js # Controlador de evaluaciones
│   ├── career.controller.js # Controlador de carreras
│   ├── recommendation.controller.js # Controlador de recomendaciones
│   └── studyPlan.controller.js # Controlador de planes de estudio
├── services/
│   ├── auth.service.js    # Servicio de autenticación
│   ├── user.service.js    # Servicio de usuarios
│   ├── assessment.service.js # Servicio de evaluaciones
│   ├── career.service.js  # Servicio de carreras
│   ├── recommendation.service.js # Servicio de recomendaciones
│   ├── studyPlan.service.js # Servicio de planes de estudio
│   ├── ai.service.js      # Servicio de integración con modelos de IA
│   └── cache.service.js   # Servicio de caché para optimizar respuestas
├── routes/
│   ├── auth.routes.js     # Rutas de autenticación
│   ├── user.routes.js     # Rutas de usuarios
│   ├── assessment.routes.js # Rutas de evaluaciones
│   ├── career.routes.js   # Rutas de carreras
│   ├── recommendation.routes.js # Rutas de recomendaciones
│   └── studyPlan.routes.js # Rutas de planes de estudio
├── utils/
│   ├── logger.js          # Utilidad de registro
│   ├── validators.js      # Funciones de validación
│   ├── security.js        # Utilidades de seguridad
│   └── helpers.js         # Funciones auxiliares
├── tests/
│   ├── unit/              # Tests unitarios
│   ├── integration/       # Tests de integración
│   └── e2e/               # Tests end-to-end
├── .env                   # Variables de entorno
├── .env.example           # Ejemplo de variables de entorno
├── package.json           # Dependencias del proyecto
├── docker-compose.yml     # Configuración de Docker
├── Dockerfile            # Definición de la imagen Docker
└── server.js             # Punto de entrada de la aplicación
```

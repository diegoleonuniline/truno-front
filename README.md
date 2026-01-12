# TRUNO Frontend

Frontend de TRUNO - Sistema de gestión financiera empresarial

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (versión 18 o superior recomendada)
- npm (viene con Node.js)
- Backend de TRUNO corriendo en `http://localhost:3000`

### Instalación

1. Instala las dependencias:
```bash
npm install
```

### Ejecutar en Desarrollo

Para iniciar el servidor de desarrollo local:

```bash
npm start
```

O también puedes usar:

```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:8080**

El servidor se abrirá automáticamente en tu navegador.

### Configuración

El proyecto detecta automáticamente si está en desarrollo o producción:

- **Desarrollo local** (`localhost` o `127.0.0.1`): Se conecta a `http://localhost:3000`
- **Producción**: Se conecta a `https://truno-9bbbe9cf4d78.herokuapp.com`

La configuración está centralizada en `config.js` y se carga automáticamente en todas las páginas.

## 📁 Estructura del Proyecto

```
truno-front/
├── config.js              # Configuración centralizada
├── index.html             # Página principal (redirige a login)
├── login/                 # Módulo de autenticación
├── dashboard/             # Dashboard principal
├── organizaciones/        # Selección de organización
├── configuracion/         # Configuración de usuario
├── catalogos/             # Catálogos (categorías, impuestos, etc.)
├── contactos/             # Gestión de contactos
├── gastos/                # Gestión de gastos
├── ventas/                # Gestión de ventas
├── transacciones/         # Transacciones financieras
├── transferencias/        # Transferencias entre cuentas
└── bancos/                # Gestión de cuentas bancarias
```

## 🔧 Desarrollo

### Scripts Disponibles

- `npm start` o `npm run dev`: Inicia el servidor de desarrollo en puerto 8080
- `npm run serve`: Inicia el servidor sin abrir el navegador automáticamente

### Notas Importantes

- **No abras los archivos HTML directamente** desde el sistema de archivos (file://). Esto causará errores de CORS.
- **Siempre usa el servidor de desarrollo** (`npm start`) para trabajar en el proyecto.
- El backend debe estar corriendo en el puerto 3000 antes de iniciar el frontend.

## 🐛 Solución de Problemas

### Error de CORS

Si ves errores de CORS, asegúrate de:
1. Estar ejecutando el frontend con `npm start` (no abriendo archivos directamente)
2. Que el backend esté corriendo en `http://localhost:3000`
3. Que el backend tenga configurado CORS para permitir `http://localhost:8080`

### El frontend no se conecta al backend

Verifica:
1. Que el backend esté corriendo: `http://localhost:3000`
2. Revisa la consola del navegador para ver los errores
3. Verifica que `config.js` se esté cargando correctamente

## 📝 Credenciales de Prueba

Usuario: `diego.leon@uniline.mx`  
Contraseña: `12345678`

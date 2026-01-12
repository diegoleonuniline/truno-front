# Guía de Despliegue - TRUNO Frontend

## 📋 Resumen de Cambios

Los cambios realizados son **100% compatibles** con el despliegue en GitHub Pages. El código detecta automáticamente el entorno y ajusta las rutas y URLs de la API según corresponda.

## 🔄 Cómo Funciona la Detección Automática

### 1. **Detección del Entorno (Desarrollo vs Producción)**

El archivo `config.js` detecta automáticamente dónde se está ejecutando la aplicación:

```javascript
// Desarrollo Local
hostname === 'localhost' || '127.0.0.1'
→ Usa: http://localhost:3000 (backend local)

// Producción (GitHub Pages)
hostname === 'diegoleonuniline.github.io'
→ Usa: https://truno-9bbbe9cf4d78.herokuapp.com (backend de producción)
```

### 2. **Detección del Base Path (GitHub Pages)**

El código detecta automáticamente si está en GitHub Pages y ajusta las rutas:

```javascript
// En GitHub Pages: /truno-front/login/login.html
// En desarrollo local: /login/login.html
```

## ✅ Compatibilidad

### **En Producción (GitHub Pages)**
- ✅ URL: `https://diegoleonuniline.github.io/truno-front/`
- ✅ Backend: `https://truno-9bbbe9cf4d78.herokuapp.com`
- ✅ Rutas: Se ajustan automáticamente a `/truno-front/...`
- ✅ **Funciona exactamente igual que antes**

### **En Desarrollo Local**
- ✅ URL: `http://localhost:8080`
- ✅ Backend: `http://localhost:3000`
- ✅ Rutas: Rutas relativas normales
- ✅ **Permite trabajar localmente sin problemas**

## 🚀 Despliegue en GitHub Pages

### Pasos para Subir los Cambios

1. **Commit y Push a Git:**
   ```bash
   git add .
   git commit -m "Configuración para desarrollo local y producción"
   git push origin main
   ```

2. **GitHub Pages se actualizará automáticamente**
   - Los cambios estarán disponibles en: `https://diegoleonuniline.github.io/truno-front/`
   - **No necesitas cambiar nada más**

3. **Verificación:**
   - Abre la URL de producción
   - La aplicación debería funcionar exactamente igual que antes
   - El backend seguirá siendo el de Heroku

## 🔍 Qué Cambió y Qué NO Cambió

### ✅ **Lo que SÍ cambió (solo para desarrollo local):**
- Agregado `config.js` para centralizar configuración
- Detección automática de entorno
- Rutas ajustables según el contexto
- Servidor de desarrollo local (`npm start`)

### ✅ **Lo que NO cambió (producción):**
- Las URLs del backend siguen siendo las mismas
- Las funcionalidades son idénticas
- El comportamiento en GitHub Pages es el mismo
- Todas las rutas funcionan igual

## 📝 Archivos Nuevos (No afectan producción)

- `config.js` - Configuración centralizada (se usa en ambos entornos)
- `package.json` - Solo para desarrollo local
- `README.md` - Documentación
- `.gitignore` - Ignora node_modules (no afecta GitHub Pages)

## ⚠️ Importante

**NO necesitas hacer cambios en GitHub Pages.** El código detecta automáticamente:
- Si está en `diegoleonuniline.github.io` → Modo producción
- Si está en `localhost` → Modo desarrollo

**Todo funciona automáticamente sin configuración adicional.**

## 🐛 Si Algo No Funciona en Producción

1. Verifica que `config.js` esté en el repositorio
2. Abre la consola del navegador (F12) en producción
3. Deberías ver que `IS_DEVELOPMENT: false`
4. Verifica que `API_URL` apunte a Heroku
5. Verifica que `BASE_PATH` sea `/truno-front` en producción

## 📞 Resumen

**Sí, puedes subir los cambios a Git sin problemas.** La aplicación seguirá funcionando exactamente igual en GitHub Pages, y además ahora podrás trabajar localmente con `npm start`.

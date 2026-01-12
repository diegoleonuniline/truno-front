/**
 * TRUNO - Configuración Centralizada
 * Detecta automáticamente si está en desarrollo local o producción
 * 
 * Relacionado con: todos los módulos JS del frontend
 */

(function() {
  'use strict';

  // Detectar si estamos en desarrollo local
  // Si la URL es localhost o 127.0.0.1, estamos en desarrollo
  const isDevelopment = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  // Configuración de la API según el entorno
  const API_URL = isDevelopment 
    ? 'http://localhost:3000'  // Backend local
    : 'https://truno-9bbbe9cf4d78.herokuapp.com';  // Backend de producción

  // Detectar el base path automáticamente para GitHub Pages
  // Si estamos en GitHub Pages (diegoleonuniline.github.io/truno-front), 
  // necesitamos incluir /truno-front en las rutas
  // Relacionado con: GitHub Pages deployment
  const getBasePath = () => {
    const pathname = window.location.pathname;
    // Si la ruta contiene /truno-front/, ese es nuestro base path
    if (pathname.includes('/truno-front/')) {
      return '/truno-front';
    }
    // En desarrollo local o si está en la raíz, no hay base path
    return '';
  };

  const BASE_PATH = getBasePath();

  // Función helper para construir rutas que funcionen en ambos entornos
  // Relacionado con: compatibilidad GitHub Pages y desarrollo local
  const route = (path) => {
    // Si la ruta ya empieza con el base path, no duplicar
    if (path.startsWith(BASE_PATH)) {
      return path;
    }
    // Si la ruta empieza con /, agregar base path
    if (path.startsWith('/')) {
      return BASE_PATH + path;
    }
    // Si es relativa, devolverla tal cual
    return path;
  };

  // Configuración global de TRUNO
  window.TRUNO_CONFIG = {
    API_URL: API_URL,
    IS_DEVELOPMENT: isDevelopment,
    BASE_PATH: BASE_PATH,
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user',
      ORG: 'truno_org',
      BIOMETRIC_EMAIL: 'truno_biometric_email'
    },
    REDIRECT: {
      LOGIN: route('/login/login.html'),
      SELECT_ORG: route('/organizaciones/seleccionar.html'),
      SUCCESS: route('/organizaciones/seleccionar.html'),  // Alias para compatibilidad con login.js
      DASHBOARD: route('/dashboard/index.html')
    }
  };

  // Log para debugging (solo en desarrollo)
  if (isDevelopment) {
    console.log('🔧 TRUNO - Modo Desarrollo');
    console.log('📍 API URL:', API_URL);
  }
})();

/**
 * TRUNO - Theme Manager (Modo Día / Modo Noche)
 * Objetivo:
 * - Implementar un switch global de tema para TODO el frontend (todas las páginas).
 *
 * Cómo funciona:
 * - Setea un atributo global en <html>: data-truno-theme="dark|light"
 * - Persiste preferencia en localStorage: "truno_theme"
 * - Inserta (si no existe) un botón toggle de tema en headers comunes o en modo flotante.
 *
 * Relacionado con:
 * - truno-front/theme.css (override de variables CSS para modo "light" + estilos del botón)
 * - Todos los HTML del frontend (se incluye este script en <head> para evitar "flash" de tema)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'truno_theme';
  const THEME_ATTR = 'data-truno-theme';

  /**
   * Normaliza a "light" o "dark".
   * Si no coincide, devuelve null (para que el caller decida fallback).
   */
  function normalizeTheme(value) {
    const v = String(value || '').toLowerCase().trim();
    if (v === 'light' || v === 'dark') return v;
    return null;
  }

  /** Lee el tema guardado por el usuario (si existe). */
  function getStoredTheme() {
    try {
      return normalizeTheme(localStorage.getItem(STORAGE_KEY));
    } catch (_) {
      // En algunos navegadores/escenarios (modo privado estricto), localStorage puede fallar.
      return null;
    }
  }

  /** Guarda el tema elegido por el usuario. */
  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      // noop
    }
  }

  /** Aplica el tema al documento (atributos + meta theme-color). */
  function applyTheme(theme) {
    const t = normalizeTheme(theme) || 'dark';

    // Atributo principal para nuestros overrides (theme.css)
    document.documentElement.setAttribute(THEME_ATTR, t);

    // Compatibilidad con Bootstrap (si alguna página lo usa): activa estilos nativos por data-bs-theme
    // Relacionado con: Bootstrap 5.3+ (si se incorpora en el futuro).
    document.documentElement.setAttribute('data-bs-theme', t);

    // Ajustar color de la barra del navegador (Android/Chrome)
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', t === 'light' ? '#f8fafc' : '#0a0e14');
    }

    return t;
  }

  /** Devuelve el tema actual (si no existe, asume dark). */
  function getTheme() {
    return normalizeTheme(document.documentElement.getAttribute(THEME_ATTR)) || 'dark';
  }

  /**
   * Setea tema con opción de persistir en localStorage.
   * @param {"light"|"dark"} theme
   * @param {{persist?: boolean}} options
   */
  function setTheme(theme, options) {
    const t = applyTheme(theme);
    if (options?.persist) setStoredTheme(t);
    updateToggleAriaLabel();
    return t;
  }

  /** Alterna tema y persiste la selección. */
  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    return setTheme(next, { persist: true });
  }

  /** Actualiza accesibilidad del botón (si existe). */
  function updateToggleAriaLabel() {
    const btn = document.getElementById('trunoThemeToggle');
    if (!btn) return;
    const t = getTheme();
    btn.setAttribute(
      'aria-label',
      t === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'
    );
    btn.setAttribute('title', btn.getAttribute('aria-label'));
  }

  /**
   * Crea el botón toggle.
   * Nota: no depende de Bootstrap; es CSS propio en theme.css.
   */
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'trunoThemeToggle';
    btn.className = 'truno-theme-toggle';
    btn.addEventListener('click', toggleTheme);

    // Íconos inline (SVG) para evitar dependencias.
    // El CSS decide cuál mostrar según data-truno-theme.
    btn.innerHTML = `
      <span class="truno-theme-toggle__icons" aria-hidden="true">
        <svg class="truno-theme-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M4.93 4.93l1.41 1.41"></path>
          <path d="M17.66 17.66l1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M4.93 19.07l1.41-1.41"></path>
          <path d="M17.66 6.34l1.41-1.41"></path>
        </svg>
        <svg class="truno-theme-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </span>
    `.trim();

    updateToggleAriaLabel();
    return btn;
  }

  /**
   * Inserta el toggle en el layout si encuentra un lugar “natural”.
   * Fallback: botón flotante en esquina superior derecha.
   *
   * Relacionado con:
   * - Páginas con header: .header-right (dashboard, bancos, ventas, etc.)
   * - Selección de organización: .org-header
   * - Login: no siempre tiene header-right => se usa fallback flotante
   */
  function ensureThemeToggle() {
    if (document.getElementById('trunoThemeToggle')) return;

    const btn = createToggleButton();

    // Caso 1: Header principal (dashboard/menú)
    const headerRight = document.querySelector('.header .header-right');
    if (headerRight) {
      headerRight.insertBefore(btn, headerRight.firstChild);
      return;
    }

    // Caso 2: Header de organizaciones
    const orgHeader = document.querySelector('.org-header');
    if (orgHeader) {
      // Si hay user-menu a la derecha, insertamos antes para mantener el diseño.
      const userMenu = orgHeader.querySelector('.user-menu');
      if (userMenu && userMenu.parentElement === orgHeader) {
        orgHeader.insertBefore(btn, userMenu);
      } else {
        orgHeader.appendChild(btn);
      }
      return;
    }

    // Caso 3: Fallback flotante (garantiza “todas las páginas”)
    btn.classList.add('truno-theme-toggle--floating');
    document.body.appendChild(btn);
  }

  // ========== INIT ==========
  // IMPORTANTE: aplicar tema lo antes posible (este script se incluye en <head>)
  // Fallback conservador: mantener el comportamiento actual (oscuro por defecto).
  const initialTheme = getStoredTheme() || 'dark';
  applyTheme(initialTheme);

  // Insertar el botón una vez haya DOM (evita errores si corre en <head>)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureThemeToggle);
  } else {
    ensureThemeToggle();
  }

  // Exponer API pública para otros módulos (si lo necesitan)
  // Relacionado con: cualquier módulo JS que quiera leer/cambiar tema.
  window.TRUNO_THEME = {
    getTheme,
    setTheme: (t) => setTheme(t, { persist: true }),
    applyTheme,
    toggleTheme,
    storageKey: STORAGE_KEY
  };
})();


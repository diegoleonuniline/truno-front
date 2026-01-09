/**
 * TRUNO - Login SIMPLE (Debug)
 */

(function() {
  'use strict';

  const API_URL = 'https://truno-9bbbe9cf4d78.herokuapp.com';

  // Esperar a que cargue el DOM
  document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 Login SIMPLE cargado');
    console.log('📍 Origin:', window.location.origin);
    console.log('📍 URL:', window.location.href);
    
    // Verificar si ya hay sesión
    const existingToken = localStorage.getItem('truno_token');
    console.log('🔑 Token existente:', existingToken ? 'SÍ' : 'NO');
    
    if (existingToken) {
      console.log('➡️ Ya hay token, redirigiendo...');
      window.location.href = '/truno-front/organizaciones/seleccionar.html';
      return;
    }

    // Elementos
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const errorDiv = document.getElementById('formError');
    const errorMsg = document.getElementById('errorMessage');
    const passwordToggle = document.getElementById('passwordToggle');
    const faceIdBtn = document.getElementById('faceIdBtn');

    // Ocultar Face ID por ahora
    if (faceIdBtn) faceIdBtn.style.display = 'none';

    // Toggle password
    if (passwordToggle) {
      passwordToggle.addEventListener('click', function() {
        password.type = password.type === 'password' ? 'text' : 'password';
      });
    }

    // Submit
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const correo = email.value.trim();
      const contrasena = password.value;

      console.log('========== SUBMIT ==========');
      console.log('Correo:', correo);
      console.log('Password length:', contrasena.length);

      if (!correo || !contrasena) {
        errorMsg.textContent = 'Completa todos los campos';
        errorDiv.classList.add('visible');
        return;
      }

      // Loading
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      errorDiv.classList.remove('visible');

      try {
        console.log('📡 Llamando API...');
        
        const response = await fetch(API_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, contrasena })
        });

        console.log('📥 Status:', response.status);
        
        const data = await response.json();
        console.log('📥 Data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Error de login');
        }

        // GUARDAR EN LOCALSTORAGE
        console.log('💾 Guardando en localStorage...');
        console.log('💾 Token a guardar:', data.token ? data.token.substring(0, 30) + '...' : 'VACÍO');
        
        try {
          localStorage.setItem('truno_token', data.token);
          localStorage.setItem('truno_user', JSON.stringify(data.usuario));
          console.log('✅ localStorage.setItem ejecutado');
        } catch (storageError) {
          console.error('❌ ERROR en localStorage:', storageError);
          alert('Error guardando sesión: ' + storageError.message);
          return;
        }

        // VERIFICAR QUE SE GUARDÓ
        const savedToken = localStorage.getItem('truno_token');
        const savedUser = localStorage.getItem('truno_user');
        
        console.log('🔍 Verificación:');
        console.log('   Token guardado:', savedToken ? 'SÍ (' + savedToken.substring(0, 20) + '...)' : 'NO');
        console.log('   User guardado:', savedUser ? 'SÍ' : 'NO');

        if (!savedToken) {
          alert('ERROR: El token no se guardó en localStorage. Puede ser un problema del navegador.');
          console.error('❌ TOKEN NO SE GUARDÓ');
          return;
        }

        // REDIRIGIR
        console.log('✅ Todo OK, redirigiendo en 1 segundo...');
        
        setTimeout(function() {
          console.log('🚀 Redirigiendo ahora...');
          window.location.href = '/truno-front/organizaciones/seleccionar.html';
        }, 1000);

      } catch (error) {
        console.error('❌ Error:', error);
        errorMsg.textContent = error.message;
        errorDiv.classList.add('visible');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });

  });

})();

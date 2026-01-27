# Manual de instalación de DavaraGovernance

## 1. Introducción
DavaraGovernance es una plataforma de gobernanza y privacidad de datos compuesta por un backend Node.js/Express desplegado en Docker, un frontend generado con Next.js y un cliente de escritorio empaquetado con Electron.【F:app/package.json†L4-L24】【F:main/main.js†L2-L120】 Este manual describe el despliegue on-premise recomendado para operar todos los componentes dentro de la red del cliente.

## 2. Arquitectura y componentes
- **Servicio interno (Docker):** expone la API y los recursos estáticos de la aplicación, sirviendo los artefactos exportados de Next.js y gestionando la sesión del cliente Electron.【F:main/main.js†L19-L120】  
- **Aplicación web/Electron:** se construye con los scripts `next build`, `next export` y `electron:prod`, generando un paquete que consume el servicio interno mediante HTTP/HTTPS.【F:app/package.json†L8-L24】  
- **Persistencia:** los datos operativos (usuarios, bitácoras, configuraciones) se guardan en volúmenes de Docker o servicios gestionados por el cliente.

## 3. Requisitos previos
1. Servidor físico o virtual dentro de la red interna con soporte para Docker y, opcionalmente, Docker Compose.  
2. Acceso administrativo al servidor para crear volúmenes persistentes y configurar certificados TLS locales.  
3. Estaciones de trabajo Windows o macOS para instalar el cliente Electron empaquetado.  
4. Opcional: entorno de compilación con Node.js 22+ y PNPM/NPM para regenerar la imagen desde la fuente usando los scripts definidos.【F:app/package.json†L8-L16】

## 4. Preparación de la infraestructura
1. **Endurecimiento del servidor:** aplicar parches de seguridad, restringir el acceso SSH y definir políticas de contraseñas.  
2. **Red interna:** reservar una dirección IP estática (ej. `10.0.0.15`) y abrir el puerto de servicio (por defecto 4000) únicamente para la intranet.  
3. **DNS interno:** crear un registro tipo A (ej. `davara.local`) que resuelva a la IP del contenedor para facilitar la configuración del cliente.  
4. **Certificados:** si se usará HTTPS interno, generar certificados de la autoridad corporativa e instalarlos en el servidor.

## 5. Despliegue con Docker
1. Solicitar al proveedor la imagen oficial o el archivo `docker-compose.yml`.  
2. Crear un directorio `/opt/davara` y definir los volúmenes persistentes:
   ```bash
   mkdir -p /opt/davara/{data,logs,config}
   ```
3. Preparar un archivo `.env` con variables de entorno (puerto de servicio, rutas de certificados, credenciales iniciales).  
4. Ejecutar el contenedor, montando los volúmenes y exponiendo el puerto interno:
   ```bash
   docker run -d \
     --name davara-governance \
     -p 4000:4000 \
     -v /opt/davara/data:/app/data \
     -v /opt/davara/logs:/app/logs \
     -v /opt/davara/config:/app/config \
     --env-file /opt/davara/.env \
     registry.local/davara-governance:latest
   ```
5. Validar que la API responda en `http://10.0.0.15:4000/` y que los volúmenes contengan la estructura de datos esperada.

### 5.1 Ejemplo con Docker Compose
```yaml
services:
  davara:
    image: registry.local/davara-governance:latest
    restart: unless-stopped
    ports:
      - "4000:4000"
    env_file:
      - ./config/.env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config/certs:/app/certs
```
Después de guardar el archivo, ejecutar `docker compose up -d`.

## 6. Gestión de actualizaciones
1. **Backend:** cuando el proveedor libere una imagen nueva, descargarla y reiniciar el contenedor manteniendo los volúmenes.  
2. **Cliente Electron:** distribuir el instalador actualizado a los equipos finales; el empaquetado se realiza con `electron-builder` según la configuración del proyecto.【F:app/package.json†L18-L34】  
3. Registrar cada actualización en el libro de cambios interno del cliente.

## 7. Instalación del cliente de escritorio
1. Descargar el instalador proporcionado por el proveedor (Windows `.exe`/`.msi` o macOS `.pkg`).  
2. Durante la primera ejecución, indicar la URL del servicio interno (ej. `https://davara.local:4000`).  
3. Confirmar que el cliente carga el frontend servido por el contenedor; el proceso Electron abrirá una ventana que consume la URL configurada.【F:main/main.js†L81-L120】  
4. Realizar pruebas de inicio de sesión y navegación básica para garantizar la conectividad.

## 8. Validaciones posteriores
- Ejecutar los flujos de autenticación y aprobación de usuarios desde el panel de control para verificar la persistencia.【F:app/app/dashboard/page.tsx†L26-L180】  
- Probar la carga de formularios clave (Derechos ARCO, Incidentes, Avisos de Privacidad) para confirmar que los datos se almacenan en los volúmenes mapeados.【F:app/app/arco-rights/components/arco-management.tsx†L42-L167】【F:app/app/incidents-breaches/page.tsx†L1-L120】【F:app/app/privacy-notices/page.tsx†L1-L78】

## 9. Respaldo y recuperación
1. Programar respaldos periódicos de los volúmenes `/opt/davara/data` y `/opt/davara/config`.  
2. Documentar el procedimiento de restauración: detener el contenedor, restaurar los archivos y reiniciar.  
3. Validar el plan de recuperación al menos dos veces al año.

## 10. Checklist de entrega
- [ ] Servidor Docker endurecido y con monitoreo.  
- [ ] Contenedor DavaraGovernance operativo.  
- [ ] Volúmenes persistentes configurados y respaldados.  
- [ ] Cliente Electron instalado en todos los equipos necesarios.  
- [ ] Documentación interna actualizada con credenciales y responsables.

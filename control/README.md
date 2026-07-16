# PocketPiano Control Web

Aplicación web progresiva para Chrome en Android que reproduce las funciones BLE recuperadas de la APK `Application-debug.apk`.

## Funciones

- Conexión BLE mediante Nordic UART.
- Desbloqueo inicial `00 EF 20 00 00 00`.
- Selección de 7 módulos.
- Solicitud de número de serie y firmware.
- Lectura y escritura de 9 niveles de velocity para teclas blancas y negras.
- Lectura y escritura de offsets de 12 teclas por módulo.
- Consola de tráfico hexadecimal.
- Modo simulación sin hardware.
- PWA instalable y funcionamiento offline de la interfaz.

## Uso en Android

1. Abre la URL publicada con Google Chrome.
2. Activa Bluetooth.
3. Pulsa **Conectar piano**.
4. Selecciona el PocketPiano en el diálogo de Chrome.
5. Opcionalmente, usa **Añadir a pantalla de inicio** para instalar la PWA.

Web Bluetooth exige HTTPS o localhost. Abrir el archivo con `file://` no permite conectar con el piano.

## Desarrollo local

```bash
python -m http.server 8080
```

Abre `http://localhost:8080/control/`.

## Validación pendiente

El protocolo se ha reconstruido del código decompilado. Antes de usar cambios masivos, deben validarse con un PocketPiano real la interpretación exacta de las respuestas de número de serie, firmware y los rangos aceptados por cada parámetro.

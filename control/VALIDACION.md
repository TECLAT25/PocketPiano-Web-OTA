# Plan de validación con PocketPiano real

1. Abrir la web por HTTPS en Chrome Android.
2. Activar Bluetooth y pulsar **Conectar piano**.
3. Confirmar que aparece un dispositivo que anuncia el servicio Nordic UART.
4. Verificar en Consola el envío de `00 EF 20 00 00 00`.
5. Seleccionar módulo 1 y pulsar **Leer datos**.
6. Copiar las respuestas RX de la consola para ajustar el decodificador de serie y firmware.
7. Pulsar **Leer** en Velocity y comparar los 18 valores con la APK original.
8. Cambiar un solo valor, guardar, volver a leer y confirmar persistencia.
9. Repetir la prueba con un offset pequeño en una tecla.
10. No realizar cambios masivos hasta confirmar los rangos aceptados por el firmware.

# Instrucciones para el Entorno de Desarrollo

## Problema de Dependencias con AG Grid y React 19

Este proyecto utiliza React 19 y la librería `ag-grid-react`. La versión `^31.0.0` de AG Grid es funcionalmente compatible con React 19, pero los autores no han actualizado su declaración de `peerDependencies` en el archivo `package.json` de la librería.

Esto causa que el comando `npm install` falle con un error `ERESOLVE`.

### Solución

Para instalar las dependencias correctamente, se debe utilizar la opción `--legacy-peer-deps`. Esta opción le indica a NPM que ignore el conflicto de dependencias de pares, lo cual es seguro en este caso.

**El comando correcto para instalar las dependencias es:**

```bash
npm install --legacy-peer-deps
```

Después de ejecutar este comando, el proyecto se puede iniciar (`npm run dev`) y compilar (`npm run build`) sin problemas.

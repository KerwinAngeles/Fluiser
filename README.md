# Molde — Template Vue 3 Frontend

Template base para iniciar proyectos frontend sin configurar desde cero.

## Stack

| Herramienta | Versión |
|---|---|
| [Vue 3](https://vuejs.org/) | `^3.5` |
| [Vite](https://vitejs.dev/) | `^6` |
| [TypeScript](https://www.typescriptlang.org/) | `^5` |
| [Tailwind CSS v4](https://tailwindcss.com/) | `^4` |
| [Vue Router](https://router.vuejs.org/) | `^4` |
| [Pinia](https://pinia.vuejs.org/) | `^2` |
| [Axios](https://axios-http.com/) | `^1` |
| [Vitest](https://vitest.dev/) | `^3` |
| [ESLint](https://eslint.org/) | `^9` |
| [Prettier](https://prettier.io/) | `^3` |

---

## Cómo usar este template

### 1. Clonar con el nombre de tu proyecto

```bash
git clone https://github.com/tu-usuario/molde  nombre-de-tu-app
cd nombre-de-tu-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Inicializar el nombre del proyecto

Este comando actualiza `package.json` e `index.html` con el nombre que elijas:

```bash
npm run init
```

```
¿Nombre del proyecto? nombre-de-tu-app
✓  package.json  →  name: "nombre-de-tu-app"
✓  index.html    →  <title>nombre-de-tu-app</title>
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=https://api.tu-dominio.com
```

### 5. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run init` | Renombra el proyecto (correr una vez al clonar) |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar el build |
| `npm run test` | Tests con Vitest |
| `npm run coverage` | Reporte de cobertura |
| `npm run lint` | Verificar errores de ESLint |
| `npm run format` | Formatear código con Prettier |
| `npm run type-check` | Verificar tipos TypeScript |

---

## Estructura del proyecto

```
src/
├── assets/         # CSS global (Tailwind)
├── components/     # Componentes reutilizables
├── composables/    # Composables personalizados
├── layouts/        # Layouts de página (DefaultLayout.vue)
├── router/         # Configuración de rutas
├── services/       # Axios (api.ts con interceptors listos)
├── stores/         # Stores de Pinia
├── types/          # Tipos e interfaces TypeScript
├── views/          # Vistas (páginas)
└── __tests__/      # Tests unitarios
```

## Notas de configuración

- **Alias `@/`** — apunta a `src/`. Úsalo en imports: `import Foo from '@/components/Foo.vue'`
- **Tailwind v4** — no requiere `tailwind.config.js`. Se configura vía CSS en `src/assets/main.css`
- **Variables de entorno** — todas deben empezar con `VITE_` para ser accesibles en el cliente
- **Axios** — la instancia preconfigurada está en `src/services/api.ts`. Descomenta las líneas del interceptor para agregar el token de autenticación

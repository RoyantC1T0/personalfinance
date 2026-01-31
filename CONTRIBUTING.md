# Guía de Contribución

¡Gracias por tu interés en contribuir a Personal Finance! 🎉

Este documento proporciona las pautas y mejores prácticas para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
- [Estilo de Código](#estilo-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)

## Código de Conducta

Este proyecto sigue nuestro [Código de Conducta](CODE_OF_CONDUCT.md). Al participar, se espera que respetes este código.

## ¿Cómo puedo contribuir?

### 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un [Issue](../../issues/new) incluyendo:

1. **Descripción clara** del problema
2. **Pasos para reproducir** el bug
3. **Comportamiento esperado** vs **comportamiento actual**
4. **Screenshots** si aplica
5. **Información del entorno** (navegador, sistema operativo, etc.)

### 💡 Sugerir Mejoras

¿Tienes una idea para mejorar el proyecto? ¡Nos encantaría escucharla!

1. Primero, revisa los [Issues existentes](../../issues) para asegurarte de que no se haya sugerido antes
2. Abre un nuevo Issue con la etiqueta `enhancement`
3. Describe claramente tu propuesta y el problema que resuelve

### 🔧 Contribuir Código

1. Revisa los Issues abiertos o crea uno nuevo
2. Comenta en el Issue que deseas trabajar en él
3. Espera la confirmación de un mantenedor
4. Sigue el flujo de trabajo descrito abajo

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js 18.x o superior
- pnpm 8.x o superior
- PostgreSQL (o cuenta de Supabase)

### Instalación

```bash
# Clona el repositorio
git clone https://github.com/Fransaya/personalfinance.git
cd personalfinance

# Instala las dependencias
pnpm install

# Copia el archivo de variables de entorno
cp .env.example .env.local

# Configura tus variables de entorno en .env.local
# (Ver .env.example para las variables requeridas)

# Ejecuta las migraciones de base de datos
# (instrucciones específicas según tu setup)

# Inicia el servidor de desarrollo
pnpm dev
```

El servidor estará disponible en `http://localhost:3000`

## Flujo de Trabajo con Git

### Ramas

- `main` - Rama de producción, siempre estable
- `feature/*` - Para nuevas funcionalidades
- `fix/*` - Para corrección de bugs
- `docs/*` - Para documentación

### Proceso

1. **Fork** el repositorio
2. **Clona** tu fork localmente
3. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```
4. **Realiza tus cambios** siguiendo las guías de estilo
5. **Commit** tus cambios con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar filtro de transacciones por fecha"
   ```
6. **Push** tu rama:
   ```bash
   git push origin feature/mi-nueva-funcionalidad
   ```
7. **Abre un Pull Request**

### Convención de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formateo, sin cambios de código
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento

Ejemplos:

```
feat: agregar gráfico de gastos mensuales
fix: corregir cálculo de balance total
docs: actualizar instrucciones de instalación
```

## Estilo de Código

### TypeScript/JavaScript

- Usamos ESLint para mantener consistencia
- Ejecuta `pnpm lint` antes de hacer commit
- Usa TypeScript para todo código nuevo
- Prefiere interfaces sobre types cuando sea posible

### CSS

- Usamos Tailwind CSS para estilos
- Sigue el orden recomendado de clases
- Evita estilos inline cuando sea posible

### Estructura de Componentes

```tsx
// Imports
import { useState } from "react";

// Types/Interfaces
interface Props {
  title: string;
}

// Component
export function MyComponent({ title }: Props) {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {};

  // Render
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

## Proceso de Pull Request

### Antes de Enviar

- [ ] El código sigue las guías de estilo
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm build` completa exitosamente
- [ ] Los commits siguen la convención establecida
- [ ] La documentación está actualizada si es necesario

### Review

1. Un mantenedor revisará tu PR
2. Puede que se soliciten cambios
3. Responde a los comentarios y realiza los ajustes necesarios
4. Una vez aprobado, se hará merge a `main`

### Tips

- Mantén los PRs pequeños y enfocados
- Un PR = Una funcionalidad o fix
- Incluye screenshots para cambios visuales
- Describe claramente qué cambios hiciste y por qué

---

## ❓ ¿Preguntas?

Si tienes alguna pregunta, no dudes en:

1. Abrir un Issue con la etiqueta `question`
2. Revisar la documentación existente
3. Contactar a los mantenedores

¡Gracias por contribuir! 🚀

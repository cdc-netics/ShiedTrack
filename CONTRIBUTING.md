# Contributing to ShieldTrack

## 🤝 Bienvenido

Gracias por tu interés en contribuir a ShieldTrack. Este documento proporciona pautas para contribuir al proyecto.

## 📋 Código de Conducta

- Sé respetuoso con otros colaboradores
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto y la comunidad

## 🐛 Reportar Bugs

Antes de crear un issue:

1. Verifica que el bug no esté ya reportado en `ISSUES.md`
2. Asegúrate de tener la última versión del código
3. Verifica que no sea un problema de configuración local

Al crear un issue incluye:

- **Descripción clara** del problema
- **Pasos para reproducir** el bug
- **Comportamiento esperado** vs actual
- **Screenshots** si aplica
- **Versión** de Node.js, npm, MongoDB
- **Sistema operativo**

## ✨ Proponer Funcionalidades

Para proponer nuevas funcionalidades:

1. Revisa el roadmap en `ISSUES.md`
2. Abre un issue con etiqueta `enhancement`
3. Describe el problema que resuelve
4. Propón una solución técnica
5. Espera feedback antes de comenzar a programar

## 🔧 Setup de Desarrollo

```bash
# Fork del repositorio
# Clonar tu fork
git clone https://github.com/TU_USUARIO/ShieldTrack.git
cd ShieldTrack

# Agregar upstream
git remote add upstream https://github.com/OWNER_ORIGINAL/ShieldTrack.git

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Crear rama para tu feature
git checkout -b feature/mi-nueva-funcionalidad
```

## 📝 Guía de Estilo

### Backend (NestJS)

```typescript
// ✅ BIEN: Comentarios en español explicativos
/**
 * Crea un nuevo proyecto y asocia hallazgos iniciales
 * Valida que el cliente exista antes de crear el proyecto
 */
async createProject(dto: CreateProjectDto): Promise<Project> {
  // Verificar existencia del cliente
  const client = await this.clientModel.findById(dto.clientId);
  if (!client) {
    throw new NotFoundException('Cliente no encontrado');
  }
  
  return this.projectModel.create(dto);
}

// ❌ MAL: Sin comentarios o en inglés
async createProject(dto: CreateProjectDto): Promise<Project> {
  return this.projectModel.create(dto);
}
```

**Convenciones:**
- Nombres de variables/funciones en **inglés**
- Comentarios y logs en **español**
- Usar DTOs con validaciones de `class-validator`
- Inyectar dependencias por constructor
- Usar Logger de NestJS, no `console.log`

### Frontend (Angular)

```typescript
// ✅ BIEN: Signals para estado reactivo
export class ProjectListComponent {
  projects = signal<Project[]>([]);
  loading = signal<boolean>(false);
  
  constructor(private http: HttpClient) {
    this.loadProjects();
  }
  
  /**
   * Carga la lista de proyectos activos del usuario
   * Filtra por área si el usuario es ANALYST
   */
  loadProjects(): void {
    this.loading.set(true);
    this.http.get<Project[]>('/api/projects')
      .subscribe({
        next: (data) => {
          this.projects.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.snackBar.open('Error cargando proyectos', 'Cerrar');
          this.loading.set(false);
        }
      });
  }
}

// ❌ MAL: Sin signals, sin manejo de errores
export class ProjectListComponent {
  projects: Project[];
  
  ngOnInit() {
    this.http.get('/api/projects').subscribe(data => {
      this.projects = data;
    });
  }
}
```

**Convenciones:**
- Usar **Standalone Components**
- Preferir **Signals** sobre BehaviorSubject para estado
- Usar **Angular Material** para UI
- Responsive a partir de 1366px (desktop-first)
- Manejo de errores con SnackBar

## 🧪 Testing

### Antes de hacer commit:

```bash
# Backend: Verificar que compile
cd backend
npm run build

# Frontend: Verificar que compile
cd frontend
npm run build

# Verificar errores de lint (si tienes configurado)
npm run lint
```

### Testing manual:

Sigue la guía en `docs/TESTING-GUIDE.md` para validar tu funcionalidad.

## 📤 Pull Request Process

1. **Actualiza tu rama** con upstream antes de crear PR:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Commits descriptivos**:
   ```bash
   # ✅ BIEN
   git commit -m "feat: agregar filtro por área en lista de proyectos"
   git commit -m "fix: corregir conteo de proyectos en cliente"
   
   # ❌ MAL
   git commit -m "cambios"
   git commit -m "wip"
   ```

3. **Formato de commits** (opcional pero recomendado):
   - `feat:` Nueva funcionalidad
   - `fix:` Corrección de bug
   - `docs:` Documentación
   - `style:` Formato (sin cambios de lógica)
   - `refactor:` Refactorización
   - `test:` Tests
   - `chore:` Mantenimiento

4. **PR Template**:
   ```markdown
   ## Descripción
   Breve descripción de los cambios
   
   ## Tipo de cambio
   - [ ] Bug fix
   - [ ] Nueva funcionalidad
   - [ ] Breaking change
   - [ ] Documentación
   
   ## Checklist
   - [ ] Mi código sigue el estilo del proyecto
   - [ ] He comentado mi código (en español)
   - [ ] He actualizado la documentación
   - [ ] He probado mi código localmente
   - [ ] No introduce errores de compilación
   
   ## Screenshots (si aplica)
   
   ## Issues relacionados
   Closes #123
   ```

5. **Espera revisión** antes de hacer merge

## 🚫 Qué NO incluir en commits

- ❌ `node_modules/`
- ❌ `.env` o archivos con credenciales
- ❌ Archivos de builds (`dist/`, `build/`)
- ❌ Archivos de IDE (`.vscode/`, `.idea/`)
- ❌ Uploads o evidencias (`uploads/`)
- ❌ Logs (`*.log`)
- ❌ Scripts personalizados locales

Revisa `.gitignore` antes de hacer commit.

## 📊 Estructura de Ramas

```
main (producción)
  ├── develop (desarrollo)
  │   ├── feature/nueva-funcionalidad
  │   ├── fix/correccion-bug
  │   └── refactor/mejora-codigo
  └── hotfix/problema-critico
```

- `main`: Código estable para producción
- `develop`: Integración de features
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones
- `hotfix/*`: Problemas críticos en producción

## 🔍 Code Review

Los revisores evaluarán:

- ✅ **Funcionalidad**: ¿Resuelve el problema?
- ✅ **Código limpio**: ¿Es legible y mantenible?
- ✅ **Performance**: ¿Afecta el rendimiento?
- ✅ **Seguridad**: ¿Introduce vulnerabilidades?
- ✅ **Tests**: ¿Está probado?
- ✅ **Documentación**: ¿Está documentado?

## 📚 Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## ❓ Preguntas

Si tienes dudas:

1. Revisa la documentación en `docs/`
2. Busca en issues cerrados
3. Crea un issue con etiqueta `question`

## 🎉 Reconocimientos

Todos los colaboradores serán reconocidos en el README principal.

---

**¡Gracias por contribuir a ShieldTrack!** 🚀

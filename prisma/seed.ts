import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL no está configurada en las variables de entorno',
  );
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  {
    name: 'SUPERADMIN',
    description: 'Superadministrador con acceso total a la plataforma',
  },
  {
    name: 'DOCENTE',
    description: 'Docente con permisos para gestionar cursos y alumnos',
  },
  {
    name: 'USER',
    description: 'Usuario estándar del sistema',
  },
];

const ACHIEVEMENTS = [
  {
    name: 'Docker Novato',
    icon: 'Container',
    color: '#0db7ed',
    estado: true,
    orden: 1,
  },
  {
    name: 'Explorador Cloud',
    icon: 'Cloud',
    color: '#38bdf8',
    estado: true,
    orden: 2,
  },
  {
    name: 'Terraform Básico',
    icon: 'Boxes',
    color: '#a855f7',
    estado: true,
    orden: 3,
  },
  {
    name: 'CI/CD Iniciado',
    icon: 'GitMerge',
    color: '#10B981',
    estado: true,
    orden: 4,
  },
  {
    name: 'Primer Deploy',
    icon: 'Rocket',
    color: '#f97316',
    estado: true,
    orden: 5,
  },
  {
    name: 'Guardián del Repo',
    icon: 'ShieldCheck',
    color: '#22c55e',
    estado: true,
    orden: 6,
  },
  {
    name: 'Arquitecto de Redes',
    icon: 'Network',
    color: '#6366f1',
    estado: true,
    orden: 7,
  },
  {
    name: 'Master de Ramas',
    icon: 'GitBranch',
    color: '#ec4899',
    estado: true,
    orden: 8,
  },
  {
    name: 'Rey del Pipeline',
    icon: 'Workflow',
    color: '#f59e0b',
    estado: true,
    orden: 9,
  },
  {
    name: 'Leyenda DevOps',
    icon: 'Trophy',
    color: '#eab308',
    estado: true,
    orden: 10,
  },
];

interface CourseSeedDefinition {
  title: string;
  category: string;
  level: string;
  duration: string;
  rating: number;
  imageUrl: string;
  instructorEmail: 'docente@deployapp.com' | 'docente2@deployapp.com';
  features: string[];
  description: string;
  modules: Array<{
    title: string;
    lessons: string[];
  }>;
  practicalTitle: string;
  practicalInstructions: string;
  practicalRubric: string;
  practicalPdfName: string;
  questions: Array<{
    text: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
}

const COURSES_30_DATA: CourseSeedDefinition[] = [
  // 1. Docker Producción
  {
    title: 'Docker & Contenedores: De Cero a Experto en Producción',
    category: 'Docker',
    level: 'Principiante',
    duration: '18h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Docker Engine & CLI completo',
      'Imágenes y Dockerfiles multi-stage',
      'Networking bridge y volúmenes persistentes',
      'Certificación práctica con proyecto real',
    ],
    description:
      'Aprende a empaquetar, distribuir y ejecutar aplicaciones con Docker, Docker Compose y optimización de contenedores en entornos reales de producción.',
    modules: [
      {
        title:
          'Módulo 1: Fundamentos de Contenedores y Arquitectura de Docker Engine',
        lessons: [
          '¿Qué es un contenedor y por qué reemplaza máquinas virtuales?',
          'Instalación y configuración del Docker Daemon en Linux y Mac',
          'Ciclo de vida del contenedor: run, stop, exec, inspect y logs',
        ],
      },
      {
        title:
          'Módulo 2: Creación de Imágenes Eficientes y Dockerfile Multi-Stage',
        lessons: [
          'Estructura de un Dockerfile y orden óptimo de capas',
          'Compilación multi-etapa para reducir el peso de las imágenes',
          'Buenas prácticas de seguridad y usuarios no-root en contenedores',
        ],
      },
      {
        title: 'Módulo 3: Redes en Docker, Puertos y Aislamiento de Servicios',
        lessons: [
          'Controladores de red: bridge, host, overlay y none',
          'Mapeo y publicación de puertos para acceso externo',
          'DNS interno de Docker y comunicación entre contenedores por nombre',
        ],
      },
      {
        title: 'Módulo 4: Persistencia de Datos, Volúmenes y Bind Mounts',
        lessons: [
          'Diferencias críticas entre Named Volumes y Bind Mounts',
          'Persistencia de datos en bases de datos PostgreSQL y MySQL',
          'Estrategias de respaldo y restauración de volúmenes Docker',
        ],
      },
      {
        title:
          'Módulo 5: Despliegue en Producción, Healthchecks y Docker Compose',
        lessons: [
          'Configuración de HEALTHCHECK para contenedores resilientes',
          'Orquestación de servicios locales con Docker Compose',
          'Manejo de secretos y variables de entorno en producción',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de API Node.js y Base de Datos en Docker',
    practicalInstructions:
      '1. Desarrolla un Dockerfile optimizado multi-stage para un API REST.\n2. Conecta la app con PostgreSQL usando una red bridge dedicada y volumen para persistencia de datos.\n3. Configura healthcheck en el contenedor y ejecuta pruebas con curl.\n4. Documenta con capturas de pantalla la salida de docker ps, docker logs y la respuesta HTTP 200.',
    practicalRubric:
      '1. Dockerfile y optimización de capas (40%)\n2. Persistencia y aislamiento de red (30%)\n3. Reporte PDF con evidencias y healthcheck (30%)',
    practicalPdfName: 'Caso_Practico_Docker_Produccion.pdf',
    questions: [
      {
        text: '¿Cuál instrucción en un Dockerfile define el ejecutable principal inmutable del contenedor?',
        options: [
          { text: 'ENTRYPOINT', isCorrect: true },
          { text: 'RUN', isCorrect: false },
          { text: 'EXPOSE', isCorrect: false },
        ],
      },
      {
        text: '¿Para qué sirve una compilación multi-stage (multi-etapa) en Docker?',
        options: [
          {
            text: 'Para reducir radicalmente el tamaño final de la imagen descartando herramientas de compilación',
            isCorrect: true,
          },
          {
            text: 'Para ejecutar múltiples contenedores al mismo tiempo',
            isCorrect: false,
          },
          {
            text: 'Para crear múltiples usuarios en el sistema operativo host',
            isCorrect: false,
          },
        ],
      },
      {
        text: '¿Qué comando permite inspeccionar la salida en vivo de un contenedor en ejecución?',
        options: [
          { text: 'docker logs -f <container_id>', isCorrect: true },
          { text: 'docker inspect --live <container_id>', isCorrect: false },
          { text: 'docker status <container_id>', isCorrect: false },
        ],
      },
    ],
  },

  // 2. Docker Compose
  {
    title: 'Docker Compose & Redes para Arquitecturas de Microservicios',
    category: 'Docker',
    level: 'Intermedio',
    duration: '14h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Estructura compose.yaml v2',
      'Redes internas vs externas',
      'Dependencias con depends_on condition',
      'Secretos y perfiles de ejecución',
    ],
    description:
      'Domina la orquestación local y staging de múltiples servicios interconectados: APIs, bases de datos, caches y proxies usando Docker Compose v2.',
    modules: [
      {
        title: 'Módulo 1: Especificación Compose v2 y Estructura Declarativa',
        lessons: [
          'De comandos docker run aislados a compose.yaml estructurado',
          'Jerarquía de servicios, redes y volúmenes en la especificación v2',
          'Gestión de variables de entorno mediante archivos .env y sustitución dinámica',
        ],
      },
      {
        title:
          'Módulo 2: Networking Avanzado, Redes Bridge y Aislamiento Privado',
        lessons: [
          'Creación de redes personalizadas y topologías multi-tier',
          'Aislamiento de bases de datos para evitar exposición pública indebida',
          'Interconexión de stacks mediante redes externas compartidas (external networks)',
        ],
      },
      {
        title: 'Módulo 3: Gestión de Variables de Entorno, Secrets y Perfiles',
        lessons: [
          'Uso de docker compose secrets para claves y certificados TLS',
          'Perfiles de Compose (profiles) para separar servicios de desarrollo y testing',
          'Sobrescritura de configuración con compose.override.yaml',
        ],
      },
      {
        title:
          'Módulo 4: Orquestación de Dependencias, Orden de Inicio y Healthchecks',
        lessons: [
          'Condición service_healthy en depends_on para arranque ordenado',
          'Definición de sondas de salud (healthcheck) personalizadas para APIs y BDs',
          'Políticas de reinicio ante fallos (restart: on-failure, unless-stopped)',
        ],
      },
      {
        title: 'Módulo 5: Ambientes de Staging y Despliegues Multi-Contenedor',
        lessons: [
          'Stack completo Frontend React + Backend NestJS + Redis + PostgreSQL',
          'Simulación de staging y variables de entorno productivas',
          'Comandos de diagnóstico: compose ps, top, logs y compose down --volumes',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Orquestación de Stack Microservicios con Compose',
    practicalInstructions:
      'Diseña un archivo compose.yaml que levante un frontend en React, un backend en Express y Redis como caché con red privada. Sube el informe PDF con evidencias.',
    practicalRubric:
      '1. Configuración de redes y aislamiento (40%)\n2. Políticas de reinicio y healthchecks (30%)\n3. Pruebas de integración documentadas (30%)',
    practicalPdfName: 'Caso_Practico_Docker_Compose.pdf',
    questions: [
      {
        text: '¿Cómo se asegura en Compose que un servicio espere a que la base de datos esté lista para aceptar conexiones?',
        options: [
          {
            text: 'Usando depends_on con condition: service_healthy',
            isCorrect: true,
          },
          { text: 'Solo agregando depends_on básico', isCorrect: false },
          { text: 'Con restart: always', isCorrect: false },
        ],
      },
      {
        text: '¿Cuál es la red por defecto creada por Docker Compose para un proyecto llamado "mi-app"?',
        options: [
          { text: 'mi-app_default tipo bridge', isCorrect: true },
          { text: 'host network compartida', isCorrect: false },
          { text: 'none network aislada', isCorrect: false },
        ],
      },
    ],
  },

  // 3. Optimización Docker
  {
    title: 'Optimización de Imágenes Docker y Multi-Stage Builds',
    category: 'Docker',
    level: 'Avanzado',
    duration: '12h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'BuildKit avanzado y montajes de caché',
      'Imágenes Google Distroless',
      'Reducción de tamaño del 90%',
      'Análisis de capas con dive',
    ],
    description:
      'Minimiza la superficie de ataque y el peso de tus imágenes de producción. Aprende a compilar artefactos en Node, Go, Rust y desplegar en Alpine y Distroless.',
    modules: [
      {
        title:
          'Módulo 1: Anatomía de Capas y Análisis de Almacenamiento con Dive',
        lessons: [
          'Cómo funciona el sistema de archivos UnionFS y la inmutabilidad de capas',
          'Instalación y auditoría de imágenes en terminal con la herramienta Dive',
          'Identificación de archivos temporales y desperdicio entre instrucciones RUN',
        ],
      },
      {
        title: 'Módulo 2: Compilación Multi-Etapa para Node.js, Go y Rust',
        lessons: [
          'Etapa builder vs etapa runtime: descarte de SDKs y compiladores pesados',
          'Multi-stage build para aplicaciones TypeScript / Node.js con producción podada',
          'Generación de binarios estáticos en Go y Rust para contenedor scratch',
        ],
      },
      {
        title: 'Módulo 3: Imágenes Google Distroless y Minimalismo con Alpine',
        lessons: [
          'Ventajas y arquitectura de las imágenes Google Container Distroless',
          'Comparativa técnica: Debian slim vs Alpine musl vs Distroless estricto',
          'Manejo de certificados CA y zonas horarias en imágenes minimalistas',
        ],
      },
      {
        title:
          'Módulo 4: BuildKit Avanzado, Montajes de Caché y Secretos en Build',
        lessons: [
          'Activación de Docker BuildKit y sintaxis RUN --mount=type=cache',
          'Inyección segura de claves privadas en compilación con --mount=type=secret',
          'Exportación de artefactos de compilación hacia el host anfitrión',
        ],
      },
      {
        title:
          'Módulo 5: Reducción de Superficie de Ataque y Ejecución No-Root',
        lessons: [
          'Creación de usuarios no privilegiados dedicados (USER appuser)',
          'Configuración de permisos de carpetas y lectura exclusiva en runtime',
          'Verificación de cumplimiento de estándares de producción y benchmarks',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Reducción y Hardening de Imagen Docker',
    practicalInstructions:
      'Toma una aplicación monolítica con imagen de 1.2 GB y optimízala mediante multi-stage build a menos de 100 MB usando distroless o alpine sin permisos root.',
    practicalRubric:
      '1. Reducción efectiva del peso (40%)\n2. Usuario no-root y seguridad (30%)\n3. Comparativa y reporte técnico PDF (30%)',
    practicalPdfName: 'Caso_Practico_Optimizacion_Docker.pdf',
    questions: [
      {
        text: '¿Qué ventaja de seguridad ofrece una imagen base Google Container Distroless?',
        options: [
          {
            text: 'No contiene shell (bash/sh) ni gestores de paquetes, mitigando ataques de ejecución remota',
            isCorrect: true,
          },
          {
            text: 'Permite instalar herramientas con apt-get en tiempo de ejecución',
            isCorrect: false,
          },
          { text: 'Aumenta el rendimiento de CPU en un 50%', isCorrect: false },
        ],
      },
    ],
  },

  // 4. Seguridad Docker
  {
    title: 'Seguridad y Hardening en Contenedores con Docker Scout y Trivy',
    category: 'Docker',
    level: 'Avanzado',
    duration: '13h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Escaneo estático con Trivy',
      'Políticas CIS Docker Benchmark',
      'Remediación de vulnerabilidades críticas',
      'Firmado de imágenes con Cosign',
    ],
    description:
      'Implementa escaneo continuo de vulnerabilidades (CVEs), buenas prácticas de seguridad de la CIS Foundation y políticas de control de contenedores.',
    modules: [
      {
        title: 'Módulo 1: Panorama de Vulnerabilidades (CVEs) en Imágenes Base',
        lessons: [
          'Vulnerabilidades comunes en dependencias y capas del sistema operativo',
          'Bases de datos de vulnerabilidades (NVD) y severidades CVSS',
          'Riesgos asociados al uso de imágenes no verificadas o tags latest',
        ],
      },
      {
        title: 'Módulo 2: Escaneo Estático Automatizado con Trivy en CI/CD',
        lessons: [
          'Instalación y escaneo de imágenes locales con Trivy CLI',
          'Filtrado por severidad (CRITICAL, HIGH) y generación de reportes JSON/SARIF',
          'Bloqueo automático de pipelines CI cuando se detectan fallos críticos',
        ],
      },
      {
        title: 'Módulo 3: Hardening del Docker Daemon y Reglas CIS Benchmark',
        lessons: [
          'Auditoría del host y del daemon con docker-bench-security',
          'Configuración segura de daemon.json (desactivar icc, activar userns-remap)',
          'Protección del socket /var/run/docker.sock contra accesos no autorizados',
        ],
      },
      {
        title:
          'Módulo 4: Control de Capacidades de Linux (Capabilities) y Seccomp',
        lessons: [
          'Descarte de privilegios con --cap-drop=ALL y adición selectiva de capacidades',
          'Perfiles de llamadas al sistema (Seccomp profiles) para limitar syscalls',
          'Protección de sólo lectura del sistema de archivos con --read-only',
        ],
      },
      {
        title: 'Módulo 5: Firmado y Verificación de Imágenes con Cosign',
        lessons: [
          'Introducción a la firma criptográfica en la cadena de suministro de software (Supply Chain)',
          'Generación de pares de llaves y firma de imágenes en registros con Sigstore Cosign',
          'Verificación de firmas antes del despliegue en entornos productivos',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Auditoría y Remediación de Seguridad en Contenedores',
    practicalInstructions:
      'Escanea un contenedor vulnerable con Trivy, documenta las vulnerabilidades encontradas, aplica parches y genera un reporte de cumplimiento con 0 CVEs críticos.',
    practicalRubric:
      '1. Identificación y análisis de CVEs (40%)\n2. Remediación y hardening (30%)\n3. Reporte PDF de remediación (30%)',
    practicalPdfName: 'Caso_Practico_Seguridad_Docker.pdf',
    questions: [
      {
        text: '¿Por qué nunca se debe ejecutar un contenedor web con el usuario root por defecto?',
        options: [
          {
            text: 'Porque un escape de contenedor otorgaría acceso de superusuario al host anfitrión',
            isCorrect: true,
          },
          {
            text: 'Porque Docker deniega la apertura de puertos superiores a 1024',
            isCorrect: false,
          },
          {
            text: 'Porque la memoria RAM se limita automáticamente a 128 MB',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 5. Docker Swarm
  {
    title: 'Docker Swarm & Orquestación Ligera de Alta Disponibilidad',
    category: 'Docker',
    level: 'Intermedio',
    duration: '11h de video',
    rating: 4.7,
    imageUrl:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Cluster Swarm Manager y Workers',
      'Redes Overlay y Mesh Routing',
      'Zero-downtime rolling updates',
      'Gestión de secretos y configs',
    ],
    description:
      'Aprende orquestación nativa con Docker Swarm: despliegue de stacks multi-nodo, balanceo de carga integrado (ingress overlay) y rolling updates sin caídas.',
    modules: [
      {
        title:
          'Módulo 1: Arquitectura de Clúster Swarm: Nodos Manager y Workers',
        lessons: [
          'Conceptos de control plane distribuido en Swarm vs Kubernetes',
          'Inicialización del swarm manager con docker swarm init',
          'Unión segura de nodos workers mediante tokens criptográficos',
        ],
      },
      {
        title: 'Módulo 2: Ingress Routing Mesh y Redes Overlay Cifradas',
        lessons: [
          'Cómo funciona la malla de enrutamiento (Routing Mesh) en cualquier nodo del clúster',
          'Creación de redes tipo overlay para comunicación entre nodos',
          'Activación de cifrado IPsec en redes overlay para tráfico multi-servidor',
        ],
      },
      {
        title:
          'Módulo 3: Despliegue de Stacks Declarativos con docker stack deploy',
        lessons: [
          'Diferencias entre docker compose up y docker stack deploy',
          'Sección deploy en compose.yaml: réplicas, reservas y límites de recursos',
          'Gestión de secretos (docker secret) y configs nativos en el clúster',
        ],
      },
      {
        title: 'Módulo 4: Estrategias de Rolling Updates y Rollback Automático',
        lessons: [
          'Actualizaciones progresivas controladas con update_config (delay, parallelism)',
          'Monitoreo de estado de tareas y rollback automático ante fallas de healthcheck',
          'Comandos de inspección: docker service ps y docker service logs',
        ],
      },
      {
        title: 'Módulo 5: Monitoreo, Tolerancia a Fallos y Quórum Raft',
        lessons: [
          'Algoritmo de consenso Raft y cálculo de quórum en clústeres impares de managers',
          'Drenado de nodos para mantenimiento con docker node update --availability drain',
          'Estrategias de recuperación ante pérdida de quórum en producción',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Despliegue de Clúster de 3 Nodos en Swarm',
    practicalInstructions:
      'Configura un swarm con 1 Manager y 2 Workers. Despliega un servicio Nginx con 5 réplicas y comprueba el balanceo de carga ingress.',
    practicalRubric:
      '1. Configuración de nodos y quórum Raft (40%)\n2. Escalado y rolling update (30%)\n3. Reporte PDF con evidencias de alta disponibilidad (30%)',
    practicalPdfName: 'Caso_Practico_Docker_Swarm.pdf',
    questions: [
      {
        text: '¿Cuál algoritmo de consenso utiliza Docker Swarm para mantener el estado entre nodos Manager?',
        options: [
          { text: 'Raft Consensus Algorithm', isCorrect: true },
          { text: 'Paxos Tradicional', isCorrect: false },
          { text: 'Round Robin DNS', isCorrect: false },
        ],
      },
    ],
  },

  // 6. Kubernetes Fundamentals
  {
    title: 'Kubernetes Fundamentals: Pods, Services, Deployments e Ingress',
    category: 'Kubernetes',
    level: 'Principiante',
    duration: '20h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Arquitectura del Control Plane y Kubelet',
      'Manifiestos YAML y kubectl imperativo vs declarativo',
      'Gestión de configuración con ConfigMaps y Secrets',
      'Ingress Controller Nginx y TLS',
    ],
    description:
      'El curso definitivo para dominar la arquitectura de Kubernetes. Aprende a crear Pods, ReplicaSets, Deployments, Services (ClusterIP, NodePort, LoadBalancer) e Ingress Nginx.',
    modules: [
      {
        title:
          'Módulo 1: Arquitectura del Control Plane y Componentes del Nodo K8s',
        lessons: [
          'El corazón de K8s: API Server, etcd, Scheduler y Controller Manager',
          'El nodo trabajador: Kubelet, Kube-proxy y Container Runtime Interface (CRI)',
          'Instalación de entorno de prácticas local con Minikube y K3s',
        ],
      },
      {
        title: 'Módulo 2: Pods, Ciclo de Vida y Primitivas Básicas de Cómputo',
        lessons: [
          'El Pod como unidad atómica: contenedores principales y sidecars',
          'Sondas de salud vitales: livenessProbe, readinessProbe y startupProbe',
          'Gestión de recursos de CPU y memoria: requests y limits',
        ],
      },
      {
        title:
          'Módulo 3: Deployments, ReplicaSets y Actualizaciones sin Caídas',
        lessons: [
          'ReplicaSets y garantía de estado deseado',
          'Estrategias de actualización en Deployments: RollingUpdate vs Recreate',
          'Control de versiones de despliegue con kubectl rollout undo e history',
        ],
      },
      {
        title:
          'Módulo 4: Exposición de Servicios: ClusterIP, NodePort e Ingress',
        lessons: [
          'Descubrimiento de servicios y resolución DNS interna en el clúster',
          'Tipos de Service: ClusterIP interno vs NodePort y LoadBalancer',
          'Enrutamiento HTTP de nivel 7 con Ingress Controller Nginx y reglas de host',
        ],
      },
      {
        title: 'Módulo 5: Gestión de Configuración con ConfigMaps y Secrets',
        lessons: [
          'Separación de código y configuración mediante ConfigMaps',
          'Almacenamiento seguro de credenciales con Kubernetes Secrets',
          'Inyección de variables de entorno vs montajes de volúmenes de configuración',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de Aplicación Web con Ingress y Autoescalado',
    practicalInstructions:
      '1. Despliega un Deployment de 3 réplicas para un servicio web.\n2. Configura un Service ClusterIP y un Ingress con regla de dominio local (app.local).\n3. Inyecta variables de entorno mediante un ConfigMap y un Secret codificado en base64.\n4. Verifica el estado con kubectl get all y documenta en un PDF.',
    practicalRubric:
      '1. Manifiestos YAML estructurados y limpios (40%)\n2. Correcto enrutamiento Ingress y Service (30%)\n3. Reporte PDF con evidencias de comandos y curl (30%)',
    practicalPdfName: 'Caso_Practico_Kubernetes_Fundamentos.pdf',
    questions: [
      {
        text: '¿Cuál componente de Kubernetes almacena de manera consistente y distribuida todo el estado del clúster?',
        options: [
          { text: 'etcd', isCorrect: true },
          { text: 'kube-proxy', isCorrect: false },
          { text: 'kube-scheduler', isCorrect: false },
        ],
      },
    ],
  },

  // 7. Helm 3
  {
    title: 'Gestión y Empaquetado de Aplicaciones K8s con Helm 3',
    category: 'Kubernetes',
    level: 'Intermedio',
    duration: '15h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1618401479427-c8ef9465fbe1?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Estructura de un Chart: Chart.yaml, templates, values',
      'Funciones Go Template y Pipelines',
      'Gestión de dependencias de charts (subcharts)',
      'Publicación en GitHub Pages o Artifact Registry',
    ],
    description:
      'Aprende a empaquetar tus aplicaciones como charts de Helm. Templating de manifiestos, gestión de values.yaml, hooks, repositorios privados y rollbacks automáticos.',
    modules: [
      {
        title:
          'Módulo 1: Anatomía de un Helm Chart: Chart.yaml, Values y Templates',
        lessons: [
          'El rol de Helm como gestor de paquetes estándar de la CNCF',
          'Estructura de carpetas generada por helm create',
          'Separación de valores configurables en values.yaml',
        ],
      },
      {
        title:
          'Módulo 2: Motor de Plantillas Go Template, Pipelines y Funciones',
        lessons: [
          'Uso de funciones esenciales: quote, default, upper, lower y indent',
          'Estructuras de control en plantillas: if/else, with y range',
          'Definición de plantillas reutilizables en el archivo _helpers.tpl',
        ],
      },
      {
        title: 'Módulo 3: Gestión de Valores por Entorno (Dev, Staging, Prod)',
        lessons: [
          'Estrategia de múltiples archivos de valores (values-dev.yaml, values-prod.yaml)',
          'Sobrescritura de parámetros en línea con la bandera --set',
          'Validación de esquemas de valores con JSON Schema (values.schema.json)',
        ],
      },
      {
        title: 'Módulo 4: Ciclo de Vida de Releases, Upgrades y Rollbacks',
        lessons: [
          'Instalación y actualización atómica con helm upgrade --install --atomic',
          'Inspección del historial de releases con helm history',
          'Recuperación inmediata de caídas mediante helm rollback',
        ],
      },
      {
        title:
          'Módulo 5: Creación de Repositorios Privados y Publicación de Charts',
        lessons: [
          'Empaquetado de charts con helm package y generación de index.yaml',
          'Publicación de charts mediante OCI en GitHub Packages o AWS ECR',
          'Gestión de dependencias complejas con subcharts y Chart.lock',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Creación y Despliegue de un Helm Chart Reutilizable',
    practicalInstructions:
      'Crea un Helm Chart con values parametrizados para dev y prod (réplicas, ingress host y recursos). Despliégalo en un namespace y haz rollback a una versión anterior.',
    practicalRubric:
      '1. Modularidad y calidad del templating (40%)\n2. Manejo de valores por ambiente (30%)\n3. Reporte PDF de simulación de rollback (30%)',
    practicalPdfName: 'Caso_Practico_Helm3.pdf',
    questions: [
      {
        text: '¿Dónde se almacenan las configuraciones por defecto que pueden ser sobrescritas por el usuario en Helm?',
        options: [
          {
            text: 'En el archivo values.yaml en la raíz del chart',
            isCorrect: true,
          },
          { text: 'En el archivo Chart.yaml', isCorrect: false },
          { text: 'Directamente en la base de datos etcd', isCorrect: false },
        ],
      },
    ],
  },

  // 8. K8s Producción EKS/GKE
  {
    title: 'Kubernetes en Producción: Despliegue en AWS EKS y Google GKE',
    category: 'Kubernetes',
    level: 'Avanzado',
    duration: '24h de video',
    rating: 5.0,
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'EKS con eksctl y terraform',
      'Karpenter para autoescalado veloz de nodos',
      'AWS Load Balancer Controller',
      'Persistent Volumes con EBS CSI Driver',
    ],
    description:
      'Lleva Kubernetes al nivel empresarial. Aprovisionamiento de clústeres gestionados EKS/GKE, autoescalado con Karpenter/HPA, almacenamiento CSI y balanceadores en la nube.',
    modules: [
      {
        title: 'Módulo 1: Aprovisionamiento de Clústeres EKS/GKE y Redes VPC',
        lessons: [
          'Diseño de topologías de red VPC multi-AZ con subredes públicas y privadas',
          'Aprovisionamiento de clúster EKS mediante eksctl y manifiestos de configuración',
          'Configuración del plano de control con endpoints privados y registros de auditoría',
        ],
      },
      {
        title:
          'Módulo 2: Identidad y Permisos Cloud con IAM Roles for Service Accounts (IRSA)',
        lessons: [
          'Asociación de proveedor OIDC para federación de identidades IAM en Kubernetes',
          'Creación de Service Accounts con roles IAM granulares sin credenciales fijas',
          'Pruebas de acceso seguro desde Pods hacia Amazon S3 y DynamoDB',
        ],
      },
      {
        title:
          'Módulo 3: Almacenamiento Dinámico con CSI Drivers y StorageClasses',
        lessons: [
          'Instalación del AWS EBS CSI Driver mediante add-on gestionado de EKS',
          'Definición de StorageClasses dinámicas con volumen gp3 de alto rendimiento',
          'Despliegue de aplicaciones stateful con StatefulSets y PersistentVolumeClaims',
        ],
      },
      {
        title:
          'Módulo 4: Autoescalado de Nodos con Karpenter y Cluster Autoscaler',
        lessons: [
          'Limitaciones del Cluster Autoscaler tradicional frente a picos repentinos',
          'Instalación y configuración de Karpenter NodePools y NodeClasses',
          'Aprovisionamiento de instancias Spot y On-Demand en segundos para optimizar costos',
        ],
      },
      {
        title:
          'Módulo 5: Balanceo de Carga Cloud (NLB/ALB) y Dominios con ExternalDNS',
        lessons: [
          'Instalación del AWS Load Balancer Controller en el clúster',
          'Exposición de servicios con Application Load Balancer mediante Ingress de AWS',
          'Automatización de registros DNS en Route 53 con ExternalDNS y certificados ACM',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de Clúster EKS de Alta Disponibilidad',
    practicalInstructions:
      'Configura un clúster EKS con nodegroups multi-AZ, instala el AWS Load Balancer Controller y expón un servicio con NLB.',
    practicalRubric:
      '1. Configuración de IAM y seguridad de clúster (40%)\n2. Autoescalado y balanceador cloud (30%)\n3. Reporte PDF con logs de métricas y pruebas (30%)',
    practicalPdfName: 'Caso_Practico_EKS_Produccion.pdf',
    questions: [
      {
        text: '¿Qué mecanismo permite a un Pod en EKS asumir roles IAM de AWS de forma granular sin credenciales fijas?',
        options: [
          {
            text: 'IAM Roles for Service Accounts (IRSA) mediante proveedor OIDC',
            isCorrect: true,
          },
          {
            text: 'Variables de entorno AWS_SECRET_ACCESS_KEY en el Pod',
            isCorrect: false,
          },
          {
            text: 'El rol IAM asignado al nodo EC2 únicamente',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 9. Prometheus & Grafana K8s
  {
    title: 'Monitoreo de Clústeres Kubernetes con Prometheus & Grafana',
    category: 'Kubernetes',
    level: 'Avanzado',
    duration: '18h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Prometheus Operator y Custom Resource Definitions (ServiceMonitor)',
      'Consultas avanzadas en PromQL',
      'Creación de dashboards ejecutivos en Grafana',
      'Reglas de alerta y notificación a Slack/Discord',
    ],
    description:
      'Implementa la suite de observabilidad estándar de la CNCF: kube-prometheus-stack, métricas de cAdvisor, Node Exporter, paneles personalizados en Grafana y alertas con Alertmanager.',
    modules: [
      {
        title:
          'Módulo 1: Arquitectura de kube-prometheus-stack y Prometheus Operator',
        lessons: [
          'Componentes de la suite de monitoreo CNCF: Prometheus, Node Exporter, cAdvisor y Alertmanager',
          'Instalación del operador de Prometheus en Kubernetes mediante Helm',
          'Recursos personalizados (CRDs): Prometheus, ServiceMonitor, PodMonitor y PrometheusRule',
        ],
      },
      {
        title:
          'Módulo 2: Recolección de Métricas con ServiceMonitors y PodMonitors',
        lessons: [
          'Exposición del endpoint /metrics en aplicaciones con librerías cliente Prometheus',
          'Configuración de ServiceMonitor con coincidencia de etiquetas (label matching)',
          'Inspección de endpoints activos y targets en la consola web de Prometheus',
        ],
      },
      {
        title:
          'Módulo 3: Lenguaje de Consultas PromQL: Tasas, Agregaciones y Percentiles',
        lessons: [
          'Tipos de métricas: Counter, Gauge, Histogram y Summary',
          'Cálculo de tasas por segundo con rate(), irate() e increase()',
          'Métricas RED (Rate, Errors, Duration) y percentiles p95/p99 con histogram_quantile()',
        ],
      },
      {
        title:
          'Módulo 4: Creación de Dashboards Profesionales y SLAs en Grafana',
        lessons: [
          'Configuración de Prometheus como Datasource autenticado en Grafana',
          'Diseño de paneles interactivos de CPU, memoria, saturación de disco y tráfico de red',
          'Creación de dashboards para monitoreo de SLAs, SLOs y presupuesto de error',
        ],
      },
      {
        title:
          'Módulo 5: Configuración de Reglas de Alerta y Notificaciones con Alertmanager',
        lessons: [
          'Definición de reglas de alerta declarativas con PrometheusRule en YAML',
          'Enrutamiento de alertas críticas y de advertencia en Alertmanager',
          'Integración de canales de notificación: Slack, Discord, PagerDuty y Webhooks',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Configuración de Dashboard y Alertas en Grafana',
    practicalInstructions:
      'Configura un ServiceMonitor para monitorear una API web. Crea un dashboard en Grafana que muestre throughput (RPS), latencia p95 y tasa de errores 5xx.',
    practicalRubric:
      '1. ServiceMonitor y recolección de métricas (40%)\n2. Calidad de paneles Grafana y PromQL (30%)\n3. Reporte PDF con evidencias bajo prueba de carga (30%)',
    practicalPdfName: 'Caso_Practico_Prometheus_Grafana.pdf',
    questions: [
      {
        text: '¿Qué CRD utiliza el Prometheus Operator para indicar qué endpoints y puertos de un Service deben ser escaneados periódicamente?',
        options: [
          { text: 'ServiceMonitor', isCorrect: true },
          { text: 'PodDisruptionBudget', isCorrect: false },
          { text: 'ClusterRoleBinding', isCorrect: false },
        ],
      },
    ],
  },

  // 10. Istio Service Mesh
  {
    title: 'Service Mesh en Kubernetes con Istio: Enrutamiento y mTLS',
    category: 'Kubernetes',
    level: 'Avanzado',
    duration: '18h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Envoy Sidecar Injection',
      'VirtualServices y DestinationRules',
      'Canary 90/10 y Fault Injection',
      'Cifrado de extremo a extremo con mTLS',
    ],
    description:
      'Transforma la comunicación entre tus microservicios. Inyección de proxies Envoy, división de tráfico en porcentajes (canary release), encriptación mutual TLS y observabilidad con Kiali.',
    modules: [
      {
        title:
          'Módulo 1: Introducción a Service Mesh y Arquitectura del Proxy Envoy',
        lessons: [
          'Retos de comunicación este-oeste en arquitecturas de microservicios',
          'Plano de control (Istiod) vs plano de datos (Envoy proxies en sidecars)',
          'Comparativa: Ingress tradicional vs Service Mesh de capa 7',
        ],
      },
      {
        title:
          'Módulo 2: Instalación de Istio e Inyección Automática de Sidecars',
        lessons: [
          'Instalación del Service Mesh mediante istioctl y perfiles preconfigurados',
          'Etiquetado de namespaces con istio-injection=enabled para inyección automática',
          'Inspección de contenedores istio-proxy y configuración interna de Envoy',
        ],
      },
      {
        title:
          'Módulo 3: Enrutamiento Inteligente con VirtualServices y Gateways',
        lessons: [
          'Ingreso de tráfico exterior mediante Istio Ingress Gateway',
          'Reglas de enrutamiento basadas en encabezados HTTP y rutas con VirtualService',
          'Definición de versiones de servicio (subsets) con DestinationRule',
        ],
      },
      {
        title:
          'Módulo 4: División de Tráfico Canary, Circuit Breaking y Fault Injection',
        lessons: [
          'Despliegues progresivos Canary con división de peso porcentual (ej. 90/10)',
          'Inyección de fallos controlados (Fault Injection) para pruebas de caos',
          'Protección contra cascadas de fallas mediante Circuit Breakers y retries',
        ],
      },
      {
        title:
          'Módulo 5: Cifrado Mutual TLS (mTLS) y Visualización de Topología con Kiali',
        lessons: [
          'Configuración de PeerAuthentication para forzar cifrado mTLS STRICT',
          'Rotación automática de certificados criptográficos gestionados por Istiod',
          'Observabilidad y rastreo en vivo de la topología de la malla con Kiali y Jaeger',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Despliegue Canary y mTLS Estricto en Istio',
    practicalInstructions:
      'Configura un despliegue canary 80/20 entre v1 y v2 de un microservicio. Habilita mTLS STRICT en el namespace y valida la topología en Kiali.',
    practicalRubric:
      '1. Configuración de VirtualService y pesos (40%)\n2. Políticas de seguridad mTLS (30%)\n3. Reporte PDF con grafo Kiali y capturas (30%)',
    practicalPdfName: 'Caso_Practico_Istio_ServiceMesh.pdf',
    questions: [
      {
        text: '¿Cuál recurso de Istio define los subconjuntos (subsets) de versiones para un servicio y las políticas de balanceo de carga?',
        options: [
          { text: 'DestinationRule', isCorrect: true },
          { text: 'VirtualService', isCorrect: false },
          { text: 'Gateway', isCorrect: false },
        ],
      },
    ],
  },

  // 11. CKS Security
  {
    title: 'Seguridad, RBAC y NetworkPolicies en Kubernetes (CKS)',
    category: 'Kubernetes',
    level: 'Avanzado',
    duration: '16h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Control de acceso RBAC granular',
      'NetworkPolicies para aislamiento zero-trust',
      'Seguridad en tiempo de ejecución con Falco',
      'Auditoría de API Server de K8s',
    ],
    description:
      'Prepara las defensas de tu clúster. Autenticación con certificados X.509, Roles y RoleBindings, aislamiento de tráfico con Calico/Cilium y detección en tiempo real con Falco.',
    modules: [
      {
        title: 'Módulo 1: Autenticación, Kubeconfig y Certificados X.509',
        lessons: [
          'Mecanismos de autenticación en Kubernetes: Certificados de cliente y tokens OIDC',
          'Generación de certificados TLS y llaves privadas con OpenSSL para usuarios',
          'Configuración segura del archivo kubeconfig con contextos y clústeres',
        ],
      },
      {
        title:
          'Módulo 2: Autorización Granular con Roles, ClusterRoles y Bindings',
        lessons: [
          'Diferencias entre Role (nivel de namespace) y ClusterRole (nivel de clúster)',
          'Definición de apiGroups, resources y verbs con el principio de menor privilegio',
          'Asociación de permisos con RoleBinding y ClusterRoleBinding',
        ],
      },
      {
        title:
          'Módulo 3: Aislamiento de Red Zero-Trust con Kubernetes NetworkPolicies',
        lessons: [
          'Plugins de red CNI compatibles con políticas (Calico, Cilium)',
          'Política de denegación predeterminada (Default Deny) para tráfico entrante y saliente',
          'Apertura explícita de tráfico entre Pods mediante podSelector y namespaceSelector',
        ],
      },
      {
        title:
          'Módulo 4: Seguridad de Cargas de Trabajo: SecurityContext y Pod Security Standards',
        lessons: [
          'Configuración de SecurityContext: runAsNonRoot, readOnlyRootFilesystem y drop capabilities',
          'Estándares de seguridad de Pods (PSS): Niveles Privileged, Baseline y Restricted',
          'Aplicación de admisión de Pod Security Admission (PSA) en namespaces',
        ],
      },
      {
        title:
          'Módulo 5: Detección de Amenazas en Tiempo de Ejecución con Falco',
        lessons: [
          'Arquitectura de Falco y monitoreo de llamadas al sistema del kernel Linux con eBPF',
          'Reglas de detección: ejecuciones de shell en contenedores y modificaciones en /etc',
          'Alertas de intrusión en tiempo real y respuesta automatizada',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Implementación de Red Zero-Trust con NetworkPolicies',
    practicalInstructions:
      'Aplica una política de denegación total de tráfico en un namespace y permite únicamente tráfico HTTP entre frontend y backend, bloqueando acceso directo a la BD.',
    practicalRubric:
      '1. Reglas de NetworkPolicy y selección de labels (40%)\n2. Pruebas de conectividad permitida y bloqueada (30%)\n3. Reporte PDF con evidencias de comandos curl y netcat (30%)',
    practicalPdfName: 'Caso_Practico_Kubernetes_RBAC_NetworkPolicies.pdf',
    questions: [
      {
        text: '¿Qué sucede si un Pod es seleccionado por una NetworkPolicy sin reglas de Ingress definidas?',
        options: [
          {
            text: 'Todo el tráfico entrante hacia ese Pod queda bloqueado por defecto',
            isCorrect: true,
          },
          { text: 'Se permite todo el tráfico libremente', isCorrect: false },
          { text: 'El Pod pasa a estado CrashLoopBackOff', isCorrect: false },
        ],
      },
    ],
  },

  // 12. GitOps ArgoCD
  {
    title: 'GitOps en Kubernetes con ArgoCD y Flagger Canary Releases',
    category: 'Kubernetes',
    level: 'Avanzado',
    duration: '18h de video',
    rating: 5.0,
    imageUrl:
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Instalación y configuración de ArgoCD',
      'Patrón App of Apps para multi-ambiente',
      'Sincronización automatizada con auto-heal',
      'Despliegues progresivos automáticos con Flagger',
    ],
    description:
      'Adopta el paradigma GitOps moderno. Tu repositorio Git como única fuente de verdad. Sincronización automática de clústeres, drift detection y progressive delivery con Flagger.',
    modules: [
      {
        title:
          'Módulo 1: Principios del Paradigma GitOps y Repositorio como Fuente de Verdad',
        lessons: [
          'Los 4 principios de GitOps según OpenGitOps y beneficios frente a CI tradicional',
          'Estructura de repositorios de código de aplicación vs repositorio de configuración K8s',
          'Seguridad: Despliegue en modo pull (agente interno) sin exponer credenciales del clúster',
        ],
      },
      {
        title:
          'Módulo 2: Instalación de ArgoCD y Conexión con Repositorios Git',
        lessons: [
          'Despliegue de componentes de ArgoCD en Kubernetes mediante Helm o manifiestos',
          'Configuración de autenticación con llaves SSH y tokens de acceso personal en GitHub',
          'Manejo de la interfaz gráfica y de la herramienta de línea de comandos argocd CLI',
        ],
      },
      {
        title:
          'Módulo 3: Sincronización Automática, Políticas Auto-Heal y Detección de Drift',
        lessons: [
          'Definición del recurso Application de ArgoCD: source, destination y syncPolicy',
          'Sincronización automática (Automated Sync) y poda de recursos eliminados (Prune)',
          'Corrección automática de divergencias manuales (Self-Heal / Anti-Drift)',
        ],
      },
      {
        title:
          'Módulo 4: Patrón App of Apps para Gestión Multi-Clúster y Multi-Ambiente',
        lessons: [
          'Implementación del patrón App of Apps para bootstrap completo de clústeres',
          'Gestión de ambientes (dev, staging, prod) mediante Kustomize overlays y Helm values',
          'Despliegue unificado de herramientas de infraestructura (Ingress, Cert-Manager, Monitoreo)',
        ],
      },
      {
        title:
          'Módulo 5: Progressive Delivery con Flagger y Despliegues Canary Automatizados',
        lessons: [
          'Instalación del operador Flagger y vinculación con Istio o Nginx Ingress',
          'Definición de recursos Canary con métricas de tasa de éxito y latencia de Prometheus',
          'Rollout progresivo automático y aborto inmediato ante incremento de errores 5xx',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Pipeline GitOps de Despliegue Continuo con ArgoCD',
    practicalInstructions:
      'Configura una aplicación en ArgoCD vinculada a un repositorio Git. Realiza un commit modificando el número de réplicas y evidencia la sincronización automática.',
    practicalRubric:
      '1. Manifiesto Application de ArgoCD y repositorio (40%)\n2. Auto-heal y sincronización sin intervención manual (30%)\n3. Reporte PDF con capturas de la UI de ArgoCD (30%)',
    practicalPdfName: 'Caso_Practico_GitOps_ArgoCD.pdf',
    questions: [
      {
        text: '¿Cuál es la función principal de la característica "Self-Heal" en ArgoCD?',
        options: [
          {
            text: 'Revertir automáticamente cambios manuales aplicados en el clúster para restablecer el estado definido en Git',
            isCorrect: true,
          },
          {
            text: 'Reiniciar los nodos caídos de Kubernetes en el proveedor de nube',
            isCorrect: false,
          },
          {
            text: 'Reparar errores de sintaxis en el código fuente de la aplicación',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 13. Linux Terminal
  {
    title: 'Linux Terminal desde Cero: Comandos Esenciales y Productividad',
    category: 'Linux',
    level: 'Principiante',
    duration: '16h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Estructura del Filesystem FHS de Linux',
      'Filtrado de texto con grep, awk y sed',
      'Gestión de procesos: ps, top, kill, systemctl',
      'Generación y conexión por llaves SSH',
    ],
    description:
      'Pierde el miedo a la consola de Linux. Domina la navegación, manipulación de archivos, tuberías (pipes), permisos chmod/chown, usuarios, procesos y conectividad SSH.',
    modules: [
      {
        title:
          'Módulo 1: Introducción a la Shell Bash y Filesystem Hierarchy Standard (FHS)',
        lessons: [
          'El rol del kernel Linux, distribuciones principales (Debian/Ubuntu, RHEL) y la shell Bash',
          'Jerarquía de directorios estándar (/etc, /var/log, /usr, /opt, /home, /bin)',
          'Variables de entorno del sistema ($PATH, $HOME, $USER) y archivo de perfil ~/.bashrc',
        ],
      },
      {
        title:
          'Módulo 2: Navegación, Búsqueda y Manipulación de Archivos y Carpetas',
        lessons: [
          'Comandos de navegación absoluta y relativa: pwd, cd, ls con banderas -la -lh',
          'Creación, copia, movimiento y borrado seguro: mkdir, touch, cp -r, mv, rm -rf',
          'Búsqueda avanzada de archivos por nombre, tamaño y fecha de modificación con find',
        ],
      },
      {
        title:
          'Módulo 3: Permisos del Sistema: Notación Octal, Chmod, Chown y Umask',
        lessons: [
          'Modelo de seguridad Linux: Usuario propietario (User), Grupo (Group) y Otros (Others)',
          'Cálculo y aplicación de permisos octales (r=4, w=2, x=1) con chmod 755 y 644',
          'Cambio de propietarios y grupos con chown y configuración de máscara de permisos con umask',
        ],
      },
      {
        title:
          'Módulo 4: Flujos Estándar, Redirecciones y Filtrado de Texto con Pipes',
        lessons: [
          'Flujos de entrada y salida: stdin (0), stdout (1), stderr (2) y redirecciones (>, >>, 2>&1)',
          'Encadenamiento de comandos mediante tuberías (|) para procesar datos en cadena',
          'Herramientas esenciales de filtrado y reporte: grep, sort, uniq, cut, head y tail -f',
        ],
      },
      {
        title:
          'Módulo 5: Gestión de Usuarios, Grupos y Conexiones Seguras por SSH',
        lessons: [
          'Administración de cuentas con useradd, usermod y gestión del archivo /etc/sudoers',
          'Monitoreo y finalización de procesos con ps aux, top, htop y kill / killall',
          'Generación de pares de llaves SSH (ED25519), ssh-copy-id y configuración segura de sshd',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Administración y Diagnóstico en Servidor Linux',
    practicalInstructions:
      '1. Crea una estructura de usuarios y grupos con permisos restringidos.\n2. Escribe una línea de comandos usando pipes para extraer los 5 IPs con más peticiones desde un archivo access.log.\n3. Genera un par de llaves SSH y deshabilita el login con contraseña en sshd_config.\n4. Presenta el informe PDF con evidencias.',
    practicalRubric:
      '1. Gestión correcta de usuarios y permisos (40%)\n2. Comando de análisis de logs con pipes (30%)\n3. Reporte PDF con configuración SSH segura (30%)',
    practicalPdfName: 'Caso_Practico_Linux_Terminal.pdf',
    questions: [
      {
        text: '¿Cuál es el valor octal del permiso que otorga lectura y escritura al propietario, y solo lectura a los demás usuarios?',
        options: [
          { text: '644', isCorrect: true },
          { text: '755', isCorrect: false },
          { text: '777', isCorrect: false },
        ],
      },
    ],
  },

  // 14. Bash Scripting
  {
    title: 'Bash Scripting y Automatización de Tareas para Servidores Linux',
    category: 'Linux',
    level: 'Intermedio',
    duration: '15h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Shebang y ejecución estricta (set -euo pipefail)',
      'Manejo de argumentos y banderas con getopts',
      'Automatización con Cron y Systemd Timers',
      'Scripts de respaldo y rotación de bases de datos',
    ],
    description:
      'Automatiza tareas repetitivas en servidores Linux. Variables, condicionales if/else, bucles for/while, funciones, paso de argumentos, cron jobs y scripts de respaldo.',
    modules: [
      {
        title:
          'Módulo 1: Estructura de Scripts Bash, Shebang y Opciones Defensivas',
        lessons: [
          'Línea Shebang (#!/usr/bin/env bash) y permisos de ejecución chmod +x',
          'Modo estricto defensivo: set -euo pipefail para evitar fallos silenciosos',
          'Convenciones de nombres, comentarios descriptivos y formateo con shfmt',
        ],
      },
      {
        title:
          'Módulo 2: Variables, Argumentos de Entrada, Condicionales y Bucles',
        lessons: [
          'Definición de variables, constantes y lectura de parámetros posicionales ($1, $2, $@, $#)',
          'Estructuras de decisión condicional if, elif, else con operadores de prueba [[ ... ]]',
          'Iteraciones con bucles for y while para recorrer archivos y líneas de texto',
        ],
      },
      {
        title:
          'Módulo 3: Funciones Reutilizables, Códigos de Salida y Captura de Señales',
        lessons: [
          'Modularización con funciones, variables locales (local var) y valores de retorno exit',
          'Procesamiento avanzado de banderas y opciones de línea de comandos con getopts',
          'Captura de señales del sistema y limpieza de archivos temporales con trap',
        ],
      },
      {
        title:
          'Módulo 4: Creación de Scripts de Monitoreo y Respaldo de Bases de Datos',
        lessons: [
          'Script automatizado de respaldo comprimido (tar.gz / pg_dump) con fecha y hora',
          'Validación de espacio disponible en disco (df -h) y alertas si supera umbral de 85%',
          'Rotación y purga automática de respaldos antiguos de más de 30 días con find -mtime',
        ],
      },
      {
        title: 'Módulo 5: Programación de Tareas con Crontab y Systemd Timers',
        lessons: [
          'Sintaxis de cron jobs en crontab -e y redirección de logs de ejecución',
          'Solución de problemas comunes de PATH y variables en entornos de cron',
          'Alternativa moderna con Systemd Services y Systemd Timers para ejecución garantizada',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Script de Monitoreo y Respaldo Automático',
    practicalInstructions:
      'Crea un script en Bash que valide el uso de disco. Si supera el 85%, debe enviar una alerta y limpiar logs antiguos de más de 7 días. Configúralo en cron.',
    practicalRubric:
      '1. Robustez del script (manejo de errores y código de salida) (40%)\n2. Limpieza de logs y programación en cron (30%)\n3. Reporte PDF con pruebas de ejecución (30%)',
    practicalPdfName: 'Caso_Practico_Bash_Scripting.pdf',
    questions: [
      {
        text: '¿Para qué se incluye la directiva "set -e" al inicio de un script de Bash?',
        options: [
          {
            text: 'Para que el script se detenga inmediatamente si cualquier comando devuelve un código de error distinto de cero',
            isCorrect: true,
          },
          {
            text: 'Para imprimir cada comando antes de ejecutarlo',
            isCorrect: false,
          },
          {
            text: 'Para requerir permisos de superusuario obligatorios',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 15. Nginx
  {
    title: 'Servidores Web Nginx: Reverse Proxy, Balanceo de Carga y SSL/TLS',
    category: 'Servicios Web',
    level: 'Intermedio',
    duration: '15h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente@deployapp.com',
    features: [
      'Estructura de nginx.conf y directivas location',
      'Reverse proxy con proxy_pass y headers X-Forwarded',
      'Upstreams y algoritmos de balanceo de carga',
      "Certificados SSL/TLS con Let's Encrypt y Certbot",
    ],
    description:
      'El servidor web más utilizado del mundo. Configuración de Virtual Hosts (Server Blocks), Reverse Proxy hacia aplicaciones Node/Python/Go, balanceo de carga y certificados SSL con Certbot.',
    modules: [
      {
        title:
          'Módulo 1: Arquitectura Event-Driven de Nginx y Directivas Globales',
        lessons: [
          'Por qué Nginx supera a Apache en concurrencia: Modelo asíncrono no bloqueante',
          'Estructura principal de /etc/nginx/nginx.conf y contextos (main, events, http)',
          'Gestión de procesos trabajadores (worker_processes y worker_connections)',
        ],
      },
      {
        title:
          'Módulo 2: Configuración de Server Blocks (Virtual Hosts) y Bloques Location',
        lessons: [
          'Organización de sitios con sites-available y enlaces simbólicos en sites-enabled',
          'Directivas server_name, root, index y manejo de páginas de error personalizadas',
          'Prioridad y concordancia de bloques location (exacto =, prefijo ^~, regex ~)',
        ],
      },
      {
        title:
          'Módulo 3: Nginx como Reverse Proxy hacia APIs (Node.js, Python, Go)',
        lessons: [
          'Enrutamiento con proxy_pass hacia puertos locales y sockets UNIX',
          'Preservación de cabeceras de cliente con proxy_set_header (Host, X-Real-IP, X-Forwarded-For)',
          'Soporte completo para conexiones bidireccionales WebSocket (Upgrade header)',
        ],
      },
      {
        title:
          'Módulo 4: Upstreams y Algoritmos de Balanceo de Carga de Alto Rendimiento',
        lessons: [
          'Definición de grupos de servidores con el bloque upstream',
          'Algoritmos de distribución: round-robin ponderado, least_conn e ip_hash',
          'Detección pasiva de caídas con directivas max_fails y fail_timeout',
        ],
      },
      {
        title:
          'Módulo 5: Encriptación SSL/TLS Gratuita con Certbot y Buenas Prácticas HSTS',
        lessons: [
          "Instalación de Certbot y obtención automática de certificados Let's Encrypt",
          'Redirección forzada de HTTP a HTTPS mediante código de estado 301',
          'Hardening TLS: Protocolos TLSv1.2 y TLSv1.3, ciphers seguros y cabecera HSTS',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Implementación de Nginx Reverse Proxy con SSL',
    practicalInstructions:
      "Configura Nginx como balanceador de carga entre 2 instancias backend. Instala un certificado SSL autofirmado o Let's Encrypt y fuerza la redirección HTTP a HTTPS.",
    practicalRubric:
      '1. Configuración de upstream y reverse proxy (40%)\n2. Forzado HTTPS y cabeceras de seguridad HSTS (30%)\n3. Reporte PDF con evidencias de balanceo y certificado (30%)',
    practicalPdfName: 'Caso_Practico_Nginx_Web_Server.pdf',
    questions: [
      {
        text: '¿Cuál directiva de Nginx pasa la dirección IP real del cliente hacia el backend detrás del proxy?',
        options: [
          { text: 'proxy_set_header X-Real-IP $remote_addr;', isCorrect: true },
          { text: 'remote_ip_pass true;', isCorrect: false },
          { text: 'client_header_forward all;', isCorrect: false },
        ],
      },
    ],
  },

  // 16. Apache
  {
    title: 'Apache HTTP Server: Virtual Hosts, mod_rewrite y Rendimiento',
    category: 'Servicios Web',
    level: 'Intermedio',
    duration: '12h de video',
    rating: 4.7,
    imageUrl:
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Configuración de apache2.conf y VirtualHosts en puerto 80/443',
      'Reescritura de URLs limpias con mod_rewrite',
      'Optimización con el módulo MPM Event',
      'Hardening y supresión de banners de versión',
    ],
    description:
      'Aprende a configurar el histórico y robusto servidor web Apache. Configuración de módulos mpm_event, directivas .htaccess, reescritura de URLs y cabeceras de seguridad HTTP.',
    modules: [
      {
        title:
          'Módulo 1: Instalación de Apache2 y Estructura de Configuración Modular',
        lessons: [
          'Arquitectura de Apache HTTP Server y comandos a2enmod, a2dismod, a2ensite',
          'Estructura de configuración en /etc/apache2 y apache2.conf',
          'Directivas de acceso y permisos de directorio con Require all granted',
        ],
      },
      {
        title:
          'Módulo 2: Despliegue de Múltiples Dominios con VirtualHosts en 80 y 443',
        lessons: [
          'Creación de VirtualHosts basados en nombres (Name-based Virtual Hosts)',
          'Aislamiento de DocumentRoot y archivos de logs separados para cada sitio',
          'Configuración de certificados SSL/TLS con el módulo mod_ssl',
        ],
      },
      {
        title:
          'Módulo 3: Reescritura Avanzada de URLs con mod_rewrite y Archivos .htaccess',
        lessons: [
          'Habilitación del motor de reescritura con RewriteEngine On',
          'Reglas de redirección RewriteRule y banderas [R=301,L,QSA]',
          'Control granular por directorio con archivos .htaccess y directiva AllowOverride',
        ],
      },
      {
        title:
          'Módulo 4: Optimización de Conexiones Simultáneas con el Módulo MPM Event',
        lessons: [
          'Evolución de MPM: prefork (por proceso) vs worker (hilos) vs event (asíncrono)',
          'Ajuste de directivas MaxRequestWorkers, ThreadsPerChild y ServerLimit',
          'Habilitación de compresión Gzip con mod_deflate para acelerar tiempos de carga',
        ],
      },
      {
        title:
          'Módulo 5: Hardening de Servidor Apache, Cabeceras de Seguridad y Logs',
        lessons: [
          'Ocultamiento de información del servidor con ServerTokens Prod y ServerSignature Off',
          'Inyección de cabeceras de protección con mod_headers (X-Frame-Options, CSP)',
          'Rotación de archivos access.log y error.log con logrotate',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de Aplicación Web en Apache con VirtualHost',
    practicalInstructions:
      'Configura un VirtualHost en Apache para un dominio local. Habilita mod_rewrite, aplica reglas de compresión gzip con mod_deflate y oculta las cabeceras Server.',
    practicalRubric:
      '1. VirtualHost y permisos de directorio (40%)\n2. Configuración de compresión y seguridad (30%)\n3. Reporte PDF con pruebas de curl -I (30%)',
    practicalPdfName: 'Caso_Practico_Apache_Server.pdf',
    questions: [
      {
        text: '¿Cuál directiva de Apache oculta la versión detallada del software en las cabeceras de respuesta HTTP?',
        options: [
          { text: 'ServerTokens Prod', isCorrect: true },
          { text: 'ServerVersion Hide', isCorrect: false },
          { text: 'Header Remove Version', isCorrect: false },
        ],
      },
    ],
  },

  // 17. Linux Performance Tuning
  {
    title: 'Linux Performance Tuning, Diagnóstico de Redes y Kernel Sysctl',
    category: 'Linux',
    level: 'Avanzado',
    duration: '18h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1520869562399-e772f042f422?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Métricas de Load Average y CPU Throttling',
      'Análisis de cuellos de botella de disco y memoria (I/O Wait, Swap)',
      'Inspección de red con tcpdump, ss y netstat',
      'Ajuste de parámetros de kernel en /etc/sysctl.conf',
    ],
    description:
      'Diagnostica cuellos de botella en servidores en producción. Análisis de CPU, memoria, I/O con htop, iostat, vmstat, inspección de sockets con ss, tcpdump y optimización de kernel.',
    modules: [
      {
        title:
          'Módulo 1: Diagnóstico de CPU, Tiempos de Espera y Cuellos de Botella con htop',
        lessons: [
          'Interpretación correcta de Load Average de 1, 5 y 15 minutos en relación a los núcleos',
          'Estados de CPU: user (%us), system (%sy), idle (%id) y robo de CPU por virtualización (%st)',
          'Identificación de procesos devoradores de recursos y ajuste de prioridades con nice y renice',
        ],
      },
      {
        title:
          'Módulo 2: Análisis de Memoria RAM, Paginación y Uso de Disco con iostat y vmstat',
        lessons: [
          'Memoria disponible vs usada: buffers, cached y cálculo del commit de memoria',
          'Diagnóstico de actividad de Swap y tasa de transferencia con vmstat 1',
          'Métricas de I/O de almacenamiento con iostat: porcentaje de utilización (%util) y await',
        ],
      },
      {
        title:
          'Módulo 3: Inspección de Sockets de Red y Diagnóstico con ss, netstat y tcpdump',
        lessons: [
          'Inspección de sockets abiertos y estados TCP (ESTAB, TIME_WAIT, SYN_SENT) con ss -tulpn',
          'Captura e inspección profunda de paquetes en interfaces de red con tcpdump',
          'Análisis de retransmisiones TCP y cuellos de botella en el ancho de banda con iperf3',
        ],
      },
      {
        title:
          'Módulo 4: Ajuste de Parámetros de Kernel en /etc/sysctl.conf para Servidores Web',
        lessons: [
          'Aumento de colas de conexión entrante con net.core.somaxconn y net.ipv4.tcp_max_syn_backlog',
          'Reutilización rápida de sockets TIME_WAIT con net.ipv4.tcp_tw_reuse',
          'Control de agresividad de paginación a disco con vm.swappiness y dirty_ratio',
        ],
      },
      {
        title:
          'Módulo 5: Configuración de Límites del Sistema en limits.conf y Benchmarking con ApacheBench',
        lessons: [
          'Elevación de descriptores de archivos abiertos (open files) en /etc/security/limits.conf',
          'Ajuste del límite global fs.file-max del kernel',
          'Pruebas de estrés y medición de conexiones por segundo (RPS) con ApacheBench (ab) y wrk',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Diagnóstico y Optimización de Servidor Sobrecargado',
    practicalInstructions:
      'Simula una prueba de estrés de conexiones simultáneas. Identifica el cuello de botella con vmstat y ss, y optimiza los límites de descriptores de archivos (limits.conf) y parámetros sysctl.',
    practicalRubric:
      '1. Diagnóstico de métricas iniciales (40%)\n2. Ajuste de parámetros de kernel y límites (30%)\n3. Reporte PDF con comparativa de benchmark (30%)',
    practicalPdfName: 'Caso_Practico_Linux_Performance.pdf',
    questions: [
      {
        text: '¿Qué parámetro de kernel controla la cantidad máxima de conexiones TCP en cola de espera que el sistema permite en un socket?',
        options: [
          { text: 'net.core.somaxconn', isCorrect: true },
          { text: 'vm.swappiness', isCorrect: false },
          { text: 'fs.file-max', isCorrect: false },
        ],
      },
    ],
  },

  // 18. Hardening Linux
  {
    title: 'Hardening y Seguridad Defensiva en Servidores Linux Ubuntu/Debian',
    category: 'Linux',
    level: 'Avanzado',
    duration: '14h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Reglas estrictas de firewall UFW',
      'Protección SSH con Fail2ban y llave ED25519',
      'Auditoría de seguridad CIS con Lynis',
      'Perfiles de confinamiento AppArmor',
    ],
    description:
      'Asegura tus servidores Linux contra accesos no autorizados. Firewalls UFW e Iptables, protección contra ataques de fuerza bruta con Fail2ban, AppArmor y auditoría con Lynis.',
    modules: [
      {
        title:
          'Módulo 1: Aseguramiento de Conexiones SSH: Llaves Criptográficas y Desactivación de Root',
        lessons: [
          'Directivas estrictas en /etc/ssh/sshd_config: PermitRootLogin no y PasswordAuthentication no',
          'Cambio del puerto SSH por defecto y restricción de acceso solo a usuarios autorizados (AllowUsers)',
          'Autenticación multifactor (MFA/2FA) para sesiones de administración con Google Authenticator',
        ],
      },
      {
        title:
          'Módulo 2: Configuración Defensiva de Firewall con UFW e Iptables',
        lessons: [
          'Política de denegación predeterminada (ufw default deny incoming)',
          'Apertura estricta de puertos de servicio (HTTP 80, HTTPS 443, SSH personalizado)',
          'Restricción de acceso a puertos de administración únicamente desde direcciones IP estáticas',
        ],
      },
      {
        title: 'Módulo 3: Mitigación de Ataques de Fuerza Bruta con Fail2ban',
        lessons: [
          'Funcionamiento de filtros y acciones en /etc/fail2ban/jail.local',
          'Configuración de bantime, findtime y maxretry para proteger el servicio SSH',
          'Creación de cárceles (jails) personalizadas para proteger servidores web Nginx y APIs',
        ],
      },
      {
        title:
          'Módulo 4: Confinamiento de Procesos Críticos con Perfiles AppArmor',
        lessons: [
          'Arquitectura de los módulos de seguridad de Linux (LSM) y AppArmor',
          'Estados de perfiles: Enforce (bloqueo estricto) vs Complain (solo advertencia)',
          'Creación y auditoría de perfiles personalizados para servicios web',
        ],
      },
      {
        title:
          'Módulo 5: Auditoría de Seguridad Automatizada con Lynis y Actualizaciones Desatendidas',
        lessons: [
          'Ejecución de auditorías automatizadas del sistema con Lynis y cálculo del Hardening Index',
          'Configuración de actualizaciones automáticas de seguridad con unattended-upgrades',
          'Monitoreo de integridad de archivos del sistema con AIDE o Tripwire',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Auditoría Lynis y Configuración Defensiva',
    practicalInstructions:
      'Ejecuta una auditoría con Lynis en un servidor limpio. Aplica al menos 5 recomendaciones de seguridad (SSH, permisos de cron, UFW y Fail2ban) y documenta el puntaje alcanzado.',
    practicalRubric:
      '1. Implementación de UFW y Fail2ban (40%)\n2. Incremento del índice de hardening Lynis (30%)\n3. Reporte PDF de auditoría final (30%)',
    practicalPdfName: 'Caso_Practico_Hardening_Linux.pdf',
    questions: [
      {
        text: '¿Cuál es la función principal de Fail2ban en un servidor Linux?',
        options: [
          {
            text: 'Monitorear archivos de log en busca de intentos fallidos de autenticación y bloquear temporalmente la IP atacante en el firewall',
            isCorrect: true,
          },
          { text: 'Encriptar el disco duro en reposo', isCorrect: false },
          {
            text: 'Actualizar paquetes de software automáticamente',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 19. AWS EC2 & VPC
  {
    title: 'AWS Cloud Practitioner & SysOps: EC2, VPC, IAM y Despliegue Web',
    category: 'AWS',
    level: 'Principiante',
    duration: '20h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Diseño de VPC con Subredes Públicas y Privadas',
      'Instancias EC2 y Security Groups estrictos',
      'Políticas y Roles IAM de menor privilegio',
      'Elastic IPs y asignación de DNS con Route 53',
    ],
    description:
      'Inicia en el proveedor cloud líder. Diseña redes privadas Virtual Private Cloud (VPC), crea instancias EC2 seguras, gestiona credenciales con IAM y despliega tu primera app web en AWS.',
    modules: [
      {
        title:
          'Módulo 1: Infraestructura Global de AWS: Regiones, Zonas y Modelos de Servicio',
        lessons: [
          'Conceptos de nube: IaaS, PaaS, SaaS y modelo de responsabilidad compartida de AWS',
          'Regiones globales, Zonas de Disponibilidad (AZs) y puntos de presencia (Edge Locations)',
          'Navegación por la consola de administración de AWS y configuración de AWS CLI v2',
        ],
      },
      {
        title:
          'Módulo 2: Redes Privadas: Creación de VPC, Subredes Públicas/Privadas e Internet Gateway',
        lessons: [
          'Diseño de bloques CIDR IPv4 (ej. 10.0.0.0/16) para una Virtual Private Cloud personalizada',
          'Subredes públicas conectadas a Internet Gateway (IGW) para balanceadores y servidores web',
          'Subredes privadas con salida a internet controlada mediante NAT Gateways',
        ],
      },
      {
        title:
          'Módulo 3: Servidores EC2: Tipos de Instancia, User Data Scripts y Conectividad',
        lessons: [
          'Familias de instancias EC2: Propósito general (t3/t4g), Cómputo (c6i) y Memoria (r6i)',
          'Automatización del aprovisionamiento al arranque mediante User Data (Bash scripts)',
          'Reglas stateful de firewall con Security Groups y control stateless con Network ACLs (NACLs)',
        ],
      },
      {
        title:
          'Módulo 4: Seguridad y Permisos: Políticas y Roles de Menor Privilegio en IAM',
        lessons: [
          'Diferencias entre Usuarios, Grupos, Políticas en JSON y Roles IAM',
          'Asignación de perfiles de instancia IAM a servidores EC2 para evitar credenciales estáticas',
          'Activación de autenticación multifactor (MFA) obligatoria en la cuenta AWS',
        ],
      },
      {
        title:
          'Módulo 5: Asignación de IPs Elásticas, Tablas de Ruteo y Despliegue Web',
        lessons: [
          'Asociación de Elastic IPs (IPv4 estáticas) a servidores de aplicaciones',
          'Configuración de tablas de ruteo asociadas a subredes públicas y privadas',
          'Despliegue de un stack web completo accesible públicamente y pruebas de latencia',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Despliegue de Arquitectura Web en AWS VPC',
    practicalInstructions:
      'Crea una VPC con 2 subredes públicas y 2 privadas en distintas Availability Zones. Despliega un servidor web en la subred pública y conecta mediante SSH y Elastic IP.',
    practicalRubric:
      '1. Arquitectura de VPC y tablas de ruteo (40%)\n2. Configuración de EC2 y Security Groups (30%)\n3. Reporte PDF con evidencias desde la consola AWS (30%)',
    practicalPdfName: 'Caso_Practico_AWS_VPC_EC2.pdf',
    questions: [
      {
        text: '¿Cuál es la diferencia fundamental entre un Security Group y una Network ACL (NACL) en AWS?',
        options: [
          {
            text: 'Security Groups son stateful y operan a nivel de instancia; NACLs son stateless y operan a nivel de subred',
            isCorrect: true,
          },
          {
            text: 'Security Groups son stateless y NACLs son stateful',
            isCorrect: false,
          },
          {
            text: 'Security Groups solo permiten bloquear tráfico, no permitirlo',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 20. AWS Serverless
  {
    title: 'Despliegues Serverless en AWS: Lambda, API Gateway y DynamoDB',
    category: 'AWS',
    level: 'Intermedio',
    duration: '16h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'AWS Lambda con Node.js y Python',
      'API Gateway HTTP APIs y CORS',
      'DynamoDB con Partition y Sort Keys',
      'Despliegue con Serverless Framework / SAM',
    ],
    description:
      'Construye arquitecturas 100% serverless sin preocuparte por aprovisionar servidores. Funciones AWS Lambda, endpoints REST/HTTP con API Gateway y bases NoSQL ultrarrápidas con DynamoDB.',
    modules: [
      {
        title:
          'Módulo 1: Fundamentos de Serverless y Ciclo de Vida de AWS Lambda',
        lessons: [
          '¿Qué es la computación sin servidor? Facturación por consumo y escalabilidad automática',
          'Estructura de una función Lambda: Objeto event, context y respuesta',
          'Mitigación de arranques en frío (Cold Starts) y configuración de memoria / timeouts',
        ],
      },
      {
        title:
          'Módulo 2: Creación de Endpoints REST y HTTP con Amazon API Gateway',
        lessons: [
          'Comparativa: API Gateway REST APIs vs HTTP APIs (costos y latencias)',
          'Mapeo de rutas (GET, POST, PUT, DELETE) e integración con funciones Lambda',
          'Configuración de Cross-Origin Resource Sharing (CORS) y autenticación mediante JWT',
        ],
      },
      {
        title:
          'Módulo 3: Bases de Datos NoSQL Serverless con DynamoDB: Partition y Sort Keys',
        lessons: [
          'Modelado de datos en DynamoDB: Partition Key (PK) y Sort Key (SK) compuesta',
          'Operaciones CRUD atómicas: PutItem, GetItem, UpdateItem y Query eficiente',
          'Índices secundarios globales (GSI) e índices locales (LSI) para búsquedas avanzadas',
        ],
      },
      {
        title:
          'Módulo 4: Despliegue Automatizado con Serverless Framework y AWS SAM',
        lessons: [
          'Estructura del archivo serverless.yml / template.yaml para Infraestructura como Código',
          'Definición de recursos en la nube, permisos IAM y variables de entorno por stage',
          'Despliegue automatizado con el comando serverless deploy',
        ],
      },
      {
        title:
          'Módulo 5: Autenticación con Cognito, Monitoreo con CloudWatch y Manejo de Errores',
        lessons: [
          'Protección de endpoints con Amazon Cognito User Pools y authorizers',
          'Monitoreo en tiempo real de invocaciones, errores y duración en CloudWatch Metrics',
          'Inspección de logs estructurados con CloudWatch Logs Insights y rastreo con AWS X-Ray',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: API Serverless CRUD con Lambda y DynamoDB',
    practicalInstructions:
      'Desarrolla una API REST serverless con operaciones POST y GET conectada a DynamoDB. Publica la API mediante API Gateway y valida las peticiones con Postman.',
    practicalRubric:
      '1. Implementación de Lambda y permisos IAM (40%)\n2. Modelo de datos en DynamoDB (30%)\n3. Reporte PDF con pruebas de endpoints (30%)',
    practicalPdfName: 'Caso_Practico_AWS_Serverless.pdf',
    questions: [
      {
        text: '¿Cómo se factura principalmente el servicio de cómputo AWS Lambda?',
        options: [
          {
            text: 'Por la cantidad de invocaciones y los milisegundos de tiempo de ejecución según la memoria asignada',
            isCorrect: true,
          },
          { text: 'Por una tarifa fija mensual por función', isCorrect: false },
          {
            text: 'Por la cantidad de líneas de código fuente',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 21. AWS ECS & Fargate
  {
    title:
      'Contenedores Escalables en AWS: ECS, Fargate y Application Load Balancer',
    category: 'AWS',
    level: 'Intermedio',
    duration: '16h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1484417894907-623942c8ec29?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Repositorio de imágenes en Amazon ECR',
      'Task Definitions y Task Execution Roles',
      'AWS Fargate Serverless Cómputo',
      'Application Load Balancer y Target Groups',
    ],
    description:
      'Ejecuta contenedores en producción en AWS sin gestionar servidores con AWS Fargate y Amazon Elastic Container Service (ECS). Creación de Task Definitions, Services y balanceador ALB.',
    modules: [
      {
        title:
          'Módulo 1: Registro Privado de Imágenes con Amazon Elastic Container Registry (ECR)',
        lessons: [
          'Creación de repositorios de contenedores privados y públicos en Amazon ECR',
          'Autenticación de Docker CLI con aws ecr get-login-password',
          'Etiquetado semántico, subida de imágenes y políticas de ciclo de vida de imágenes',
        ],
      },
      {
        title:
          'Módulo 2: Creación de ECS Clusters y Definición de Tareas (Task Definitions)',
        lessons: [
          'Arquitectura de Amazon ECS: Clusters, Task Definitions, Tasks y Services',
          'Estructura JSON de una Task Definition: Asignación de CPU, memoria y variables',
          'Diferencias entre Task Execution Role (pull ECR, CloudWatch) y Task Role (permisos de app)',
        ],
      },
      {
        title:
          'Módulo 3: Despliegue Serverless de Contenedores con AWS Fargate',
        lessons: [
          'Ventajas del modelo de cómputo serverless AWS Fargate frente a clústeres EC2',
          'Modo de red awsvpc: Cada tarea Fargate recibe su propia interfaz de red ENI e IP privada',
          'Configuración de almacenamiento efímero y persistente con Amazon EFS en Fargate',
        ],
      },
      {
        title:
          'Módulo 4: Integración con Application Load Balancer (ALB) y Target Groups',
        lessons: [
          'Aprovisionamiento de Application Load Balancer público con listeners HTTP/HTTPS',
          'Vinculación de ECS Service a Target Groups con healthcheck dinámico a las tareas',
          'Despliegue sin tiempo de inactividad (Rolling deployment) administrado por ECS',
        ],
      },
      {
        title:
          'Módulo 5: Políticas de Autoescalado Basadas en Tráfico y Monitoreo con CloudWatch',
        lessons: [
          'Autoescalado de servicios ECS con Service Auto Scaling (Target Tracking Policy)',
          'Escalado automático basado en porcentaje de uso de CPU o número de peticiones por segundo',
          'Monitoreo centralizado de logs de contenedores con el driver awslogs en CloudWatch',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de Servicio Contenedorizado en ECS Fargate',
    practicalInstructions:
      'Sube una imagen Docker a Amazon ECR. Crea una Task Definition y un ECS Service sobre Fargate con 2 réplicas expuestas detrás de un Application Load Balancer.',
    practicalRubric:
      '1. Configuración de ECR y Task Definition (40%)\n2. Integración con ALB y Target Group saludable (30%)\n3. Reporte PDF con evidencias de alta disponibilidad (30%)',
    practicalPdfName: 'Caso_Practico_AWS_ECS_Fargate.pdf',
    questions: [
      {
        text: '¿Cuál es la ventaja de utilizar el tipo de lanzamiento AWS Fargate en lugar de EC2 para ECS?',
        options: [
          {
            text: 'AWS administra la infraestructura subyacente, parches de SO y escalado de hardware sin necesidad de gestionar instancias',
            isCorrect: true,
          },
          {
            text: 'Permite acceso SSH directo al sistema operativo del host anfitrión',
            isCorrect: false,
          },
          {
            text: 'Es completamente gratuito sin importar el tráfico',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 22. AWS RDS & Aurora
  {
    title:
      'Bases de Datos Gestionadas en AWS: RDS PostgreSQL y Aurora Serverless',
    category: 'AWS',
    level: 'Intermedio',
    duration: '14h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'DB Subnet Groups y aislamiento en subredes privadas',
      'Despliegues Multi-AZ para tolerancia a fallos',
      'Escalabilidad de lectura con Read Replicas',
      'Snapshots y Point-In-Time Recovery',
    ],
    description:
      'Gestiona datos a escala empresarial. Creación de Amazon RDS PostgreSQL, alta disponibilidad Multi-AZ, Read Replicas, backups automáticos y migración a Amazon Aurora Serverless.',
    modules: [
      {
        title:
          'Módulo 1: Aprovisionamiento de RDS PostgreSQL en Subredes Privadas (DB Subnet Groups)',
        lessons: [
          'Creación de DB Subnet Groups que abarquen al menos dos Zonas de Disponibilidad',
          'Configuración de Security Groups dedicados para admitir conexiones únicamente desde la app',
          'Selección de versiones de motor de PostgreSQL y tipos de instancia de base de datos (db.t4g, db.r6g)',
        ],
      },
      {
        title:
          'Módulo 2: Parámetros de Rendimiento, GP3 Storage y Grupos de Parámetros',
        lessons: [
          'Ajuste de parámetros del motor PostgreSQL mediante Custom DB Parameter Groups',
          'Almacenamiento General Purpose SSD (gp3): Configuración de IOPS y rendimiento de línea base',
          'Autoescalado de almacenamiento para evitar interrupciones por disco lleno',
        ],
      },
      {
        title:
          'Módulo 3: Alta Disponibilidad con Despliegues Multi-AZ y Réplicas de Lectura',
        lessons: [
          'Arquitectura de replicación sincrónica Multi-AZ con instancia de reserva automática (Standby)',
          'Mecanismo de failover automático transparente para la aplicación sin cambio de endpoint',
          'Creación de Read Replicas asincrónicas para descargar el tráfico de lectura de reportes',
        ],
      },
      {
        title:
          'Módulo 4: Estrategias de Respaldo, Snapshots y Recuperación Punto en el Tiempo (PITR)',
        lessons: [
          'Ventanas de mantenimiento y políticas de respaldo automatizado diario',
          'Restauración granular de bases de datos mediante Point-In-Time Recovery (PITR)',
          'Creación manual de DB Snapshots y compartición segura entre cuentas AWS',
        ],
      },
      {
        title:
          'Módulo 5: Escalabilidad Dinámica y Rentabilidad con Amazon Aurora Serverless v2',
        lessons: [
          'Arquitectura de almacenamiento distribuido de Amazon Aurora compartida en 6 copias',
          'Autoescalado continuo en fracciones de segundo con Aurora Capacity Units (ACUs)',
          'Gestión segura de credenciales maestras y rotación automática con AWS Secrets Manager',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Configuración de Base de Datos Multi-AZ en RDS',
    practicalInstructions:
      'Crea una base de datos PostgreSQL en RDS con configuración Multi-AZ en subredes privadas. Conecta tu backend y simula un evento de failover.',
    practicalRubric:
      '1. Aislamiento de red y credenciales con Secrets Manager (40%)\n2. Configuración Multi-AZ y prueba de failover (30%)\n3. Reporte PDF con evidencias de conexión y logs (30%)',
    practicalPdfName: 'Caso_Practico_AWS_RDS.pdf',
    questions: [
      {
        text: '¿Cómo funciona la replicación en un despliegue de Amazon RDS Multi-AZ?',
        options: [
          {
            text: 'Replicación sincrónica hacia una instancia standby en una Zona de Disponibilidad diferente',
            isCorrect: true,
          },
          {
            text: 'Replicación asincrónica que puede perder transacciones ante un fallo',
            isCorrect: false,
          },
          {
            text: 'Una única instancia compartida entre múltiples regiones',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 23. AWS S3 & CloudFront
  {
    title: 'AWS S3, CloudFront y Route 53: Entrega Global de Aplicaciones Web',
    category: 'AWS',
    level: 'Intermedio',
    duration: '14h de video',
    rating: 4.7,
    imageUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Hosting estático en S3 con Origin Access Control (OAC)',
      'Distribución global CDN con CloudFront',
      'Certificados SSL gratuitos con AWS Certificate Manager (ACM)',
      'Enrutamiento DNS y registros Alias en Route 53',
    ],
    description:
      'Aprende a alojar sitios web estáticos (SPA React, Vue, Next export) en Amazon S3, distribuir con CDN global CloudFront para latencias mínimas y asociar dominios con Route 53.',
    modules: [
      {
        title:
          'Módulo 1: Almacenamiento de Objetos en S3 y Aislamiento de Buckets',
        lessons: [
          'Conceptos de buckets, objetos, claves y clases de almacenamiento (Standard, IA, Glacier)',
          'Políticas de bucket (Bucket Policies) y bloqueo de acceso público (Block Public Access)',
          'Control de versiones de objetos (Versioning) y políticas de ciclo de vida (Lifecycle Rules)',
        ],
      },
      {
        title:
          'Módulo 2: Alojamiento de Single Page Applications (React, Next.js estático)',
        lessons: [
          'Compilación y carga de bundles optimizados de frontend hacia el bucket S3',
          'Configuración de cabeceras HTTP de caché (Cache-Control con max-age e inmutabilidad)',
          'Manejo de errores 404 para aplicaciones SPA redirigiendo hacia index.html',
        ],
      },
      {
        title:
          'Módulo 3: Red de Distribución de Contenido (CDN) Global con Amazon CloudFront',
        lessons: [
          'Arquitectura de Edge Locations y puntos de presencia para caché global',
          'Configuración de CloudFront Distribution vinculada a S3 con Origin Access Control (OAC)',
          'Invalidación de caché bajo demanda tras nuevos despliegues de software',
        ],
      },
      {
        title:
          'Módulo 4: Certificados SSL/TLS Gratuitos con AWS Certificate Manager (ACM)',
        lessons: [
          'Solicitud y validación DNS automática de certificados SSL con ACM en la región us-east-1',
          'Asociación de certificados HTTPS a la distribución de CloudFront',
          'Forzado de HTTPS y negociación estricta con protocolos modernos TLSv1.3',
        ],
      },
      {
        title:
          'Módulo 5: Enrutamiento de Dominios Personalizados y Registros Alias en Route 53',
        lessons: [
          'Configuración de Hosted Zones públicas en Amazon Route 53',
          'Creación de registros de tipo Alias apuntando directamente a distribuciones de CloudFront',
          'Políticas de enrutamiento avanzadas: Latencia, Geográfico y Failover para alta disponibilidad',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de Single Page Application en S3 y CloudFront',
    practicalInstructions:
      'Aloja una aplicación frontend en S3. Configura CloudFront con Origin Access Control bloqueando el acceso público directo al bucket y configura certificados SSL.',
    practicalRubric:
      '1. Bloqueo de acceso público a S3 y OAC (40%)\n2. CloudFront TTLs y manejo de errores 404 a index.html (30%)\n3. Reporte PDF con pruebas de velocidad y HTTPS (30%)',
    practicalPdfName: 'Caso_Practico_AWS_S3_CloudFront.pdf',
    questions: [
      {
        text: '¿Qué mecanismo recomendado por AWS permite a CloudFront acceder a un bucket S3 privado sin hacer público el bucket?',
        options: [
          { text: 'Origin Access Control (OAC)', isCorrect: true },
          {
            text: 'Habilitar acceso público anónimo en la bucket policy',
            isCorrect: false,
          },
          {
            text: 'Compartir la Access Key del usuario root',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 24. Azure Fundamentals
  {
    title: 'Microsoft Azure Fundamentals: App Services, VNets y Azure SQL',
    category: 'Azure',
    level: 'Principiante',
    duration: '16h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Resource Groups y jerarquía de suscripciones',
      'Azure App Services para Linux y Windows',
      'Virtual Networks y Network Security Groups (NSG)',
      'Azure SQL Database y reglas de firewall',
    ],
    description:
      'Descubre el ecosistema cloud de Microsoft. Crea Virtual Networks (VNets), despliega aplicaciones web gestionadas con Azure App Services y administra bases relacionales con Azure SQL.',
    modules: [
      {
        title:
          'Módulo 1: Organización Jerárquica: Suscripciones, Resource Groups y Regiones Azure',
        lessons: [
          'Estructura de gestión en Azure: Management Groups, Suscripciones y Resource Groups',
          'Regiones globales de Azure y Zonas de Disponibilidad para resiliencia',
          'Instalación y autenticación con Azure CLI (az login) y Azure Cloud Shell',
        ],
      },
      {
        title:
          'Módulo 2: Alojamiento Administrado de Aplicaciones con Azure App Services',
        lessons: [
          'Planes de App Service (Free, Basic, Standard, Premium) y capacidad de cómputo',
          'Despliegue de aplicaciones Node.js, Python o .NET sobre Linux containers',
          'Gestión de variables de entorno seguras con Application Settings y Connection Strings',
        ],
      },
      {
        title:
          'Módulo 3: Redes Virtuales (VNets), Subredes y Reglas de Network Security Groups (NSGs)',
        lessons: [
          'Creación de Azure Virtual Networks (VNet) y segmentación de subredes',
          'Filtrado de tráfico entrante y saliente mediante Network Security Groups (NSGs)',
          'Integración de App Services a la VNet mediante VNet Integration',
        ],
      },
      {
        title:
          'Módulo 4: Aprovisionamiento y Conexión Segura a Azure SQL Database',
        lessons: [
          'Aprovisionamiento de servidores lógicos de Azure SQL y bases de datos individuales',
          'Modelos de compra: DTUs basados en transacciones vs vCore para flexibilidad',
          'Reglas de firewall a nivel de servidor y habilitación de Service Endpoints privados',
        ],
      },
      {
        title:
          'Módulo 5: Monitorización de Rendimiento y Alertas con Azure Monitor',
        lessons: [
          'Recolección de telemetría con Application Insights integrada en App Services',
          'Creación de métricas de rendimiento y dashboards en el portal de Azure',
          'Configuración de reglas de alerta por uso excesivo de CPU y tiempo de respuesta',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Despliegue de Web App y Azure SQL Database',
    practicalInstructions:
      'Crea un App Service conectado a una base de datos Azure SQL. Configura los Connection Strings en la app y define reglas de firewall restringidas.',
    practicalRubric:
      '1. Configuración de App Service y variables de entorno (40%)\n2. Seguridad de Azure SQL y firewall (30%)\n3. Reporte PDF con evidencias desde Azure Portal (30%)',
    practicalPdfName: 'Caso_Practico_Azure_Fundamentals.pdf',
    questions: [
      {
        text: '¿Cuál es el contenedor lógico que agrupa recursos relacionados para gestionar su ciclo de vida y permisos en Azure?',
        options: [
          { text: 'Resource Group', isCorrect: true },
          { text: 'Tenant de Entra ID', isCorrect: false },
          { text: 'Virtual Network', isCorrect: false },
        ],
      },
    ],
  },

  // 25. Azure AKS
  {
    title:
      'Azure Kubernetes Service (AKS): Despliegues Empresariales en la Nube',
    category: 'Azure',
    level: 'Avanzado',
    duration: '20h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Creación de AKS con az cli y Terraform',
      'Integración nativa con Azure Container Registry (ACR)',
      'Modelo de red Azure CNI vs Kubenet',
      'Autoscaling de Nodos con AKS Cluster Autoscaler',
    ],
    description:
      'Implementa clústeres Kubernetes profesionales en Microsoft Azure. Integración con Azure Container Registry (ACR), redes Azure CNI, identidad con Entra ID y balanceadores Azure Load Balancer.',
    modules: [
      {
        title:
          'Módulo 1: Creación y Arquitectura de Clústeres AKS con Azure CLI',
        lessons: [
          'Arquitectura del plano de control administrado por Azure sin costo por hora base',
          'Creación del clúster con az aks create definiendo grupos de nodos (Node Pools)',
          'Obtención de credenciales locales con az aks get-credentials y prueba con kubectl',
        ],
      },
      {
        title:
          'Módulo 2: Integración con Azure Container Registry (ACR) y Permisos Managed Identity',
        lessons: [
          'Aprovisionamiento de Azure Container Registry con replicación geográfica',
          'Vinculación automática con AKS mediante az aks update --attach-acr',
          'Autenticación sin secretos estáticos utilizando Azure Managed Identities',
        ],
      },
      {
        title:
          'Módulo 3: Modelos de Red en Azure: Kubenet vs Azure CNI y Políticas de Red',
        lessons: [
          'Comparativa: Kubenet con enrutamiento NAT vs Azure CNI donde cada Pod recibe IP de la VNet',
          'Asignación de espacio de direcciones IP suficiente para clústeres a escala',
          'Seguridad de red entre pods con Azure Network Policies y Calico en AKS',
        ],
      },
      {
        title:
          'Módulo 4: Almacenamiento Persistente con Azure Disks y Azure Files CSI Drivers',
        lessons: [
          'Uso de StorageClasses gestionadas: managed-csi (Azure Disk) para baja latencia',
          'Almacenamiento compartido multi-pod mediante azurefile-csi (SMB/NFS)',
          'Configuración de snapshots de volumen automáticos para copias de seguridad',
        ],
      },
      {
        title:
          'Módulo 5: Autoescalado de Clúster, Node Pools y Exposición con Azure Load Balancer',
        lessons: [
          'Configuración del Cluster Autoscaler de AKS para añadir nodos automáticamente',
          'Uso de System Node Pools y User Node Pools con instancias Spot para reducir costos',
          'Exposición de servicios web públicos mediante Azure Standard Load Balancer',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Despliegue de Aplicación en AKS con ACR',
    practicalInstructions:
      'Construye y sube una imagen a Azure Container Registry. Despliégala en AKS asegurando la comunicación autenticada y expón el servicio con una IP pública.',
    practicalRubric:
      '1. Creación de clúster y enlace ACR autenticado (40%)\n2. Manifiestos de Deployment y Service LoadBalancer (30%)\n3. Reporte PDF con evidencias de comandos y endpoint (30%)',
    practicalPdfName: 'Caso_Practico_Azure_AKS.pdf',
    questions: [
      {
        text: '¿Qué comando de Azure CLI otorga al clúster AKS permisos automáticos para descargar imágenes desde un Azure Container Registry (ACR)?',
        options: [
          { text: 'az aks update --attach-acr <nombre_acr>', isCorrect: true },
          { text: 'az acr login --public', isCorrect: false },
          { text: 'az aks permit acr --all', isCorrect: false },
        ],
      },
    ],
  },

  // 26. Azure Container Apps
  {
    title: 'Azure Container Apps y Microservicios Serverless con Dapr',
    category: 'Azure',
    level: 'Intermedio',
    duration: '14h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Azure Container Apps Environment',
      'Escalado basado en peticiones HTTP con KEDA',
      'Integración de Distributed Application Runtime (Dapr)',
      'Ingress administrado y dominios personalizados',
    ],
    description:
      'La forma moderna de correr contenedores en Azure sin administrar clústeres Kubernetes complejos. Escalado a cero con KEDA, microservicios orientados a eventos y Dapr integrado.',
    modules: [
      {
        title:
          'Módulo 1: Introducción a Azure Container Apps y Comparativa con AKS',
        lessons: [
          '¿Qué es Container Apps? Abstracción serverless sobre Kubernetes gestionado',
          'Comparativa: Cuándo elegir Azure App Service, AKS o Container Apps',
          'Creación del Container Apps Environment como límite de seguridad y red',
        ],
      },
      {
        title:
          'Módulo 2: Despliegue de Contenedores y Configuración de Ingress Administrado',
        lessons: [
          'Despliegue de imágenes desde Docker Hub y Azure Container Registry',
          'Configuración de Ingress público o privado con terminación TLS automática',
          'Manejo de revisiones de contenedor y división de tráfico porcentual',
        ],
      },
      {
        title:
          'Módulo 3: Autoescalado Orientado a Eventos con KEDA y Escalado a Cero',
        lessons: [
          'Reglas de escalado HTTP: Concurrencia de peticiones simultáneas por réplica',
          'Escalado a cero (minReplicas 0) para eliminar costos en momentos de inactividad',
          'Escalado basado en colas de mensajes con Azure Service Bus y Redis',
        ],
      },
      {
        title:
          'Módulo 4: Integración del Distributed Application Runtime (Dapr) para Microservicios',
        lessons: [
          'Habilitación nativa de Dapr en Azure Container Apps sin configuración compleja',
          'Invocación de servicios punto a punto con descubrimiento y reintentos automáticos',
          'Patrón Pub/Sub desacoplado con componentes Dapr administrados',
        ],
      },
      {
        title:
          'Módulo 5: Secretos con Azure Key Vault y Dominios Personalizados con SSL',
        lessons: [
          'Vinculación de secretos de Azure Key Vault con Managed Identity',
          'Asignación de nombres de dominio personalizados con verificación DNS',
          'Generación y renovación automática de certificados SSL gratuitos administrados por Azure',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Despliegue de Microservicio Serverless en Container Apps',
    practicalInstructions:
      'Despliega una Container App en Azure con reglas de escalado KEDA basadas en peticiones HTTP simultáneas (concurrencia). Documenta el escalado dinámico.',
    practicalRubric:
      '1. Despliegue y configuración de Container App (40%)\n2. Reglas de escalado KEDA verificadas (30%)\n3. Reporte PDF con pruebas de concurrencia (30%)',
    practicalPdfName: 'Caso_Practico_Azure_Container_Apps.pdf',
    questions: [
      {
        text: '¿Qué tecnología de autoescalado utiliza internamente Azure Container Apps para permitir escalar réplicas incluso a cero?',
        options: [
          {
            text: 'KEDA (Kubernetes Event-driven Autoscaling)',
            isCorrect: true,
          },
          { text: 'Cron nativo de Linux', isCorrect: false },
          { text: 'Azure Automation Runbooks', isCorrect: false },
        ],
      },
    ],
  },

  // 27. GitHub Actions
  {
    title: 'CI/CD Pipelines Profesionales con GitHub Actions y Docker',
    category: 'CI/CD',
    level: 'Intermedio',
    duration: '16h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Eventos de disparo (push, pull_request, workflow_dispatch)',
      'Matriz de ejecución (matrix builds) para múltiples versiones',
      'Manejo seguro de credenciales con GitHub Secrets',
      'Despliegue automático con SSH / Cloud CLI',
    ],
    description:
      'Automatiza el ciclo de vida de tu software. Creación de workflows con GitHub Actions, testing automático, compilación multi-etapa de imágenes Docker y despliegue continuo a la nube.',
    modules: [
      {
        title:
          'Módulo 1: Fundamentos de GitHub Actions: Workflows, Triggers, Jobs y Steps',
        lessons: [
          'Estructura de la carpeta .github/workflows y sintaxis básica de archivos YAML',
          'Eventos de activación: push, pull_request, schedules cron y manual con workflow_dispatch',
          'Ejecución concurrente y secuencial de Jobs con dependencies (needs)',
        ],
      },
      {
        title:
          'Módulo 2: Runners Oficiales, Entornos de Ejecución y Pruebas Unitarias Automatizadas',
        lessons: [
          'Runners hospedados por GitHub (ubuntu-latest, macos, windows) vs self-hosted',
          'Configuración de entornos con actions oficiales: actions/checkout y actions/setup-node',
          'Ejecución de suites de pruebas unitarias y generación de reportes de cobertura de código',
        ],
      },
      {
        title:
          'Módulo 3: Compilación y Publicación de Imágenes Docker en Registries con GitHub Secrets',
        lessons: [
          'Uso seguro de GitHub Secrets y Variables de entorno a nivel de repositorio y organización',
          'Autenticación y compilación con docker/login-action y docker/build-push-action',
          'Publicación automática en Docker Hub y GitHub Container Registry (ghcr.io)',
        ],
      },
      {
        title:
          'Módulo 4: Estrategias de Despliegue Continuo (CD) hacia Servidores Cloud por SSH',
        lessons: [
          'Configuración de llaves privadas SSH en secretos de GitHub para acceso seguro a servidores',
          'Despliegue automatizado con SSH action ejecutando docker compose pull && docker compose up -d',
          'Protección de ambientes con GitHub Environments y aprobaciones manuales requeridas',
        ],
      },
      {
        title:
          'Módulo 5: Optimización de Pipelines con Caché de Dependencias y Matrix Builds',
        lessons: [
          'Aceleración radical de pipelines utilizando actions/cache para paquetes npm/pip/go',
          'Construcción y pruebas en múltiples versiones simultáneas mediante matrices (strategy: matrix)',
          'Notificaciones automáticas del estado del pipeline a Slack, Discord o correos electrónicos',
        ],
      },
    ],
    practicalTitle: 'Caso Práctico: Pipeline Completo de Build, Test y Deploy',
    practicalInstructions:
      'Crea un workflow en .github/workflows/deploy.yml que ejecute pruebas unitarias, compile una imagen Docker, la publique en un registro y la despliegue en un servidor.',
    practicalRubric:
      '1. Estructura y seguridad del workflow (40%)\n2. Manejo de secretos y ambientes en GitHub (30%)\n3. Reporte PDF con logs de ejecución exitosa del pipeline (30%)',
    practicalPdfName: 'Caso_Practico_GitHub_Actions_CICD.pdf',
    questions: [
      {
        text: '¿Cómo se accede de forma segura a una clave de API confidencial guardada en la configuración del repositorio en GitHub Actions?',
        options: [
          { text: '${{ secrets.MI_VARIABLE_SECRETA }}', isCorrect: true },
          { text: '$ENV_MI_VARIABLE_SECRETA en texto plano', isCorrect: false },
          {
            text: 'Leyendo un archivo .env subido al repositorio Git',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 28. Terraform
  {
    title: 'Infraestructura como Código (IaC) con Terraform en AWS y Azure',
    category: 'DevOps',
    level: 'Avanzado',
    duration: '22h de video',
    rating: 5.0,
    imageUrl:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Comandos terraform init, plan, apply y destroy',
      'Remote State en Amazon S3 con DynamoDB State Locking',
      'Módulos reutilizables para VPC, EC2 y Kubernetes',
      'Manejo de variables y archivos terraform.tfvars',
    ],
    description:
      'Gestiona tu infraestructura de nube como código declarativo y versionable. Providers, recursos, variables, outputs, módulos reutilizables y manejo del Remote State con locking.',
    modules: [
      {
        title:
          'Módulo 1: Principios de IaC y Sintaxis del Lenguaje HashiCorp Configuration Language (HCL)',
        lessons: [
          '¿Por qué Infraestructura como Código? Enfoque declarativo frente a scripts imperativos',
          'Sintaxis de bloques HCL: terraform, provider, resource, variable y output',
          'Ciclo de vida básico de comandos: terraform init, fmt, validate, plan y apply',
        ],
      },
      {
        title:
          'Módulo 2: Configuración de Providers Cloud, Autenticación y Ciclo de Vida (Plan/Apply)',
        lessons: [
          'Configuración de proveedores oficiales (hashicorp/aws, hashicorp/azurerm)',
          'Autenticación segura mediante variables de entorno y perfiles de AWS CLI / Azure CLI',
          'Análisis predictivo de cambios en el plan de ejecución antes de aplicar en producción',
        ],
      },
      {
        title:
          'Módulo 3: Gestión Segura del Estado Remoto con S3 y Bloqueo Concurrente con DynamoDB',
        lessons: [
          'El rol crítico del archivo terraform.tfstate y los riesgos de versionarlo en Git',
          'Configuración del backend remoto en Amazon S3 con cifrado en reposo habilitado',
          'Bloqueo de estado concurrente con Amazon DynamoDB para prevenir corrupción en equipos',
        ],
      },
      {
        title:
          'Módulo 4: Creación de Módulos Reutilizables para Redes, Servidores y Almacenamiento',
        lessons: [
          'Arquitectura de módulos en Terraform: inputs (variables), lógica (main) y outputs',
          'Desarrollo de un módulo de VPC personalizada y reutilización en múltiples ambientes',
          'Consumo de módulos públicos desde el Terraform Registry',
        ],
      },
      {
        title:
          'Módulo 5: Manejo de Variables, Outputs, Terraform Workspaces y Destrucción Controlada',
        lessons: [
          'Estructuras de variables complejas: objects, maps, lists y validaciones de datos',
          'Gestión de múltiples entornos con Terraform Workspaces o carpetas estructuradas',
          'Destrucción controlada de recursos con terraform destroy y prevención de borrado accidental',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Aprovisionamiento de Infraestructura Multi-Entorno',
    practicalInstructions:
      'Escribe un módulo en Terraform para desplegar una VPC con subredes y un servidor web con Security Group. Configura backend remoto en S3 con state locking.',
    practicalRubric:
      '1. Calidad del código HCL y variables (40%)\n2. Backend remoto y plan sin drift (30%)\n3. Reporte PDF con salidas de terraform plan y apply (30%)',
    practicalPdfName: 'Caso_Practico_Terraform_IaC.pdf',
    questions: [
      {
        text: '¿Por qué es fundamental configurar State Locking (por ejemplo con DynamoDB en AWS) al trabajar en equipo con Terraform?',
        options: [
          {
            text: 'Para prevenir que dos ingenieros ejecuten terraform apply al mismo tiempo y corrompan el archivo de estado de la infraestructura',
            isCorrect: true,
          },
          {
            text: 'Para impedir que los usuarios eliminen recursos desde la consola web',
            isCorrect: false,
          },
          { text: 'Para cifrar el código fuente en GitHub', isCorrect: false },
        ],
      },
    ],
  },

  // 29. Ansible
  {
    title: 'Automatización y Aprovisionamiento de Servidores con Ansible',
    category: 'DevOps',
    level: 'Intermedio',
    duration: '15h de video',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Arquitectura Agentless basada en SSH y Python',
      'Módulos idempotentes: apt, systemd, copy, template Jinja2',
      'Estructura de Roles y Ansible Galaxy',
      'Cifrado de variables sensibles con Ansible Vault',
    ],
    description:
      'Automatiza la configuración de flotas de servidores sin agentes (agentless) mediante SSH. Inventarios dinámicos, Playbooks YAML, variables, roles reutilizables y Ansible Vault para secretos.',
    modules: [
      {
        title:
          'Módulo 1: Arquitectura Agentless de Ansible y Conexión SSH mediante Inventarios',
        lessons: [
          'Ventajas del modelo sin agentes (Agentless): Solo requiere SSH y Python en los hosts remotos',
          'Configuración del archivo de inventario (hosts.ini / inventory.yaml) con grupos de servidores',
          'Comprobación de conectividad masiva mediante el módulo ad-hoc ansible all -m ping',
        ],
      },
      {
        title:
          'Módulo 2: Comandos Ad-Hoc y Primeros Playbooks YAML Idempotentes',
        lessons: [
          'Ejecución de comandos ad-hoc rápidos para inspección de flotas de servidores',
          'Estructura de un Playbook YAML: hosts, become (sudo), vars y tareas (tasks)',
          'Concepto de idempotencia: Garantizar el estado deseado sin cambios redundantes',
        ],
      },
      {
        title:
          'Módulo 3: Módulos Fundamentales: Paquetes (apt/yum), Archivos, Servicios y Handlers',
        lessons: [
          'Gestión de paquetes con módulos nativos apt, dnf y pip',
          'Copia y permisos de archivos con copy, file y sincronización con synchronize',
          'Control del estado de servicios con systemd y disparadores de reinicio con handlers',
        ],
      },
      {
        title:
          'Módulo 4: Modularización Avanzada con Roles de Ansible y Plantillas Dinámicas Jinja2',
        lessons: [
          'Estructura estándar de un rol: tasks, handlers, templates, files, vars y defaults',
          'Generación dinámica de archivos de configuración mediante plantillas Jinja2 (.j2)',
          'Reutilización de roles comunitarios certificados desde Ansible Galaxy',
        ],
      },
      {
        title:
          'Módulo 5: Cifrado de Secretos con Ansible Vault y Despliegue Automatizado de Stacks',
        lessons: [
          'Protección de contraseñas y claves privadas con cifrado simétrico mediante ansible-vault',
          'Ejecución de playbooks cifrados con --ask-vault-pass o archivos de contraseña',
          'Playbook completo de aprovisionamiento: Usuario no-root, Docker, Nginx y Firewall',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Playbook de Aprovisionamiento Completo de Nginx y Node',
    practicalInstructions:
      'Escribe un playbook en Ansible que configure un servidor Linux desde cero: cree un usuario no-root, instale Docker y Nginx, y configure el firewall UFW.',
    practicalRubric:
      '1. Idempotencia y estructura de tareas (40%)\n2. Uso de handlers y variables seguras (30%)\n3. Reporte PDF con evidencias de ejecución en verde (ok/changed) (30%)',
    practicalPdfName: 'Caso_Practico_Ansible_Automation.pdf',
    questions: [
      {
        text: '¿Qué significa que las tareas en un Playbook de Ansible sean "idempotentes"?',
        options: [
          {
            text: 'Que ejecutar el playbook múltiples veces produce el mismo resultado final sin realizar cambios innecesarios si el estado deseado ya existe',
            isCorrect: true,
          },
          {
            text: 'Que siempre reinicia todos los servicios en cada ejecución',
            isCorrect: false,
          },
          {
            text: 'Que requiere instalar un agente en cada servidor remoto',
            isCorrect: false,
          },
        ],
      },
    ],
  },

  // 30. Observabilidad OpenTelemetry
  {
    title:
      'Observabilidad Completa de Microservicios: OpenTelemetry, Loki y Grafana',
    category: 'DevOps',
    level: 'Avanzado',
    duration: '18h de video',
    rating: 4.9,
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    instructorEmail: 'docente2@deployapp.com',
    features: [
      'Los 3 pilares: Métricas, Logs y Trazas Distribuidas',
      'OpenTelemetry Collector (Receivers, Processors, Exporters)',
      'Centralización de logs de alta velocidad con Grafana Loki',
      'Distributed Tracing con Tempo / Jaeger',
    ],
    description:
      'Domina los 3 pilares de la observabilidad moderna: métricas, logs centralizados y trazas distribuidas. Instrumenta código con OpenTelemetry SDK, envía a OTel Collector y visualiza en Grafana.',
    modules: [
      {
        title:
          'Módulo 1: Los 3 Pilares de la Observabilidad Moderna: Métricas, Logs y Trazas',
        lessons: [
          'Diferencias entre monitoreo tradicional reactivo y observabilidad proactiva',
          'La convergencia del estándar abierto OpenTelemetry (OTel) respaldado por la CNCF',
          'Correlación de telemetría: Cómo conectar una alerta a un log específico y a su traza distribuida',
        ],
      },
      {
        title:
          'Módulo 2: Instrumentación de Aplicaciones con OpenTelemetry SDK',
        lessons: [
          'Instrumentación automática con auto-instrumentation agents en Node.js, Java y Python',
          'Instrumentación manual para capturar spans personalizados y atributos de negocio',
          'Propagación del contexto distribuido mediante la especificación W3C Trace Context (traceparent)',
        ],
      },
      {
        title:
          'Módulo 3: Configuración del OpenTelemetry Collector: Receivers, Processors y Exporters',
        lessons: [
          'Arquitectura del OTel Collector como agente local o servicio centralizado',
          'Configuración del pipeline de telemetría: Receivers (OTLP gRPC/HTTP), Processors (batch, memory_limiter)',
          'Exportación de datos hacia múltiples backends (Prometheus, Loki, Tempo, Jaeger)',
        ],
      },
      {
        title:
          'Módulo 4: Centralización y Consulta de Logs a Alta Velocidad con Grafana Loki',
        lessons: [
          'Arquitectura sin indexación de texto completo de Loki para ahorro drástico de almacenamiento',
          'Agentes de recolección de logs: Promtail y FluentBit integrados en contenedores',
          'Consultas avanzadas de logs estructurados con el lenguaje LogQL en Grafana',
        ],
      },
      {
        title:
          'Módulo 5: Trazabilidad Distribuida de Extremo a Extremo con Grafana Tempo y Dashboards',
        lessons: [
          'Almacenamiento de trazas de alta escala en almacenamiento de objetos con Grafana Tempo',
          'Navegación visual del Waterfall de spans para detectar cuellos de botella y llamadas lentas a BD',
          'Construcción de dashboards ejecutivos unificados que combinan métricas, logs y trazas',
        ],
      },
    ],
    practicalTitle:
      'Caso Práctico: Instrumentación y Trazabilidad de Microservicios',
    practicalInstructions:
      'Instrumenta dos microservicios con OpenTelemetry SDK. Realiza peticiones entre ellos y captura la traza completa (spans) en Grafana Tempo evidenciando la latencia.',
    practicalRubric:
      '1. Instrumentación y propagación de contexto W3C (40%)\n2. Recolección en OTel Collector y visualización (30%)\n3. Reporte PDF con captura de la cascada de spans (30%)',
    practicalPdfName: 'Caso_Practico_Observabilidad_OpenTelemetry.pdf',
    questions: [
      {
        text: '¿Cuál es la función del Traceparent en la especificación W3C Trace Context utilizada por OpenTelemetry?',
        options: [
          {
            text: 'Propagar el Trace ID y Span ID en las cabeceras HTTP entre servicios para mantener la correlación de la solicitud distribuida',
            isCorrect: true,
          },
          { text: 'Autenticar la llamada con un token JWT', isCorrect: false },
          { text: 'Comprimir el contenido JSON del payload', isCorrect: false },
        ],
      },
    ],
  },
];

async function seedRoles(): Promise<Map<string, string>> {
  console.log('🌱 Iniciando seeder de roles...');
  const rolesMap = new Map<string, string>();

  await Promise.all(
    ROLES.map(async (role) => {
      const existingRole = await prisma.role.findUnique({
        where: { name: role.name },
      });

      if (existingRole) {
        rolesMap.set(existingRole.name, existingRole.id);
        console.log(
          `⏭️ Rol ya existe, omitiendo: ${existingRole.name} (UUID: ${existingRole.id})`,
        );
      } else {
        const createdRole = await prisma.role.create({
          data: {
            name: role.name,
            description: role.description,
          },
        });
        rolesMap.set(createdRole.name, createdRole.id);
        console.log(
          `✅ Rol creado: ${createdRole.name} (UUID: ${createdRole.id})`,
        );
      }
    }),
  );

  console.log('✨ Verificación de roles completada.');
  return rolesMap;
}

async function seedSuperAdmin(rolesMap: Map<string, string>) {
  console.log('🌱 Iniciando seeder de usuario SUPERADMIN...');

  const superAdminRoleId = rolesMap.get('SUPERADMIN');
  if (!superAdminRoleId) {
    throw new Error(
      'No se encontró el rol SUPERADMIN para vincular al usuario',
    );
  }

  const superAdminEmail = (
    process.env.SUPERADMIN_EMAIL ?? 'superadmin@deployapp.com'
  )
    .toLowerCase()
    .trim();
  const superAdminPassword =
    process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin123*';
  const superAdminName = process.env.SUPERADMIN_NAME ?? 'Super Administrador';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
    include: { role: true },
  });

  if (existingSuperAdmin) {
    console.log(
      `⏭️ Usuario SUPERADMIN ya existe (${existingSuperAdmin.email}), omitiendo creación.`,
    );
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(superAdminPassword, saltRounds);

    const superAdminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: passwordHash,
        name: superAdminName,
        lastname: 'Root',
        phone: '000000000',
        isActive: true,
        roleId: superAdminRoleId,
      },
      include: {
        role: true,
      },
    });

    console.log(`✅ Usuario SUPERADMIN creado: ${superAdminUser.email}`);
  }
}

async function seedTestUsers(rolesMap: Map<string, string>) {
  console.log('🌱 Iniciando seeder de usuarios de prueba...');

  const TEST_USERS = [
    {
      email: 'admin@deployapp.com',
      password: 'AdminPassword123*',
      name: 'Admin',
      lastname: 'Principal',
      phone: '111111111',
      role: 'SUPERADMIN',
    },
    {
      email: 'docente@deployapp.com',
      password: 'DocentePassword123*',
      name: 'Marco',
      lastname: 'Morales (DevOps & Cloud)',
      phone: '222222222',
      role: 'DOCENTE',
    },
    {
      email: 'docente2@deployapp.com',
      password: 'DocentePassword123*',
      name: 'Elena',
      lastname: 'Vargas (SysAdmin & Cloud)',
      phone: '444444444',
      role: 'DOCENTE',
    },
    {
      email: 'user@deployapp.com',
      password: 'UserPassword123*',
      name: 'Standard',
      lastname: 'Usuario',
      phone: '333333333',
      role: 'USER',
    },
  ];

  for (let i = 1; i <= 27; i++) {
    TEST_USERS.push({
      email: `testuser${i}@deployapp.com`,
      password: `TestUser123*`,
      name: `Test`,
      lastname: `Usuario ${i}`,
      phone: `555000${i.toString().padStart(3, '0')}`,
      role: 'USER',
    });
  }

  await Promise.all(
    TEST_USERS.map(async (testUser) => {
      const roleId = rolesMap.get(testUser.role);
      if (!roleId) return;

      const existingUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      if (!existingUser) {
        const passwordHash = await bcrypt.hash(testUser.password, 10);
        const createdUser = await prisma.user.create({
          data: {
            email: testUser.email,
            password: passwordHash,
            name: testUser.name,
            lastname: testUser.lastname,
            phone: testUser.phone,
            isActive: true,
            roleId,
          },
        });
        console.log(
          `✅ Usuario de prueba creado: ${createdUser.email} (Rol: ${testUser.role})`,
        );
      }
    }),
  );
}

async function seedAchievements() {
  console.log('🌱 Iniciando seeder de logros (achievements)...');

  await Promise.all(
    ACHIEVEMENTS.map(async (achievement) => {
      const existing = await prisma.achievement.findFirst({
        where: { name: achievement.name },
      });

      if (!existing) {
        const created = await prisma.achievement.create({
          data: achievement,
        });
        console.log(
          `✅ Logro creado: ${created.name} (orden: ${created.orden})`,
        );
      }
    }),
  );
}

async function seedCourses() {
  console.log(
    '🌱 Iniciando seeder de 30 Cursos con al menos 5 Módulos temáticos cada uno...',
  );

  const docente1 = await prisma.user.findUnique({
    where: { email: 'docente@deployapp.com' },
  });
  const docente2 = await prisma.user.findUnique({
    where: { email: 'docente2@deployapp.com' },
  });
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'superadmin@deployapp.com' },
  });
  const standardUser = await prisma.user.findFirst({
    where: { email: 'user@deployapp.com' },
  });

  for (let i = 0; i < COURSES_30_DATA.length; i++) {
    const data = COURSES_30_DATA[i];
    const instructor =
      data.instructorEmail === 'docente2@deployapp.com'
        ? (docente2 ?? docente1)
        : docente1;

    const totalLessons = data.modules.reduce(
      (acc, m) => acc + m.lessons.length,
      0,
    );

    let course = await prisma.course.findFirst({
      where: {
        OR: [
          { title: data.title },
          i === 0
            ? { title: 'Docker & Contenedores: De Cero a Experto' }
            : { title: data.title },
        ],
      },
      include: {
        modules: true,
      },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          level: data.level,
          duration: data.duration,
          lessonsCount: totalLessons,
          rating: data.rating,
          instructorId: instructor?.id,
          imageUrl: data.imageUrl,
          features: data.features,
          isActive: true,
        },
        include: {
          modules: true,
        },
      });
      console.log(
        `✅ [${i + 1}/30] Curso creado: "${course.title}" (${data.category})`,
      );
    } else {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          level: data.level,
          duration: data.duration,
          lessonsCount: totalLessons,
          rating: data.rating,
          instructorId: instructor?.id,
          imageUrl: data.imageUrl,
          features: data.features,
          isActive: true,
        },
      });
      console.log(`🔄 [${i + 1}/30] Curso actualizado: "${course.title}"`);
    }

    // Asegurar que existan exactamente los 5 módulos temáticos específicos del curso
    if (
      course.modules.length < 5 ||
      course.modules.length !== data.modules.length
    ) {
      // Eliminar módulos previos para regenerar los 5 módulos completos con sus lecciones
      await prisma.module.deleteMany({
        where: { courseId: course.id },
      });

      for (let mIdx = 0; mIdx < data.modules.length; mIdx++) {
        const modDef = data.modules[mIdx];
        await prisma.module.create({
          data: {
            title: modDef.title,
            order: mIdx + 1,
            courseId: course.id,
            lessons: {
              create: modDef.lessons.map((lesTitle, lesIdx) => ({
                title: lesTitle,
                duration: `${10 + ((mIdx + lesIdx) % 8) * 2}:30 min`,
                type: 'VIDEO',
                order: lesIdx + 1,
                resources: {
                  create: [
                    {
                      name: `Guia_Estudio_${data.category}_M${mIdx + 1}.pdf`,
                      type: 'PDF',
                      size: `${(1.5 + (mIdx + lesIdx) * 0.3).toFixed(1)} MB`,
                      url: '#',
                    },
                  ],
                },
                quizzes: {
                  create: [
                    {
                      title: `Evaluación de la Lección ${lesIdx + 1}`,
                      questions: {
                        create: [
                          {
                            text: `¿Cuál es el principio fundamental abordado en "${lesTitle}"?`,
                            options: {
                              create: [
                                {
                                  text: 'Configuración estándar recomendada para entornos productivos',
                                  isCorrect: true,
                                },
                                {
                                  text: 'Comportamiento obsoleto desaconsejado en producción',
                                  isCorrect: false,
                                },
                                {
                                  text: 'Opción no recomendada por falta de resiliencia',
                                  isCorrect: false,
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              })),
            },
          },
        });
      }
      console.log(`   📚 5 módulos creados y poblados para: "${course.title}"`);
    }

    // Examen final (teórico + caso práctico con PDF)
    const existingExam = await prisma.finalExam.findUnique({
      where: { courseId: course.id },
    });

    if (!existingExam) {
      await prisma.finalExam.create({
        data: {
          courseId: course.id,
          title: `Examen Teórico Final: ${course.title}`,
          practicalTitle: data.practicalTitle,
          practicalInstructions: data.practicalInstructions,
          practicalRubric: data.practicalRubric,
          practicalPdfUrl:
            'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          practicalPdfName: data.practicalPdfName,
          questions: {
            create: data.questions.map((q) => ({
              text: q.text,
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })),
              },
            })),
          },
        },
      });
      console.log(
        `   📝 Examen Final teórico y práctico creado para: ${course.title}`,
      );
    } else {
      await prisma.finalExam.update({
        where: { id: existingExam.id },
        data: {
          practicalTitle: data.practicalTitle,
          practicalInstructions: data.practicalInstructions,
          practicalRubric: data.practicalRubric,
          practicalPdfName: data.practicalPdfName,
          practicalPdfUrl:
            existingExam.practicalPdfUrl ||
            'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        },
      });
    }

    // Inscribir al superadministrador en los 30 cursos
    if (superAdmin) {
      const isEven = i % 2 === 0;
      const progressValue = Math.max(15, 100 - i * 3);
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId: superAdmin.id,
            courseId: course.id,
          },
        },
        create: {
          userId: superAdmin.id,
          courseId: course.id,
          status: isEven ? 'COMPLETED' : 'ENROLLED',
          progress: progressValue,
        },
        update: {},
      });
    }

    // Inscribir al usuario estándar (user@deployapp.com) en un grupo representativo de cursos
    const userEnrolledIndices = [0, 1, 5, 12, 14, 18, 23, 26];
    if (standardUser && userEnrolledIndices.includes(i)) {
      const isCompleted = i === 0 || i === 12;
      const userProgress = isCompleted ? 100 : Math.max(20, 85 - i * 2);

      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId: standardUser.id,
            courseId: course.id,
          },
        },
        create: {
          userId: standardUser.id,
          courseId: course.id,
          status: isCompleted ? 'COMPLETED' : 'ENROLLED',
          progress: userProgress,
        },
        update: {
          status: isCompleted ? 'COMPLETED' : 'ENROLLED',
          progress: userProgress,
        },
      });

      // Intentos de examen para pruebas
      const exam = await prisma.finalExam.findUnique({
        where: { courseId: course.id },
      });

      if (exam && isCompleted) {
        const existingAttempt = await prisma.finalExamAttempt.findFirst({
          where: { examId: exam.id, userId: standardUser.id },
        });

        if (!existingAttempt) {
          if (i === 0) {
            await prisma.finalExamAttempt.create({
              data: {
                userId: standardUser.id,
                examId: exam.id,
                score: 18.5,
                total: 3,
                passed: true,
                theoreticalScore: 19.0,
                theoreticalTotal: 3,
                theoreticalCorrect: 3,
                theoreticalPassed: true,
                practicalFileUrl:
                  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                practicalFileName: 'Resolucion_Laboratorio_Docker_User.pdf',
                practicalSubmittedAt: new Date(),
                practicalStatus: 'GRADED',
                practicalScore: 18.0,
                practicalFeedback:
                  'Excelente implementación del Dockerfile multi-stage y aislamiento de redes bridge.',
                practicalGradedAt: new Date(),
                gradedById: instructor?.id,
              },
            });

            await prisma.certificate.upsert({
              where: {
                userId_courseId: {
                  userId: standardUser.id,
                  courseId: course.id,
                },
              },
              create: {
                userId: standardUser.id,
                courseId: course.id,
                score: 18.5,
                issuedAt: new Date(),
              },
              update: {
                score: 18.5,
              },
            });
          } else if (i === 12) {
            await prisma.finalExamAttempt.create({
              data: {
                userId: standardUser.id,
                examId: exam.id,
                score: 9.0,
                total: 2,
                passed: false,
                theoreticalScore: 18.0,
                theoreticalTotal: 2,
                theoreticalCorrect: 2,
                theoreticalPassed: true,
                practicalFileUrl:
                  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                practicalFileName: 'Caso_Practico_Linux_Estudiante.pdf',
                practicalSubmittedAt: new Date(),
                practicalStatus: 'PENDING_REVIEW',
              },
            });
          }
        }
      }
    }

    // Inscribir estudiantes de prueba
    const studentNum1 = (i % 25) + 1;
    const studentNum2 = ((i + 7) % 25) + 1;
    const testStudent1 = await prisma.user.findUnique({
      where: { email: `testuser${studentNum1}@deployapp.com` },
    });
    const testStudent2 = await prisma.user.findUnique({
      where: { email: `testuser${studentNum2}@deployapp.com` },
    });

    if (testStudent1) {
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId: testStudent1.id,
            courseId: course.id,
          },
        },
        create: {
          userId: testStudent1.id,
          courseId: course.id,
          status: 'ENROLLED',
          progress: 35,
        },
        update: {},
      });
    }
    if (testStudent2) {
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: {
            userId: testStudent2.id,
            courseId: course.id,
          },
        },
        create: {
          userId: testStudent2.id,
          courseId: course.id,
          status: 'ENROLLED',
          progress: 70,
        },
        update: {},
      });
    }
  }

  console.log(
    '✨ Sembrado de los 30 cursos y sus 5 módulos finalizado con éxito.',
  );
}

async function seedSettings() {
  const DEFAULT_PLATFORM_SETTINGS = {
    platformName: 'DeployLab Academy',
    platformDescription:
      'Plataforma de formación práctica en DevOps, Cloud Architecture y Desarrollo de Software.',
    supportEmail: 'soporte@deploylab.io',
    publicUrl: 'https://deploylab.io',
    certificatePrefix: 'DPLB-CERT',
    timezone: 'America/Bogota (UTC-5)',
    language: 'Español (Latinoamérica)',
    minPassingScore: 14,
    maxExamAttempts: 3,
    minAttendancePercent: 80,
    autoIssueCertificates: true,
    sequentialLessons: true,
    allowStudentComments: true,
    allowPublicRegistration: true,
    requireEmailVerification: false,
    sessionTimeoutHours: 24,
    notifyOnStudentPass: true,
    notifyOnNewRegistration: true,
    notifyOnCertificateIssued: true,
  };

  const SETTINGS_SEEDS: Array<{
    key: string;
    description: string;
    value: Prisma.InputJsonValue;
  }> = [
    {
      key: 'platform_settings',
      description:
        'Configuración global y unificada de la plataforma DeployLab',
      value: DEFAULT_PLATFORM_SETTINGS,
    },
    {
      key: 'general_settings',
      description:
        'Parámetros institucionales visibles en certificados, portal y correos',
      value: {
        platformName: DEFAULT_PLATFORM_SETTINGS.platformName,
        platformDescription: DEFAULT_PLATFORM_SETTINGS.platformDescription,
        supportEmail: DEFAULT_PLATFORM_SETTINGS.supportEmail,
        publicUrl: DEFAULT_PLATFORM_SETTINGS.publicUrl,
        certificatePrefix: DEFAULT_PLATFORM_SETTINGS.certificatePrefix,
        timezone: DEFAULT_PLATFORM_SETTINGS.timezone,
        language: DEFAULT_PLATFORM_SETTINGS.language,
      },
    },
    {
      key: 'academic_settings',
      description:
        'Criterios de evaluación, reglas de cursado y emisión de certificados',
      value: {
        minPassingScore: DEFAULT_PLATFORM_SETTINGS.minPassingScore,
        maxExamAttempts: DEFAULT_PLATFORM_SETTINGS.maxExamAttempts,
        minAttendancePercent: DEFAULT_PLATFORM_SETTINGS.minAttendancePercent,
        autoIssueCertificates: DEFAULT_PLATFORM_SETTINGS.autoIssueCertificates,
        sequentialLessons: DEFAULT_PLATFORM_SETTINGS.sequentialLessons,
        allowStudentComments: DEFAULT_PLATFORM_SETTINGS.allowStudentComments,
      },
    },
    {
      key: 'security_settings',
      description:
        'Políticas de acceso, registro público y expiración de sesiones',
      value: {
        allowPublicRegistration:
          DEFAULT_PLATFORM_SETTINGS.allowPublicRegistration,
        requireEmailVerification:
          DEFAULT_PLATFORM_SETTINGS.requireEmailVerification,
        sessionTimeoutHours: DEFAULT_PLATFORM_SETTINGS.sessionTimeoutHours,
        encryptionAlgorithm: 'Bcrypt (Salt rounds = 10)',
        tokenFormat: 'JSON Web Tokens (JWT) + cookies HttpOnly',
        auditedRoles: ['ADMINISTRADOR', 'DOCENTE', 'ALUMNO'],
      },
    },
    {
      key: 'notification_settings',
      description:
        'Eventos del sistema que disparan notificaciones automáticas',
      value: {
        notifyOnNewRegistration:
          DEFAULT_PLATFORM_SETTINGS.notifyOnNewRegistration,
        notifyOnStudentPass: DEFAULT_PLATFORM_SETTINGS.notifyOnStudentPass,
        notifyOnCertificateIssued:
          DEFAULT_PLATFORM_SETTINGS.notifyOnCertificateIssued,
      },
    },
  ];

  await Promise.all(
    SETTINGS_SEEDS.map(async (item) => {
      const setting = await prisma.setting.upsert({
        where: { key: item.key },
        update: {
          value: item.value,
          description: item.description,
        },
        create: {
          key: item.key,
          value: item.value,
          description: item.description,
        },
      });
      console.log(`✅ Configuración sembrada: "${setting.key}"`);
    }),
  );

  const superAdmin = await prisma.user.findFirst({
    where: { email: 'superadmin@deployapp.com' },
  });

  if (superAdmin) {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: {
        phone: '+51 999 888 777',
        name: 'Super Administrador',
        lastname: 'Root',
      },
    });
  }
}

// ─── Periodos de medición de los indicadores (Anexo 2 de la tesis) ────────────
// Los indicadores se calculan con los intentos de examen de la aplicación.
// Filas: [inicio, fin, grupo]
// IND-01: respuestas correctas / total de ítems · IND-02: tiempo total (min) / tareas evaluadas
// IND-03: incidencias resueltas / incidencias inyectadas

const POST_TEST_PERIODS: [string, string, string][] = [
  ['2026-05-04', '2026-05-15', 'P001-P017'],
  ['2026-05-18', '2026-05-29', 'P018-P034'],
  ['2026-06-01', '2026-06-12', 'P035-P051'],
  ['2026-06-15', '2026-06-26', 'P052-P068'],
  ['2026-06-30', '2026-07-13', 'P069-P085'],
  ['2026-07-14', '2026-07-27', 'P086-P102'],
  ['2026-07-30', '2026-08-12', 'P103-P119'],
  ['2026-08-13', '2026-08-26', 'P120-P136'],
  ['2026-08-27', '2026-09-09', 'P137-P153'],
  ['2026-09-10', '2026-09-23', 'P154-P169'],
];

// Totales del post-test por periodo: [numerador, denominador]. Se reparten entre
// los participantes al sembrar sus intentos de examen (seedPostTestParticipants)
// IND-01: respuestas correctas, total de ítems
const POST_TEST_THEORY: [number, number][] = [
  [2006, 2550],
  [2074, 2550],
  [2142, 2550],
  [2125, 2550],
  [2193, 2550],
  [2244, 2550],
  [2210, 2550],
  [2278, 2550],
  [2261, 2550],
  [2176, 2400],
];
// IND-02: tiempo total (min), tareas evaluadas
const POST_TEST_TIME: [number, number][] = [
  [8840, 340],
  [8160, 340],
  [7480, 340],
  [7140, 340],
  [6630, 340],
  [6460, 340],
  [6290, 340],
  [5950, 340],
  [5780, 340],
  [5280, 320],
];
// IND-03: incidencias resueltas, incidencias inyectadas
const POST_TEST_INCIDENTS: [number, number][] = [
  [765, 1020],
  [799, 1020],
  [833, 1020],
  [816, 1020],
  [867, 1020],
  [884, 1020],
  [850, 1020],
  [901, 1020],
  [918, 1020],
  [880, 960],
];

// ─── Participantes del post-test (evaluaciones registradas en la app) ─────────
// El post-test se aplicó con la aplicación: cada participante P001-P169 tiene un
// intento del examen final cuyas métricas, sumadas por periodo, reproducen
// exactamente los totales de las fichas post-test (IND-01, IND-02 e IND-03).

const POST_TEST_COURSE_TITLE =
  'Docker & Contenedores: De Cero a Experto en Producción';
const PARTICIPANT_PASSWORD = 'Participante123*';
const PRACTICAL_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

// Variación determinista con suma cero por cada 8 participantes
const VARIATION_PATTERN = [-3, 2, -1, 3, -2, 1, 0, 0];

/**
 * Reparte `total` entre `n` participantes con valores enteros variados cuya suma
 * es exactamente `total`. `step` escala la variación y `max` acota cada valor.
 */
function distributeTotal(total: number, n: number, step: number, max: number) {
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  const values = Array.from(
    { length: n },
    (_, i) =>
      base +
      (i < remainder ? 1 : 0) +
      VARIATION_PATTERN[i % VARIATION_PATTERN.length] * step,
  );
  // El último participante absorbe el desfase del ciclo incompleto
  const diff = total - values.reduce((acc, v) => acc + v, 0);
  values[n - 1] += diff;

  if (values.some((v) => v < 0 || v > max)) {
    throw new Error(`No se pudo repartir ${total} entre ${n} participantes`);
  }
  return values;
}

function groupSize(group: string): { from: number; size: number } {
  const [from, to] = group.split('-').map((p) => parseInt(p.slice(1), 10));
  return { from, size: to - from + 1 };
}

// Nombres peruanos para los participantes: se alternan hombres y mujeres y se
// combinan con apellido paterno y materno (la tesis no detalla la composición por sexo)
const PARTICIPANT_MALE_NAMES = [
  'Luis',
  'José',
  'Carlos',
  'Jorge',
  'Juan',
  'Miguel',
  'Diego',
  'Renzo',
  'Piero',
  'Bruno',
  'Gonzalo',
  'Álvaro',
  'Christian',
  'Kevin',
  'Jhon',
  'Edwin',
  'Wilmer',
  'Héctor',
  'Raúl',
  'César',
  'Fernando',
  'Ricardo',
  'Sebastián',
  'Mauricio',
  'Gianfranco',
  'Joel',
  'Elmer',
  'Walter',
  'Percy',
  'Franco',
];
const PARTICIPANT_FEMALE_NAMES = [
  'María',
  'Rosa',
  'Lucía',
  'Milagros',
  'Carmen',
  'Ana',
  'Katherine',
  'Diana',
  'Fiorella',
  'Jimena',
  'Andrea',
  'Valeria',
  'Claudia',
  'Patricia',
  'Gabriela',
  'Yesenia',
  'Lizbeth',
  'Karina',
  'Sofía',
  'Daniela',
  'Mariela',
  'Rocío',
  'Gianella',
  'Pamela',
  'Ximena',
  'Flor',
  'Elizabeth',
  'Nathaly',
  'Luz',
  'Kiara',
];
const PARTICIPANT_SURNAMES = [
  'Quispe',
  'Flores',
  'Sánchez',
  'Rodríguez',
  'García',
  'Rojas',
  'Huamán',
  'Mamani',
  'Ramírez',
  'Chávez',
  'Mendoza',
  'Torres',
  'Vásquez',
  'Castillo',
  'Gutiérrez',
  'Espinoza',
  'Díaz',
  'Ramos',
  'Vargas',
  'Cruz',
  'Pérez',
  'Silva',
  'Condori',
  'Ccahuana',
  'Paredes',
  'Salazar',
  'Herrera',
  'Ticona',
  'Cárdenas',
  'Medina',
  'Aguilar',
  'Romero',
  'Castro',
  'Ayala',
  'Palomino',
  'Villanueva',
  'Zevallos',
  'Valverde',
  'Benites',
  'Cáceres',
];

/** Nombre determinista del participante N (1-169): impares hombres, pares mujeres. */
function participantName(n: number): { name: string; lastname: string } {
  const isFemale = n % 2 === 0;
  const k = Math.floor((n - 1) / 2);
  const firstNames = isFemale
    ? PARTICIPANT_FEMALE_NAMES
    : PARTICIPANT_MALE_NAMES;
  const total = PARTICIPANT_SURNAMES.length;
  const paternalIdx = (k * 7 + (isFemale ? 3 : 0)) % total;
  let maternalIdx = (k * 13 + 11 + (isFemale ? 5 : 0)) % total;
  if (maternalIdx === paternalIdx) maternalIdx = (maternalIdx + 1) % total;

  return {
    name: firstNames[k % firstNames.length],
    lastname: `${PARTICIPANT_SURNAMES[paternalIdx]} ${PARTICIPANT_SURNAMES[maternalIdx]}`,
  };
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

async function seedPostTestParticipants(rolesMap: Map<string, string>) {
  console.log(
    '🌱 Iniciando seeder de participantes del post-test (P001-P169)...',
  );

  const userRoleId = rolesMap.get('USER');
  const course = await prisma.course.findFirst({
    where: { title: POST_TEST_COURSE_TITLE },
    include: { finalExam: true },
  });
  const grader = await prisma.user.findUnique({
    where: { email: 'docente@deployapp.com' },
  });
  if (!userRoleId || !course?.finalExam) {
    throw new Error(
      'Faltan el rol USER o el examen final del curso para el post-test',
    );
  }
  const exam = course.finalExam;
  const passwordHash = await bcrypt.hash(PARTICIPANT_PASSWORD, 10);

  for (const [p, [start, end, group]] of POST_TEST_PERIODS.entries()) {
    const { from, size } = groupSize(group);
    const [correctTotal, itemsTotal] = POST_TEST_THEORY[p];
    const [minutesTotal, tasksTotal] = POST_TEST_TIME[p];
    const [resolvedTotal, injectedTotal] = POST_TEST_INCIDENTS[p];

    // Ítems, tareas e incidencias por participante (150, 20 y 60 en la tesis)
    const itemsEach = itemsTotal / size;
    const tasksEach = tasksTotal / size;
    const injectedEach = injectedTotal / size;

    const correct = distributeTotal(correctTotal, size, 2, itemsEach);
    const minutes = distributeTotal(minutesTotal, size, 10, Infinity);
    const resolved = distributeTotal(resolvedTotal, size, 1, injectedEach);

    const periodStart = new Date(start);
    const periodEnd = new Date(end);
    const periodDays = Math.max(
      1,
      Math.round((periodEnd.getTime() - periodStart.getTime()) / 86_400_000),
    );

    for (let i = 0; i < size; i++) {
      const code = `P${String(from + i).padStart(3, '0')}`;
      const email = `${code.toLowerCase()}@nativelab.pe`;
      const { name, lastname } = participantName(from + i);

      const user = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          password: passwordHash,
          name,
          lastname,
          isActive: true,
          roleId: userRoleId,
        },
        update: { name, lastname },
      });

      await prisma.userCourse.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        create: {
          userId: user.id,
          courseId: course.id,
          status: 'COMPLETED',
          progress: 100,
        },
        update: { status: 'COMPLETED', progress: 100 },
      });

      const theoreticalScore = round2((correct[i] / itemsEach) * 20);
      const practicalScore = round1((resolved[i] / injectedEach) * 20);
      const score = round2((theoreticalScore + practicalScore) / 2);
      const passed = score >= 15;
      const submittedAt = new Date(
        periodStart.getTime() + ((i % periodDays) + 0.5) * 86_400_000,
      );

      const attemptData = {
        score,
        total: itemsEach,
        passed,
        theoreticalScore,
        theoreticalTotal: itemsEach,
        theoreticalCorrect: correct[i],
        theoreticalPassed: theoreticalScore >= 15,
        practicalFileUrl: PRACTICAL_PDF_URL,
        practicalFileName: `Post_Test_${code}.pdf`,
        practicalSubmittedAt: submittedAt,
        practicalStatus: 'GRADED',
        practicalScore,
        practicalFeedback: `Post-test periodo ${p + 1} (${group}).`,
        practicalGradedAt: periodEnd,
        gradedById: grader?.id ?? null,
        practicalTasksEvaluated: tasksEach,
        practicalTotalMinutes: minutes[i],
        incidentsInjected: injectedEach,
        incidentsResolved: resolved[i],
        createdAt: submittedAt,
      };

      const existingAttempt = await prisma.finalExamAttempt.findFirst({
        where: { userId: user.id, examId: exam.id },
      });
      if (existingAttempt) {
        await prisma.finalExamAttempt.update({
          where: { id: existingAttempt.id },
          data: attemptData,
        });
      } else {
        await prisma.finalExamAttempt.create({
          data: { userId: user.id, examId: exam.id, ...attemptData },
        });
      }

      if (passed) {
        await prisma.certificate.upsert({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          create: {
            userId: user.id,
            courseId: course.id,
            score,
            issuedAt: periodEnd,
          },
          update: { score, issuedAt: periodEnd },
        });
      } else {
        await prisma.certificate.deleteMany({
          where: { userId: user.id, courseId: course.id },
        });
      }
    }
    console.log(
      `👥 Periodo ${p + 1} (${group}): ${size} participantes evaluados en la app`,
    );
  }
}

async function main() {
  const rolesMap = await seedRoles();
  await seedSuperAdmin(rolesMap);
  await seedTestUsers(rolesMap);
  await seedAchievements();
  await seedCourses();
  await seedSettings();
  await seedPostTestParticipants(rolesMap);

  console.log('✨ Seeder completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

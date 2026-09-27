export const TENANTS_SWAGGER_TAG = {
  name: '🛡️ Tenants',
  description: 'Gestión de inquilinos (tenants) de la API',
};

export const SYSTEM_COMPANIES_SWAGGER_TAG = {
  name: '🏢 Empresas',
  description: 'Gestión de empresas del sistema',
};

export const TENANT_ROLES_SWAGGER_TAG = {
  name: '🔑 Roles del Tenant',
  description: 'Gestión de roles y permisos del tenant',
};

export const TENANT_CUSTOMERS_SWAGGER_TAG = {
  name: '👥 Clientes del Tenant',
  description: 'Gestión de clientes asociados al tenant',
};

export const AUTH_SWAGGER_TAG = {
  name: '🔐 Autenticación',
  description: 'Endpoints de acceso y gestión de sesiones',
};

export const TENANT_MODULES_PERMISSIONS_SWAGGER_TAG = {
  name: '📜 Módulos y Permisos',
  description: 'Gestión de módulos habilitados y sus permisos',
};

export const TENANT_INVITATIONS_SWAGGER_TAG = {
  name: '✉️ Invitaciones',
  description: 'Gestión de invitaciones para nuevos usuarios',
};

export const TENANT_CONFIGS_SWAGGER_TAG = {
  name: '⚙️ Configuraciones',
  description: 'Configuraciones generales del tenant',
};

export const TENANT_CONFIG_EMAIL_SWAGGER_TAG = {
  name: '📧 Configuración Email',
  description: 'Ajustes de servidor de correo para notificaciones',
};

export const SYSTEM_ACCESS_TENANT_SWAGGER_TAG = {
  name: '🔓 Accesos del Sistema',
  description: 'Gestión de accesos de soporte técnico a tenants',
};

export const AUDITS_SWAGGER_TAG = {
  name: '🔍 Auditorías',
  description: 'Logs y registros de actividad del sistema',
};

export const CUSTOMERS_SWAGGER_TAG = {
  name: '👥 Directorio de Clientes',
  description: 'Gestión centralizada de clientes',
};

export const INVOICES_SWAGGER_TAG = {
  name: '📄 Comprobantes Electrónicos',
  description: 'Facturas, Boletas, Notas de Crédito/Débito y resúmenes diarios',
};

export const TENANT_API_KEYS_SWAGGER_TAG = {
  name: '🔑 API Keys',
  description: 'Gestión de llaves de acceso para integraciones externas',
};

export const BACKOFFICE_SWAGGER_TAG = {
  name: '🛠️ Backoffice',
  description: 'Panel de administración global del sistema',
};

export const KPI_REPORTS_SWAGGER_TAG = {
  name: '📊 Reportes y KPIs',
  description: 'Métricas de negocio y estadísticas de uso',
};

export const SERIES_CORRELATIVE_SWAGGER_TAG = {
  name: '🔢 Series y Correlativos',
  description: 'Numeración y series de documentos electrónicos',
};

export const SHIPPING_GUIDE_SEPARATOR_TAG = {
  name: '─── GUÍAS DE REMISIÓN ───',
  description: 'Operaciones relacionadas con guías de remisión electrónicas',
};

export const SHIPPING_GUIDE_SWAGGER_TAG_MANAGE = {
  name: '🚚 Gestión de Guías',
  description: 'Emisión y consulta de guías de remisión',
};

// Agrupa todos los tags para registrar en el DocumentBuilder
export const ALL_SWAGGER_TAGS = [
  TENANTS_SWAGGER_TAG,
  SYSTEM_COMPANIES_SWAGGER_TAG,
  TENANT_ROLES_SWAGGER_TAG,
  TENANT_CUSTOMERS_SWAGGER_TAG,
  AUTH_SWAGGER_TAG,
  TENANT_MODULES_PERMISSIONS_SWAGGER_TAG,
  TENANT_INVITATIONS_SWAGGER_TAG,
  TENANT_CONFIGS_SWAGGER_TAG,
  TENANT_CONFIG_EMAIL_SWAGGER_TAG,
  SYSTEM_ACCESS_TENANT_SWAGGER_TAG,
  AUDITS_SWAGGER_TAG,
  CUSTOMERS_SWAGGER_TAG,
  INVOICES_SWAGGER_TAG,
  TENANT_API_KEYS_SWAGGER_TAG,
  BACKOFFICE_SWAGGER_TAG,
  KPI_REPORTS_SWAGGER_TAG,
  SERIES_CORRELATIVE_SWAGGER_TAG,
  SHIPPING_GUIDE_SEPARATOR_TAG,
  SHIPPING_GUIDE_SWAGGER_TAG_MANAGE,
] as const;

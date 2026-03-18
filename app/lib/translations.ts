import { rejects } from "assert"

export const translations = {
  es: {
    // Navigation and general
    dashboard: "Panel de control",
    rat: "RAT",
    underReview: "En revisión",
    newProcessingActivity: "Nueva actividad de tratamiento",
    templates: "Plantillas",
    externalRecipients: "Destinatarios externos",
    thirdPartySource: "Fuente de terceros",
    documentManagement: "Gestión de documentos",
    history: "Historial",
    language: "Idioma",
    welcomeMessage: "Protección de Datos Personales",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    goodbye: "Has cerrado sesión correctamente.",

    // Dashboard
    dataInventory: "Inventario de datos personales",
    privacyNotices: "Avisos de privacidad",
    thirdPartyContracts: "Contratos con terceros",
    dataProtectionOfficer: "Oficial de protección de datos",
    arcoRights: "Derechos ARCO",
    awarenessTraining: "Responsabilidad demostrada y capacitación",
    dataPolicies: "Políticas de protección de datos",

    // Common actions
    findPlaceholder: "Buscar...",
    saveTableSettings: "Guardar configuración de tabla",
    resetTableColumns: "Restablecer columnas de tabla",
    resetTableFilters: "Restablecer filtros de tabla",
    showDeletedRecords: "Mostrar registros eliminados",
    hideDeletedRecords: "Ocultar registros eliminados",
    filterBy: "Filtrar por:",
    complianceStatus: "Estado de cumplimiento",
    processingActivityName: "Nombre de actividad de tratamiento",
    country: "País",
    actions: "Acciones",
    view: "Ver",
    edit: "Editar",
    approve: "Aprobar",
    reject: "Rechazar",

    // Form fields
    legalEntity: "Entidad legal",
    description: "Descripción",
    establishment: "Establecimiento",
    dataSubjects: "Sujetos de datos",
    personalDataCategories: "Categorías de datos personales",
    processingPurpose: "Propósito del tratamiento",
    retentionPeriod: "Período de retención",
    securityMeasures: "Medidas de seguridad",
    submit: "Enviar",
    cancel: "Cancelar",

    // Auth related
    loginTitle: "Iniciar sesión",
    registerTitle: "Crear cuenta",
    loginDescription: "Ingresa tus credenciales para acceder a tu cuenta",
    registerDescription: "Crea una nueva cuenta para acceder al sistema",
    name: "Nombre",
    email: "Correo electrónico",
    password: "Contraseña",
    loginButton: "Iniciar sesión",
    registerButton: "Registrarse",
    switchToRegister: "¿No tienes una cuenta? Regístrate",
    switchToLogin: "¿Ya tienes una cuenta? Inicia sesión",
    fillAllFields: "Por favor, completa todos los campos",
    invalidCredentials: "Credenciales inválidas o cuenta no aprobada",
    accountCreatedDescription:
      "Tu cuenta ha sido creada exitosamente. Por favor espera la aprobación del administrador.",
    success: "Éxito",
    error: "Error",


    profileDescription: "Actualiza tu información personal.",
    profileUpdatedDescription: "Tu perfil se ha actualizado correctamente.",

    // Profile and settings
    profile: "Perfil",
    settings: "Configuración",
    logout: "Cerrar sesión",
    forgotPassword: "¿Olvidaste tu contraseña?",
    updateProfile: "Actualizar perfil",
    theme: "Tema",
    notifications: "Notificaciones",
    saveSettings: "Guardar configuración",
    profileUpdated: "Perfil actualizado",
    settingsSaved: "Configuración guardada",

    // Record management
    editRecord: "Editar registro",
    editRecordDescription: "Modifica los detalles del registro y guarda los cambios",
    save: "Guardar",
    deleteRecord: "Eliminar registro",
    deleteRecordConfirmation: "¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.",
    delete: "Eliminar",
    viewRecord: "Ver registro",
    viewRecordDescription: "Detalles del registro",
    filters: "Filtros",
    setFiltersForTable: "Establezca los filtros para la tabla",
    applyFilters: "Aplicar filtros",

    // Document management
    uploadDocument: "Subir documento",
    documentUploaded: "Documento subido",
    hasBeenUploaded: "ha sido subido",
    tableSettingsSaved: "La configuración de la tabla ha sido guardada",
    tableColumnsReset: "Las columnas de la tabla han sido restablecidas",
    tableFiltersReset: "Los filtros de la tabla han sido restablecidos",
    deletedRecordsHidden: "Los registros eliminados están ocultos",
    deletedRecordsVisible: "Los registros eliminados son visibles",
    managingUsers: "Gestionando usuarios para el registro",
    viewingDocuments: "Viendo documentos para el registro",

    // Other UI elements
    selectedLegalEntity: "Entidad legal seleccionada",
    users: "Usuarios",
    documents: "Documentos",
    recordUpdated: "Registro actualizado",
    recordWithId: "El registro con ID",
    hasBeenUpdated: "ha sido actualizado",
    recordDeleted: "Registro eliminado",
    hasBeenDeleted: "ha sido eliminado",
    approvedSuccessfully: "Aprobado exitosamente",
    rejected: "Rechazado",
    viewingRecord: "Viendo registro",
    editingRecord: "Editando registro",
    mexico: "México",
    selectLegalEntity: "Seleccionar entidad legal",
    processingActivityPlaceholder: "Actividad de tratamiento...",
    pendingApproval: "Pendiente de aprobación",
    inProgress: "En progreso",
    id: "ID",
    processingActivity: "Actividad de tratamiento",
    status: "Estado",

    // Dashboard metrics
    selectMetric: "Seleccionar métrica",
    revenue: "Ingresos",
    activities: "Actividades",
    dailyUsers: "Usuarios diarios",
    monthlyRevenue: "Ingresos mensuales",
    activityDistribution: "Distribución de actividades",

    // Additional translations
    totalUsers: "Total de usuarios",
    totalDocuments: "Total de documentos",
    pendingReviews: "Revisiones pendientes",
    completedActivities: "Actividades completadas",
    downloadUserAccounts: "Descargar cuentas de usuario",
    pendingApprovals: "Aprobaciones pendientes",
    noPendingApprovals: "No hay aprobaciones pendientes",

    // Template related
    createNewTemplate: "Crear nueva plantilla",
    templateName: "Nombre de la plantilla",
    category: "Categoría",
    processingActivityId: "ID de actividad de tratamiento",
    processingCategory: "Categoría de tratamiento",
    typeOfData: "Tipo de datos",
    specialCategories: "Categorías especiales",
    criminalConvictions: "Condenas penales",
    templateNamePlaceholder: "Nombre de la plantilla...",
    categoryPlaceholder: "Categoría...",
    customersManagement: "Gestión de clientes",
    suppliersManagement: "Gestión de proveedores",

    // Document related
    createNewDocument: "Crear nuevo documento",
    createNewDocumentDescription: "Sube un nuevo documento al sistema.",
    documentName: "Nombre del documento",
    uploadDate: "Fecha de subida",
    areYouSure: "¿Estás completamente seguro?",
    deleteWarning:
      "Esta acción no se puede deshacer. Esto eliminará permanentemente el documento y lo quitará de nuestros servidores.",

    // Data subjects
    employees: "Empleados",
    customers: "Clientes",
    suppliers: "Proveedores",
    websiteVisitors: "Visitantes del sitio web",
    jobApplicants: "Solicitantes de empleo",

    // Data categories
    basicData: "Datos básicos",
    contactInformation: "Información de contacto",
    financialData: "Datos financieros",
    healthData: "Datos de salud",
    locationData: "Datos de ubicación",

    // Form placeholders
    enterProcessingActivity: "Ingrese la actividad de tratamiento",
    describeProcessingActivity: "Describa la actividad de tratamiento",
    selectCountry: "Seleccione el país",
    enterEstablishment: "Ingrese el establecimiento",
    selectDataSubjects: "Seleccione los sujetos de datos",
    selectPersonalDataCategories: "Seleccione las categorías de datos personales",
    describeProcessingPurpose: "Describa el propósito del tratamiento",
    enterRetentionPeriod: "Ingrese el período de retención",
    describeSecurityMeasures: "Describa las medidas de seguridad",
    submitting: "Enviando...",

    // History related
    filterByDate: "Filtrar por fecha:",
    viewChangeDetails: "Ver detalles del cambio",
    documentId: "ID del documento",
    lastChange: "Último cambio",
    changes: "Cambios",

    type: "Tipo",
    author: "Autor",


    // Profile and settings titles
    profileTitle: "Perfil de usuario",
    settingsTitle: "Configuración del sistema",

    // Theme options
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",

    // Upload related
    uploading: "Subiendo...",
    upload: "Subir",
    file: "Archivo",
    selectDocumentType: "Seleccionar tipo de documento",
    selectStatus: "Seleccionar estado",
    date: "Fecha",

    // Template management
    createNewTemplateDescription: "Crea una nueva plantilla para actividades de tratamiento",
    viewTemplate: "Ver plantilla",
    editTemplate: "Editar plantilla",
    editTemplateDescription: "Modifica los detalles de la plantilla existente",
    create: "Crear",
    showDeletedTemplates: "Mostrar plantillas eliminadas",
    hideDeletedTemplates: "Ocultar plantillas eliminadas",
    deletedTemplatesHidden: "Las plantillas eliminadas están ocultas",
    deletedTemplatesVisible: "Las plantillas eliminadas son visibles",
    deleteTemplateConfirmation: "¿Está seguro de que desea eliminar esta plantilla? Esta acción no se puede deshacer.",
    pending: "Pendiente",
    approved: "Aprobado",
    rejected_1: "Rechazado",
    personalDataSecuritySystem: "Sistema de gestión de seguridad de datos personales",
    securitySystemDescription: "Gestiona y mejora la seguridad de tus datos personales",
    securitySystemHelp:
      "Si requieres ayuda para implementar tu sistema de gestión, puedes utilizar nuestra plataforma de gestión de seguridad",
    goToPlatform: "Ir a la plataforma de gestión de seguridad",
  },
  en: {
    // Navigation and general
    dashboard: "Dashboard",
    rat: "RAT",
    underReview: "Under review",
    newProcessingActivity: "New processing activity",
    templates: "Templates",
    externalRecipients: "External recipients",
    thirdPartySource: "Third-party source",
    documentManagement: "Document management",
    history: "History",
    language: "Language",
    welcomeMessage: "Welcome to Integral Platform",
    goodbye: "You have successfully logged out.",

    // Dashboard
    dataInventory: "Personal data inventory",
    privacyNotices: "Privacy notices",
    thirdPartyContracts: "Third party contracts",
    dataProtectionOfficer: "Data protection officer",
    arcoRights: "ARCO rights",
    awarenessTraining: "Demonstrated/Proactive Responsibility & training",
    dataPolicies: "Data protection policies",

    // Common actions
    findPlaceholder: "Find...",
    saveTableSettings: "Save table settings",
    resetTableColumns: "Reset table columns",
    resetTableFilters: "Reset table filters",
    showDeletedRecords: "Show deleted records",
    hideDeletedRecords: "Hide deleted records",
    filterBy: "Filter by:",
    complianceStatus: "Compliance status",
    processingActivityName: "Processing activity name",
    country: "Country",
    actions: "Actions",
    view: "View",
    edit: "Edit",
    approve: "Approve",
    reject: "Reject",

    profileDescription: "Update your personal information.",
    profileUpdatedDescription: "Your profile has been successfully updated.",

    // Form fields
    legalEntity: "Legal entity",
    description: "Description",
    establishment: "Establishment",
    dataSubjects: "Data subjects",
    personalDataCategories: "Personal data categories",
    processingPurpose: "Processing purpose",
    retentionPeriod: "Retention period",
    securityMeasures: "Security measures",
    submit: "Submit",
    cancel: "Cancel",

    // Auth related
    loginTitle: "Log in",
    registerTitle: "Create account",
    loginDescription: "Enter your credentials to access your account",
    registerDescription: "Create a new account to access the system",
    name: "Name",
    email: "Email",
    password: "Password",
    loginButton: "Log in",
    registerButton: "Register",
    switchToRegister: "Don't have an account? Sign up",
    switchToLogin: "Already have an account? Log in",
    fillAllFields: "Please fill in all fields",
    invalidCredentials: "Invalid credentials or account not approved",
    accountCreatedDescription: "Your account has been successfully created. Please wait for admin approval.",
    success: "Success",
    error: "Error",

    // Profile and settings
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    forgotPassword: "Forgot your password?",
    updateProfile: "Update profile",
    theme: "Theme",
    notifications: "Notifications",
    saveSettings: "Save settings",
    profileUpdated: "Profile updated",
    settingsSaved: "Settings saved",

    // Record management
    editRecord: "Edit record",
    editRecordDescription: "Modify the record details and save the changes",
    save: "Save",
    deleteRecord: "Delete record",
    deleteRecordConfirmation: "Are you sure you want to delete this record? This action cannot be undone.",
    delete: "Delete",
    viewRecord: "View record",
    viewRecordDescription: "Record details",
    filters: "Filters",
    setFiltersForTable: "Set filters for the table",
    applyFilters: "Apply filters",

    // Document management
    uploadDocument: "Upload document",
    documentUploaded: "Document uploaded",
    hasBeenUploaded: "has been uploaded",
    tableSettingsSaved: "Table settings have been saved",
    tableColumnsReset: "Table columns have been reset",
    tableFiltersReset: "Table filters have been reset",
    deletedRecordsHidden: "Deleted records are hidden",
    deletedRecordsVisible: "Deleted records are visible",
    managingUsers: "Managing users for record",
    viewingDocuments: "Viewing documents for record",

    type: "Type",
    author: "Author",


    // Other UI elements
    selectedLegalEntity: "Selected legal entity",
    users: "Users",
    documents: "Documents",
    recordUpdated: "Record updated",
    recordWithId: "The record with ID",
    hasBeenUpdated: "has been updated",
    recordDeleted: "Record deleted",
    hasBeenDeleted: "has been deleted",
    approvedSuccessfully: "Approved successfully",
    rejected: "Rejected",
    viewingRecord: "Viewing record",
    editingRecord: "Editing record",
    mexico: "Mexico",
    selectLegalEntity: "Select legal entity",
    processingActivityPlaceholder: "Processing activity...",
    pendingApproval: "Pending approval",
    inProgress: "In progress",
    id: "ID",
    processingActivity: "Processing activity",
    status: "Status",

    // Dashboard metrics
    selectMetric: "Select metric",
    revenue: "Revenue",
    activities: "Activities",
    dailyUsers: "Daily users",
    monthlyRevenue: "Monthly revenue",
    activityDistribution: "Activity distribution",

    darkMode: "Dark mode",
    lightMode: "Light mode",

    // Additional translations
    totalUsers: "Total users",
    totalDocuments: "Total documents",
    pendingReviews: "Pending reviews",
    completedActivities: "Completed activities",
    downloadUserAccounts: "Download user accounts",
    pendingApprovals: "Pending approvals",
    noPendingApprovals: "No pending approvals",

    // Template related
    createNewTemplate: "Create new template",
    templateName: "Template name",
    category: "Category",
    processingActivityId: "Processing activity ID",
    processingCategory: "Processing category",
    typeOfData: "Type of data",
    specialCategories: "Special categories",
    criminalConvictions: "Criminal convictions",
    templateNamePlaceholder: "Template name...",
    categoryPlaceholder: "Category...",
    customersManagement: "Customers management",
    suppliersManagement: "Suppliers management",

    // Document related
    createNewDocument: "Create new document",
    createNewDocumentDescription: "Upload a new document to the system.",
    documentName: "Document name",
    uploadDate: "Upload date",
    areYouSure: "Are you absolutely sure?",
    deleteWarning:
      "This action cannot be undone. This will permanently delete the document and remove it from our servers.",

    // Data subjects
    employees: "Employees",
    customers: "Customers",
    suppliers: "Suppliers",
    websiteVisitors: "Website visitors",
    jobApplicants: "Job applicants",

    // Data categories
    basicData: "Basic data",
    contactInformation: "Contact information",
    financialData: "Financial data",
    healthData: "Health data",
    locationData: "Location data",

    // Form placeholders
    enterProcessingActivity: "Enter processing activity",
    describeProcessingActivity: "Describe the processing activity",
    selectCountry: "Select country",
    enterEstablishment: "Enter establishment",
    selectDataSubjects: "Select data subjects",
    selectPersonalDataCategories: "Select personal data categories",
    describeProcessingPurpose: "Describe the processing purpose",
    enterRetentionPeriod: "Enter retention period",
    describeSecurityMeasures: "Describe security measures",
    submitting: "Submitting...",

    // History related
    filterByDate: "Filter by date:",
    viewChangeDetails: "View change details",
    documentId: "Document ID",
    lastChange: "Last change",
    changes: "Changes",

    // Profile and settings titles
    profileTitle: "User profile",
    settingsTitle: "System settings",

    // Theme options
    light: "Light",
    dark: "Dark",
    system: "System",

    // Upload related
    uploading: "Uploading...",
    upload: "Upload",
    file: "File",
    selectDocumentType: "Select document type",
    selectStatus: "Select status",
    date: "Date",

    // Template management
    createNewTemplateDescription: "Create a new template for processing activities",
    viewTemplate: "View template",
    editTemplate: "Edit template",
    editTemplateDescription: "Modify the details of the existing template",
    create: "Create",
    showDeletedTemplates: "Show deleted templates",
    hideDeletedTemplates: "Hide deleted templates",
    deletedTemplatesHidden: "Deleted templates are hidden",
    deletedTemplatesVisible: "Deleted templates are visible",
    deleteTemplateConfirmation: "Are you sure you want to delete this template? This action cannot be undone.",
    pending: "Pending",
    approved: "Approved",
    rejected_1: "Rejected",
    personalDataSecuritySystem: "Personal Data Security Management System",
    securitySystemDescription: "Manage and improve the security of your personal data",
    securitySystemHelp:
      "If you need help implementing your management system, you can use our security management platform",
    goToPlatform: "Go to Security Management Platform",
  },
}

export type TranslationKey = keyof typeof translations.en

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from "react";

type Language = "es" | "en";

// Translation keys
const translations = {
  en: {
    // Dashboard
    dashboard: "Dashboard",
    monthlyBalance: "Monthly Balance",
    income: "Income",
    expenses: "Expenses",
    dolarBlue: "Dólar Blue",
    buy: "Buy",
    sell: "Sell",
    loading: "Loading...",
    monthlyTrend: "Monthly Trend",
    noDataAvailable: "No data available",
    recentTransactions: "Recent Transactions",
    noRecentTransactions: "No recent transactions",
    viewAll: "View all",
    savingsGoals: "Savings Goals",
    noSavingsGoals: "No savings goals yet",
    saved: "saved",
    addTransaction: "Add Transaction",
    newGoal: "New Goal",

    // Transactions
    transactions: "Transactions",
    manageTransactions: "Manage your income and expenses",
    addNew: "Add New",
    all: "All",
    search: "Search",
    searchTransactions: "Search transactions...",
    noTransactionsFound: "No transactions found",
    edit: "Edit",
    delete: "Delete",
    editTransaction: "Edit Transaction",
    updateDetails: "Update the transaction details",
    addNewTransaction: "Add Transaction",
    recordTransaction: "Record a new income or expense",
    category: "Category",
    selectCategory: "Select category",
    type: "Type",
    amount: "Amount",
    currency: "Currency",
    date: "Date",
    description: "Description",
    notes: "Notes",
    cancel: "Cancel",
    save: "Save",
    add: "Add",

    // Savings
    savings: "Savings",
    trackSavingsGoals: "Track your savings goals",
    createGoal: "Create Goal",
    totalSaved: "Total Saved",
    activeGoals: "Active Goals",
    averageProgress: "Average Progress",
    yourGoals: "Your Goals",
    noGoalsYet: "No goals yet",
    createFirstGoal: "Create your first savings goal to start tracking",
    addContribution: "Add Contribution",
    goalName: "Goal Name",
    targetAmount: "Target Amount",
    contributionAmount: "Contribution Amount",
    contribute: "Contribute",
    create: "Create",

    // Reports
    reports: "Reports",
    financialInsights: "Financial insights and analytics",
    period: "Period",
    thisMonth: "This Month",
    last3Months: "Last 3 Months",
    last6Months: "Last 6 Months",
    thisYear: "This Year",
    summary: "Summary",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    netBalance: "Net Balance",
    transactionCount: "Transaction Count",
    expensesByCategory: "Expenses by Category",
    noExpenseData: "No expense data for this period",
    monthlyTrends: "Monthly Trends",

    // Settings
    settings: "Settings",
    managePreferences: "Manage your account and preferences",
    profile: "Profile",
    personalInfo: "Your personal information",
    fullName: "Full Name",
    email: "Email",
    financialSettings: "Financial Settings",
    configureIncome: "Configure your income and currency",
    monthlyBaseIncome: "Monthly Base Income",
    fixedMonthlyIncome: "Your fixed monthly income (salary, etc.)",
    defaultCurrency: "Default Currency",
    preferences: "Preferences",
    customizeExperience: "Customize your experience",
    darkMode: "Dark Mode",
    switchTheme: "Switch between light and dark theme",
    voiceCommands: "Voice Commands",
    enableVoiceInput: "Enable voice input for quick transactions",
    notifications: "Notifications",
    receiveReminders: "Receive reminders and updates",
    categories: "Categories",
    yourCategories: "Your transaction categories",
    expenseCategories: "Expense Categories",
    incomeCategories: "Income Categories",

    // Sidebar
    overview: "Overview",

    // Auth
    login: "Login",
    register: "Register",
    signIn: "Sign In",
    signUp: "Sign Up",
    createAccount: "Create Account",
    welcomeBack: "Welcome back",
    enterCredentials: "Enter your credentials to access your account",
    password: "Password",
    confirmPassword: "Confirm Password",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    passwordRequirements: "Password must be at least 8 characters",
    signingIn: "Signing in...",
    creatingAccount: "Creating account...",

    // Landing
    heroTitle: "Take Control of Your Finances",
    heroSubtitle:
      "Track expenses, set savings goals, and gain insights into your spending habits with our intuitive personal finance app.",
    getStarted: "Get Started",
    features: "Features",
    featureTrackTitle: "Track Everything",
    featureTrackDesc:
      "Monitor all your income and expenses in one place with automatic categorization.",
    featureSavingsTitle: "Savings Goals",
    featureSavingsDesc:
      "Set and track your savings goals with visual progress indicators.",
    featureInsightsTitle: "Smart Insights",
    featureInsightsDesc:
      "Get detailed reports and analytics to understand your spending patterns.",
    featureVoiceTitle: "Voice Commands",
    featureVoiceDesc:
      "Add transactions quickly using voice commands for hands-free tracking.",
    readyToStart: "Ready to Start?",
    joinUsers: "Join thousands of users taking control of their finances.",
    allRightsReserved: "All rights reserved.",
  },
  es: {
    // Dashboard
    dashboard: "Panel",
    monthlyBalance: "Balance Mensual",
    income: "Ingresos",
    expenses: "Gastos",
    dolarBlue: "Dólar Blue",
    buy: "Compra",
    sell: "Venta",
    loading: "Cargando...",
    monthlyTrend: "Tendencia Mensual",
    noDataAvailable: "Sin datos disponibles",
    recentTransactions: "Transacciones Recientes",
    noRecentTransactions: "Sin transacciones recientes",
    viewAll: "Ver todo",
    savingsGoals: "Metas de Ahorro",
    noSavingsGoals: "Sin metas de ahorro",
    saved: "ahorrado",
    addTransaction: "Agregar Transacción",
    newGoal: "Nueva Meta",

    // Transactions
    transactions: "Transacciones",
    manageTransactions: "Administra tus ingresos y gastos",
    addNew: "Agregar",
    all: "Todas",
    search: "Buscar",
    searchTransactions: "Buscar transacciones...",
    noTransactionsFound: "No se encontraron transacciones",
    edit: "Editar",
    delete: "Eliminar",
    editTransaction: "Editar Transacción",
    updateDetails: "Actualiza los detalles de la transacción",
    addNewTransaction: "Agregar Transacción",
    recordTransaction: "Registra un nuevo ingreso o gasto",
    category: "Categoría",
    selectCategory: "Seleccionar categoría",
    type: "Tipo",
    amount: "Monto",
    currency: "Moneda",
    date: "Fecha",
    description: "Descripción",
    notes: "Notas",
    cancel: "Cancelar",
    save: "Guardar",
    add: "Agregar",

    // Savings
    savings: "Ahorros",
    trackSavingsGoals: "Seguí tus metas de ahorro",
    createGoal: "Crear Meta",
    totalSaved: "Total Ahorrado",
    activeGoals: "Metas Activas",
    averageProgress: "Progreso Promedio",
    yourGoals: "Tus Metas",
    noGoalsYet: "Sin metas aún",
    createFirstGoal: "Creá tu primera meta de ahorro para empezar",
    addContribution: "Agregar Aporte",
    goalName: "Nombre de la Meta",
    targetAmount: "Monto Objetivo",
    contributionAmount: "Monto del Aporte",
    contribute: "Aportar",
    create: "Crear",

    // Reports
    reports: "Reportes",
    financialInsights: "Análisis e información financiera",
    period: "Período",
    thisMonth: "Este Mes",
    last3Months: "Últimos 3 Meses",
    last6Months: "Últimos 6 Meses",
    thisYear: "Este Año",
    summary: "Resumen",
    totalIncome: "Ingresos Totales",
    totalExpenses: "Gastos Totales",
    netBalance: "Balance Neto",
    transactionCount: "Cantidad de Transacciones",
    expensesByCategory: "Gastos por Categoría",
    noExpenseData: "Sin datos de gastos para este período",
    monthlyTrends: "Tendencias Mensuales",

    // Settings
    settings: "Configuración",
    managePreferences: "Administra tu cuenta y preferencias",
    profile: "Perfil",
    personalInfo: "Tu información personal",
    fullName: "Nombre Completo",
    email: "Email",
    financialSettings: "Configuración Financiera",
    configureIncome: "Configura tus ingresos y moneda",
    monthlyBaseIncome: "Ingreso Base Mensual",
    fixedMonthlyIncome: "Tu ingreso fijo mensual (salario, etc.)",
    defaultCurrency: "Moneda por Defecto",
    preferences: "Preferencias",
    customizeExperience: "Personaliza tu experiencia",
    darkMode: "Modo Oscuro",
    switchTheme: "Cambiar entre tema claro y oscuro",
    voiceCommands: "Comandos de Voz",
    enableVoiceInput: "Habilitar entrada de voz para transacciones rápidas",
    notifications: "Notificaciones",
    receiveReminders: "Recibir recordatorios y actualizaciones",
    categories: "Categorías",
    yourCategories: "Tus categorías de transacción",
    expenseCategories: "Categorías de Gastos",
    incomeCategories: "Categorías de Ingresos",

    // Sidebar
    overview: "Resumen",

    // Auth
    login: "Iniciar Sesión",
    register: "Registrarse",
    signIn: "Ingresar",
    signUp: "Registrarse",
    createAccount: "Crear Cuenta",
    welcomeBack: "Bienvenido de nuevo",
    enterCredentials: "Ingresa tus credenciales para acceder a tu cuenta",
    password: "Contraseña",
    confirmPassword: "Confirmar Contraseña",
    dontHaveAccount: "¿No tenés cuenta?",
    alreadyHaveAccount: "¿Ya tenés cuenta?",
    passwordRequirements: "La contraseña debe tener al menos 8 caracteres",
    signingIn: "Ingresando...",
    creatingAccount: "Creando cuenta...",

    // Landing
    heroTitle: "Tomá el Control de tus Finanzas",
    heroSubtitle:
      "Seguí tus gastos, establecé metas de ahorro y obtené información sobre tus hábitos de gasto con nuestra app de finanzas personales.",
    getStarted: "Comenzar",
    features: "Características",
    featureTrackTitle: "Seguí Todo",
    featureTrackDesc:
      "Monitoreá todos tus ingresos y gastos en un solo lugar con categorización automática.",
    featureSavingsTitle: "Metas de Ahorro",
    featureSavingsDesc:
      "Establecé y seguí tus metas de ahorro con indicadores de progreso visuales.",
    featureInsightsTitle: "Información Inteligente",
    featureInsightsDesc:
      "Obtené reportes detallados y análisis para entender tus patrones de gasto.",
    featureVoiceTitle: "Comandos de Voz",
    featureVoiceDesc:
      "Agregá transacciones rápidamente usando comandos de voz.",
    readyToStart: "¿Listo para Empezar?",
    joinUsers: "Unite a miles de usuarios que controlan sus finanzas.",
    allRightsReserved: "Todos los derechos reservados.",
  },
} as const;

type TranslationKey = keyof (typeof translations)["en"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("language") as Language | null;
    if (saved && (saved === "es" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{ language: "es", setLanguage: () => {}, t: (key) => key }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Language, TranslationKey };

import React, { useState, useMemo, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { CapgoFilePicker } from '@capgo/capacitor-file-picker';
import { Preferences } from '@capacitor/preferences';
import { PlusCircle, Trash2, Tag, DollarSign, Package, Home, Pencil, ShoppingCart, RotateCcw, Info, CalendarDays, Settings, Download, Upload, X, Check, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';

const TABS = {
  FALTANTES: 'faltantes',
  EXISTENTES: 'existentes',
  SERVICIOS: 'servicios',
  DEUDAS: 'deudas',
  INVERSIONES: 'inversiones'
};
const TAB_ORDER = Object.values(TABS);

const COLOR_PALETTE = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#64748b'];

const STORAGE_KEY = 'home-inventory-v3';
const SETTINGS_KEY = 'home-inventory-settings-v1';
const COLLAPSE_KEY = 'home-inventory-collapsed-v1';

// Carpeta donde se guardan las exportaciones en Android
const EXPORT_DIR = 'IDOCash';
const isNative = Capacitor.isNativePlatform();

// Convierte base64 (UTF-8) a texto, devuelto por los plugins nativos
const decodeBase64 = (b64) => {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
};

// Grupo interno que sincroniza las pestañas "faltantes" y "existentes"
const GROUP_COMPRAS = 'compras';

const isComprasTab = (tab) => tab === TABS.FALTANTES || tab === TABS.EXISTENTES;

// Mapea identificadores antiguos (nombres en español) a los nuevos IDs estables
const LEGACY_TABS = {
  'Productos a comprar (faltantes)': TABS.FALTANTES,
  'Productos existentes': TABS.EXISTENTES,
  'Servicios de pago': TABS.SERVICIOS,
  'Deudas': TABS.DEUDAS,
  'Inversiones futuras': TABS.INVERSIONES
};

const CURRENCIES = {
  CLP: { locale: 'es-CL', decimals: 0 },
  USD: { locale: 'en-US', decimals: 2 },
  EUR: { locale: 'es-ES', decimals: 2 },
  MXN: { locale: 'es-MX', decimals: 2 },
  ARS: { locale: 'es-AR', decimals: 0 },
  COP: { locale: 'es-CO', decimals: 0 },
  PEN: { locale: 'es-PE', decimals: 2 },
  BRL: { locale: 'pt-BR', decimals: 2 }
};

const TRANSLATIONS = {
  es: {
    appTitle: 'IDOcash',
    totalValue: 'Valor Total',
    settings: 'Ajustes',
    settingsTitle: 'Ajustes',
    close: 'Cerrar',
    newHome: 'Nuevo Hogar',
    renameHome: 'Renombrar hogar',
    deleteHome: 'Eliminar hogar',
    promptHomeName: 'Nuevo nombre del hogar:',
    confirmDeleteHome: '¿Eliminar este hogar y todos sus datos?',
    selectTab: 'Seleccionar pestaña',
    tabs: {
      faltantes: 'Productos a comprar (faltantes)',
      existentes: 'Productos existentes',
      servicios: 'Servicios de pago',
      deudas: 'Deudas',
      inversiones: 'Inversiones futuras'
    },
    syncNoticeMissing: 'Las categorías y productos se comparten con "Productos existentes". Marca un producto como comprado para moverlo allí.',
    syncNoticeExisting: 'Las categorías y productos se comparten con "Productos a comprar (faltantes)". Marca un producto para devolverlo a la lista de compras.',
    totalIn: 'Total en',
    pieTitle: 'Distribución por categoría',
    pieScope: 'Faltantes + Existentes + Servicios de pago',
    pieEmpty: 'Agrega productos para ver la distribución por categoría.',
    newCategory: 'Nueva categoría...',
    color: 'Color de la categoría',
    addCategory: 'Añadir Categoría',
    editCategory: 'Renombrar categoría',
    deleteCategory: 'Eliminar categoría',
    promptCategoryName: 'Nuevo nombre de la categoría:',
    confirmDeleteCategory: '¿Eliminar la categoría "{name}" y todos sus productos?',
    subtotal: 'Subtotal',
    noProducts: 'No hay productos en esta categoría.',
    sortProducts: 'Ordenar productos',
    sortNone: 'Sin ordenar',
    sortAsc: 'Precio: menor a mayor',
    sortDesc: 'Precio: mayor a menor',
    items: '{n} productos',
    productName: 'Nombre del producto',
    dueDay: 'Día de pago (1-31)',
    quantity: 'Cantidad',
    price: 'Precio ({currency})',
    add: 'Añadir',
    units: '{n} und.',
    emptyCategories: 'Comienza añadiendo una categoría para administrar tus productos.',
    buy: 'Marcar como comprado',
    returnToShopping: 'Volver a productos a comprar',
    editProduct: 'Editar producto',
    deleteProduct: 'Eliminar producto',
    editingProduct: 'Editando: «{name}»',
    save: 'Guardar',
    cancel: 'Cancelar',
    noDueDay: 'Sin día de pago',
    overdue: 'Vencido · se paga el día {day}',
    todayPayment: 'Hoy · se paga el día {day}',
    inDays: 'En {days} día{plural} · día {day}',
    monthly: 'Se paga el día {day} de cada mes',
    currency: 'Moneda',
    language: 'Idioma',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    exportData: 'Exportar datos',
    importData: 'Importar datos',
    exportDesc: 'En Android se guarda en la carpeta Documentos/IDOCash. En la PC se descarga el archivo.',
    importDesc: 'En Android abre el selector de archivos del sistema. En la PC se selecciona el archivo.',
    exportSuccess: 'Datos guardados en: {path}',
    exportFolderExists: 'La carpeta de exportación ya existía.',
    exportDenied: 'Permiso denegado para guardar en los archivos.',
    exportError: 'No se pudo exportar los datos.',
    importPermission: 'Se necesita permiso para acceder a tus archivos.',
    importDenied: 'Permiso denegado para acceder a los archivos.',
    importCanceled: 'Importación cancelada.',
    importReadError: 'No se pudo leer el archivo seleccionado.',
    importSuccess: 'Datos importados correctamente.',
    importError: 'No se pudo importar: el archivo no es válido.',
    debtsExcluded: 'Deudas e inversiones no se incluyen en el valor total.'
  },
  en: {
    appTitle: 'IDOcash',
    totalValue: 'Total Value',
    settings: 'Settings',
    settingsTitle: 'Settings',
    close: 'Close',
    newHome: 'New Home',
    renameHome: 'Rename home',
    deleteHome: 'Delete home',
    promptHomeName: 'New home name:',
    confirmDeleteHome: 'Delete this home and all its data?',
    selectTab: 'Select tab',
    tabs: {
      faltantes: 'Products to buy (missing)',
      existentes: 'Existing products',
      servicios: 'Payment services',
      deudas: 'Debts',
      inversiones: 'Future investments'
    },
    syncNoticeMissing: 'Categories and products are shared with "Existing products". Mark a product as bought to move it there.',
    syncNoticeExisting: 'Categories and products are shared with "Products to buy (missing)". Mark a product to move it back to the shopping list.',
    totalIn: 'Total in',
    pieTitle: 'Distribution by category',
    pieScope: 'Missing + Existing + Payment services',
    pieEmpty: 'Add products to see the distribution by category.',
    newCategory: 'New category...',
    color: 'Category color',
    addCategory: 'Add Category',
    editCategory: 'Rename category',
    deleteCategory: 'Delete category',
    promptCategoryName: 'New category name:',
    confirmDeleteCategory: 'Delete the category "{name}" and all its products?',
    subtotal: 'Subtotal',
    noProducts: 'No products in this category.',
    sortProducts: 'Sort products',
    sortNone: 'No sorting',
    sortAsc: 'Price: low to high',
    sortDesc: 'Price: high to low',
    items: '{n} items',
    productName: 'Product name',
    dueDay: 'Payment day (1-31)',
    quantity: 'Quantity',
    price: 'Price ({currency})',
    add: 'Add',
    units: '{n} pcs.',
    emptyCategories: 'Start by adding a category to manage your products.',
    buy: 'Mark as bought',
    returnToShopping: 'Move back to shopping list',
    editProduct: 'Edit product',
    deleteProduct: 'Delete product',
    editingProduct: 'Editing: «{name}»',
    save: 'Save',
    cancel: 'Cancel',
    noDueDay: 'No payment day',
    overdue: 'Overdue · paid on day {day}',
    todayPayment: 'Today · paid on day {day}',
    inDays: 'In {days} day{plural} · day {day}',
    monthly: 'Paid on day {day} of each month',
    currency: 'Currency',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    exportData: 'Export data',
    importData: 'Import data',
    exportDesc: 'On Android it is saved in the Documents/IDOCash folder. On PC the file is downloaded.',
    importDesc: 'On Android it opens the system file picker. On PC the file is selected.',
    exportSuccess: 'Data saved at: {path}',
    exportFolderExists: 'The export folder already existed.',
    exportDenied: 'Permission denied to save files.',
    exportError: 'Could not export data.',
    importPermission: 'Permission is needed to access your files.',
    importDenied: 'Permission denied to access files.',
    importCanceled: 'Import canceled.',
    importReadError: 'Could not read the selected file.',
    importSuccess: 'Data imported successfully.',
    importError: 'Import failed: the file is not valid.',
    debtsExcluded: 'Debts and investments are not included in the total value.'
  }
};

const translate = (lang, key, vars) => {
  const lookup = (dict) => key.split('.').reduce((acc, part) => acc?.[part], dict);
  let str = lookup(TRANSLATIONS[lang]) ?? lookup(TRANSLATIONS.es) ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => { str = str.replaceAll(`{${k}}`, String(v)); });
  }
  return str;
};

// Une las categorías de ambas pestañas sincronizadas sin duplicar nombres
const mergeCategories = (a = [], b = []) => {
  const names = new Set(a.map(c => c.name));
  return [...a, ...b.filter(c => !names.has(c.name))];
};

// Asegura que existan las 5 pestañas y normaliza claves antiguas
const normalizeCategories = (categories = {}) => {
  const out = {};
  Object.entries(categories).forEach(([key, list]) => {
    out[LEGACY_TABS[key] ?? key] = Array.isArray(list) ? list : [];
  });
  TAB_ORDER.forEach(id => { if (!out[id]) out[id] = []; });
  return out;
};

// Migra datos antiguos: productos de faltantes/existentes pasan al grupo sincronizado con estado "comprado";
// fechas completas (YYYY-MM-DD) de servicios/deudas se convierten al día de pago mensual
const normalizeHousehold = (h) => ({
  ...h,
  categories: normalizeCategories(h.categories),
  inventory: (h.inventory ?? []).map(item => {
    let normalized = item;
    const tabId = LEGACY_TABS[item.tab] ?? item.tab;
    if (tabId === TABS.FALTANTES || tabId === TABS.EXISTENTES) {
      normalized = { ...item, tab: GROUP_COMPRAS, bought: item.bought ?? tabId === TABS.EXISTENTES };
    } else {
      normalized = { ...item, tab: tabId };
    }
    const migrated = { ...normalized };
    if (migrated.dueDate) {
      const day = parseInt(migrated.dueDate.split('-')[2], 10);
      if (day >= 1 && day <= 31) migrated.dueDay = day;
      delete migrated.dueDate;
    }
    return migrated;
  })
});

const makeHousehold = (name) => ({
  id: crypto.randomUUID(),
  name,
  categories: Object.fromEntries(TAB_ORDER.map(tab => [tab, []])),
  inventory: []
});

function PieChart({ data, size = 190, dark = false }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 10;
  const center = size / 2;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Empty pie chart">
        <circle cx={center} cy={center} r={radius} fill={dark ? '#1e293b' : '#f1f5f9'} />
      </svg>
    );
  }

  let cumulative = 0;
  const slices = data
    .filter(d => d.value > 0)
    .map(d => {
      const start = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += d.value;
      const end = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      const x1 = center + radius * Math.cos(start);
      const y1 = center + radius * Math.sin(start);
      const x2 = center + radius * Math.cos(end);
      const y2 = center + radius * Math.sin(end);
      const largeArc = end - start > Math.PI ? 1 : 0;
      return { ...d, path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z` };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart by category">
      {slices.map(s => (
        <path key={s.name} d={s.path} fill={s.color} stroke={dark ? '#334155' : '#fff'} strokeWidth={2} />
      ))}
    </svg>
  );
}

export default function App() {
  // --- ESTADO DE LA APLICACIÓN ---
  const [activeTab, setActiveTab] = useState(TABS.FALTANTES);

  const [appState, setAppState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.households) && parsed.households.length > 0) {
          return { ...parsed, households: parsed.households.map(normalizeHousehold) };
        }
      } catch { /* datos corruptos: se reinicia */ }
    }
    const first = makeHousehold('Mi Hogar');
    return { households: [first], activeHouseholdId: first.id };
  });

  // --- AJUSTES (moneda, idioma, tema) ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && CURRENCIES[parsed.currency] && (parsed.lang === 'es' || parsed.lang === 'en')) {
          return { currency: parsed.currency, lang: parsed.lang, theme: 'dark' };
        }
      } catch { /* se usan los valores por defecto */ }
    }
    return { currency: 'CLP', lang: 'es', theme: 'dark' };
  });
  const [showSettings, setShowSettings] = useState(false);

  // Estados para formularios
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PALETTE[0]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '1', dueDay: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [sortOrder, setSortOrder] = useState('none'); // 'none' | 'asc' | 'desc'
  const [collapsedCats, setCollapsedCats] = useState(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  }); // categorías colapsadas: clave -> true

  // --- PERSISTENCIA DE DATOS ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsedCats));
  }, [collapsedCats]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const t = (key, vars) => translate(settings.lang, key, vars);

  const formatMoney = (value) => {
    const c = CURRENCIES[settings.currency] ?? CURRENCIES.CLP;
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: c.decimals,
      maximumFractionDigits: c.decimals
    }).format(value);
  };

  // --- SELECTOR DE HOGAR ACTIVO ---
  const activeHousehold = useMemo(() => {
    return appState.households.find(h => h.id === appState.activeHouseholdId) ?? appState.households[0];
  }, [appState]);

  // --- PUENTE NATIVO: resumen para el widget de IDOcash ---
  useEffect(() => {
    const writeSummary = () => {
      const house = appState.households.find(h => h.id === appState.activeHouseholdId) ?? appState.households[0];
      if (!house) return;
      const sum = (house.inventory ?? [])
        .filter(item => item.tab !== TABS.DEUDAS && item.tab !== TABS.INVERSIONES)
        .reduce((acc, item) => acc + item.price * (item.quantity ?? 1), 0);
      const value = JSON.stringify({
        name: house.name || 'Mi Hogar',
        sum: Math.round(sum * 100) / 100,
        currency: settings.currency ?? 'CLP',
        items: (house.inventory ?? []).length,
        at: Date.now()
      });
      try { Preferences.set({ key: 'idocash_summary', value }); } catch { /* no nativo */ }
    };
    writeSummary();
  }, [appState, settings]);

  // --- SINCRONIZACIÓN FALTANTES <-> EXISTENTES ---
  const isShopping = isComprasTab(activeTab);
  // Servicios de pago y deudas pagan un día fijo de cada mes
  const isRecurring = activeTab === TABS.SERVICIOS || activeTab === TABS.DEUDAS;

  // Clave estable del colapso por categoría (hogar + pestaña + nombre)
  const collapseKey = (name) => `${activeHousehold.id}::${isShopping ? GROUP_COMPRAS : activeTab}::${name}`;
  const isCollapsed = (name) => !!collapsedCats[collapseKey(name)];
  const toggleCollapse = (name) => {
    const key = collapseKey(name);
    setCollapsedCats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Categorías compartidas: mismas categorías en ambas pestañas sincronizadas
  const activeCategories = useMemo(() => {
    const cats = activeHousehold.categories ?? {};
    if (!isShopping) return cats[activeTab] ?? [];
    return mergeCategories(cats[TABS.FALTANTES], cats[TABS.EXISTENTES]);
  }, [activeHousehold, activeTab, isShopping]);

  // Productos visibles según estado comprado/por comprar
  const tabItems = useMemo(() => {
    const items = activeHousehold.inventory ?? [];
    if (isShopping) {
      const wantBought = activeTab === TABS.EXISTENTES;
      return items.filter(item => item.tab === GROUP_COMPRAS && item.bought === wantBought);
    }
    return items.filter(item => item.tab === activeTab);
  }, [activeHousehold, activeTab, isShopping]);

  // Ordena una lista de productos por precio total (precio × cantidad)
  const sortedItems = (list) => {
    if (sortOrder === 'none') return list;
    const total = (item) => item.price * (item.quantity ?? 1);
    return [...list].sort((a, b) => (sortOrder === 'asc' ? total(a) - total(b) : total(b) - total(a)));
  };

  // --- MOTOR DE CÁLCULO AUTOMÁTICO ---
  // Subtotales por categoría para la pestaña activa
  const categorySubtotals = useMemo(() => {
    const subtotals = {};
    activeCategories.forEach(cat => subtotals[cat.name] = 0);

    tabItems.forEach(item => {
      if (subtotals[item.category] !== undefined) {
        subtotals[item.category] += item.price * (item.quantity ?? 1);
      }
    });
    return subtotals;
  }, [tabItems, activeCategories]);

  // Sumatoria global del hogar activo (deudas e inversiones quedan excluidas)
  const globalSum = useMemo(() => {
    return (activeHousehold.inventory ?? [])
      .filter(item => item.tab !== TABS.DEUDAS && item.tab !== TABS.INVERSIONES)
      .reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);
  }, [activeHousehold]);

  // Sumatoria de la pestaña actual
  const tabSum = useMemo(() => {
    return tabItems.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);
  }, [tabItems]);

  // Gráfico de torta global e independiente: faltantes + existentes + servicios de pago
  const globalPie = useMemo(() => {
    const cats = activeHousehold.categories ?? {};
    const includeTab = (t) => t === TABS.FALTANTES || t === TABS.EXISTENTES || t === TABS.SERVICIOS;

    // Mapa de colores de categoría de las tres pestañas consideradas
    const colorMap = {};
    [TABS.FALTANTES, TABS.EXISTENTES, TABS.SERVICIOS].forEach(t => {
      (cats[t] ?? []).forEach(c => { if (c.color) colorMap[c.name] = c.color; });
    });

    const totals = {};
    (activeHousehold.inventory ?? []).forEach(item => {
      if (!includeTab(item.tab)) return;
      totals[item.category] = (totals[item.category] ?? 0) + item.price * (item.quantity ?? 1);
    });

    const data = Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, color: colorMap[name] ?? '#64748b', value }));
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    return { data, sum };
  }, [activeHousehold]);

  // Próximo vencimiento según el día de pago mensual
  const nextPaymentInfo = (day) => {
    if (!day || day < 1 || day > 31) return { text: t('noDueDay'), cls: 'text-slate-500 dark:text-slate-400' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
    const passed = thisMonth < today;
    const next = passed ? new Date(today.getFullYear(), today.getMonth() + 1, day) : thisMonth;
    const days = Math.round((next - today) / 86400000);
    if (passed) return { text: t('overdue', { day }), cls: 'text-red-500 font-medium' };
    if (days === 0) return { text: t('todayPayment', { day }), cls: 'text-amber-600 font-medium' };
    if (days <= 7) return { text: t('inDays', { days, plural: days > 1 ? 's' : '', day }), cls: 'text-amber-600 font-medium' };
    return { text: t('monthly', { day }), cls: 'text-slate-500 dark:text-slate-400' };
  };

  // --- MANEJADORES DE EVENTOS ---
  const updateActiveHousehold = (updater) => {
    setAppState(prev => ({
      ...prev,
      households: prev.households.map(h => h.id === prev.activeHouseholdId ? updater(h) : h)
    }));
  };

  const handleAddHousehold = () => {
    const h = makeHousehold(`Hogar ${appState.households.length + 1}`);
    setAppState(prev => ({ ...prev, households: [...prev.households, h], activeHouseholdId: h.id }));
  };

  const handleRenameHousehold = (id) => {
    const current = appState.households.find(h => h.id === id)?.name ?? '';
    const name = prompt(t('promptHomeName'), current);
    if (!name || !name.trim()) return;
    setAppState(prev => ({
      ...prev,
      households: prev.households.map(h => h.id === id ? { ...h, name: name.trim() } : h)
    }));
  };

  const handleDeleteHousehold = (id) => {
    if (appState.households.length <= 1) return;
    if (!confirm(t('confirmDeleteHome'))) return;
    setAppState(prev => {
      const rest = prev.households.filter(h => h.id !== id);
      return {
        ...prev,
        households: rest,
        activeHouseholdId: prev.activeHouseholdId === id ? rest[0].id : prev.activeHouseholdId
      };
    });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (activeCategories.some(c => c.name === name)) return; // Evitar duplicados

    const newCat = { name, color: newCategoryColor };

    updateActiveHousehold(h => {
      if (isShopping) {
        // La categoría se agrega a ambas pestañas sincronizadas
        const merged = mergeCategories(h.categories[TABS.FALTANTES], h.categories[TABS.EXISTENTES]);
        const updated = [...merged, newCat];
        return {
          ...h,
          categories: { ...h.categories, [TABS.FALTANTES]: updated, [TABS.EXISTENTES]: updated }
        };
      }
      return {
        ...h,
        categories: { ...h.categories, [activeTab]: [...(h.categories[activeTab] ?? []), newCat] }
      };
    });
    setNewCategoryName('');
    setNewCategoryColor(COLOR_PALETTE[activeCategories.length % COLOR_PALETTE.length]);
  };

  const handleRenameCategory = (catName) => {
    const name = prompt(t('promptCategoryName'), catName);
    if (!name || !name.trim()) return;
    const newName = name.trim();
    if (newName === catName) return;
    if (activeCategories.some(c => c.name === newName)) return; // Evitar duplicados

    updateActiveHousehold(h => {
      const renameIn = (list) => (list ?? []).map(c => c.name === catName ? { ...c, name: newName } : c);
      const nextCategories = { ...h.categories };
      if (isShopping) {
        nextCategories[TABS.FALTANTES] = renameIn(nextCategories[TABS.FALTANTES]);
        nextCategories[TABS.EXISTENTES] = renameIn(nextCategories[TABS.EXISTENTES]);
      } else {
        nextCategories[activeTab] = renameIn(nextCategories[activeTab]);
      }
      return {
        ...h,
        categories: nextCategories,
        inventory: h.inventory.map(item => item.category === catName ? { ...item, category: newName } : item)
      };
    });
  };

  const handleCategoryColor = (catName, color) => {
    updateActiveHousehold(h => {
      const paint = (list) => (list ?? []).map(c => c.name === catName ? { ...c, color } : c);
      const nextCategories = { ...h.categories };
      if (isShopping) {
        nextCategories[TABS.FALTANTES] = paint(nextCategories[TABS.FALTANTES]);
        nextCategories[TABS.EXISTENTES] = paint(nextCategories[TABS.EXISTENTES]);
      } else {
        nextCategories[activeTab] = paint(nextCategories[activeTab]);
      }
      return { ...h, categories: nextCategories };
    });
  };

  const handleDeleteCategory = (catName) => {
    if (!confirm(t('confirmDeleteCategory', { name: catName }))) return;
    updateActiveHousehold(h => {
      const removeCat = (list) => (list ?? []).filter(c => c.name !== catName);
      const nextCategories = { ...h.categories };
      if (isShopping) {
        nextCategories[TABS.FALTANTES] = removeCat(nextCategories[TABS.FALTANTES]);
        nextCategories[TABS.EXISTENTES] = removeCat(nextCategories[TABS.EXISTENTES]);
      } else {
        nextCategories[activeTab] = removeCat(nextCategories[activeTab]);
      }
      return {
        ...h,
        categories: nextCategories,
        inventory: h.inventory.filter(item => {
          if (item.category !== catName) return true;
          return isShopping ? item.tab !== GROUP_COMPRAS : item.tab !== activeTab;
        })
      };
    });
  };

  const handleAddProduct = (e, category) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price === '' || isNaN(newProduct.price)) return;
    if (isRecurring) {
      const day = parseInt(newProduct.dueDay, 10);
      if (!day || day < 1 || day > 31) return;
    }

    const product = {
      id: crypto.randomUUID(),
      tab: isShopping ? GROUP_COMPRAS : activeTab,
      category,
      name: newProduct.name.trim(),
      price: parseFloat(newProduct.price),
      quantity: isRecurring ? 1 : Math.max(1, parseInt(newProduct.quantity, 10) || 1),
      bought: activeTab === TABS.EXISTENTES, // Si se agrega desde "existentes", nace comprado
      dueDay: isRecurring ? parseInt(newProduct.dueDay, 10) : undefined
    };

    updateActiveHousehold(h => ({ ...h, inventory: [...h.inventory, product] }));
    setNewProduct({ name: '', price: '', quantity: '1', dueDay: '', category: '' }); // Reset
  };

  // Carga un producto en el formulario para editarlo
  const handleEditProduct = (item) => {
    setEditingId(item.id);
    setNewProduct({
      name: item.name,
      price: String(item.price),
      quantity: String(item.quantity ?? 1),
      dueDay: item.dueDay ? String(item.dueDay) : '',
      category: item.category
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewProduct({ name: '', price: '', quantity: '1', dueDay: '', category: '' });
  };

  const handleUpdateProduct = (e, category) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price === '' || isNaN(newProduct.price)) return;
    if (isRecurring) {
      const day = parseInt(newProduct.dueDay, 10);
      if (!day || day < 1 || day > 31) return;
    }

    updateActiveHousehold(h => ({
      ...h,
      inventory: h.inventory.map(item => item.id === editingId ? {
        ...item,
        category,
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        quantity: isRecurring ? 1 : Math.max(1, parseInt(newProduct.quantity, 10) || 1),
        dueDay: isRecurring ? parseInt(newProduct.dueDay, 10) : undefined
      } : item)
    }));
    handleCancelEdit();
  };

  const handleDeleteProduct = (id) => {
    updateActiveHousehold(h => ({ ...h, inventory: h.inventory.filter(item => item.id !== id) }));
  };

  const handleToggleBought = (id) => {
    updateActiveHousehold(h => ({
      ...h,
      inventory: h.inventory.map(item => item.id === id ? { ...item, bought: !item.bought } : item)
    }));
  };

  // --- EXPORTACIÓN / IMPORTACIÓN ---
  const handleExport = async () => {
    const payload = {
      app: 'idocash',
      version: 2,
      exportedAt: new Date().toISOString(),
      households: appState.households
    };
    const json = JSON.stringify(payload, null, 2);
    const filename = `idocash-${new Date().toISOString().slice(0, 10)}.json`;

    if (isNative) {
      try {
        // Pide permiso para guardar en archivos (primera vez)
        const perm = await Filesystem.requestPermissions();
        if (perm.publicStorage !== 'granted') {
          alert(t('exportDenied'));
          return;
        }
        // Crea la carpeta de exportación si no existe (primera exportación)
        try {
          await Filesystem.mkdir({ path: EXPORT_DIR, directory: Directory.Documents, recursive: true });
        } catch (mkdirErr) {
          if (!String(mkdirErr?.message ?? '').includes('already exists')) throw mkdirErr;
        }
        const result = await Filesystem.writeFile({
          path: `${EXPORT_DIR}/${filename}`,
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        alert(t('exportSuccess', { path: result.uri }));
      } catch {
        alert(t('exportError'));
      }
      return;
    }

    // Web / PC: descarga directa
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aplica los datos importados (validación + normalización común)
  const applyImportedData = (raw) => {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.households) || data.households.length === 0) throw new Error('invalid');
    const households = data.households.map(normalizeHousehold);
    setAppState({ households, activeHouseholdId: households[0].id });
  };

  // Importación en Android: selector de archivos del sistema (SAF) con lectura
  const handleNativeImport = async () => {
    try {
      const result = await CapgoFilePicker.pickFiles({ types: ['application/json', '.json'], readData: true });
      const file = result.files?.[0];
      if (!file) return; // usuario canceló
      if (!file.data) throw new Error('nodata');
      applyImportedData(decodeBase64(file.data));
      alert(t('importSuccess'));
    } catch (err) {
      if (String(err?.message ?? '').toLowerCase().includes('cancel')) {
        alert(t('importCanceled'));
      } else {
        alert(t('importReadError'));
      }
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyImportedData(reader.result);
        alert(t('importSuccess'));
      } catch {
        alert(t('importError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const dark = settings.theme === 'dark';

  // --- RENDERIZADO DE INTERFAZ ---
  return (
    <div className={`min-h-screen bg-ink text-bone font-mono transition-colors`}>

      {/* HEADER & SUMATORIA GLOBAL */}
      <header className="bg-ink text-bone border-b border-[#2a2a2a] sticky top-0 z-10 shadow-sm p-6 flex flex-col items-center justify-center relative">
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 p-2.5 rounded-xl text-bone/60 hover:text-bone hover:bg-[#1a1a1a] transition-colors"
          title={t('settings')}
          aria-label={t('settings')}
        >
          <Settings size={20} />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="ido-dot" aria-hidden="true" />
          <h1 className="ido-scratch text-sm font-semibold uppercase tracking-[0.3em]">{t('appTitle')}</h1>
        </div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-bone/50 mb-2">hecho a mano · con tinta y ruido</p>
        <div className="flex flex-col items-center">
          <span className="text-bone/60 text-sm">{t('totalValue')} · {activeHousehold.name}</span>
          <span className="text-4xl sm:text-5xl font-black text-bone tracking-tight flex items-center gap-3">
            {formatMoney(globalSum)}
            <span className="text-xs font-semibold text-[#d32f2f] tracking-widest">● REC</span>
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">

        {/* SELECTOR DE HOGARES */}
        <section className="mb-6 ido-paper ido-hand flex flex-wrap items-center gap-3 p-3">
          <Home size={18} className="text-slate-400 ml-1" />
          <div className="flex flex-wrap gap-2">
            {appState.households.map(h => (
              <div
                key={h.id}
                className={`flex items-center gap-1.5 rounded-xl pl-3 pr-2 py-2 text-sm font-semibold transition-colors ${
                  h.id === activeHousehold.id
                    ? 'bg-slate-800 text-white dark:bg-blue-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <button onClick={() => setAppState(prev => ({ ...prev, activeHouseholdId: h.id }))}>
                  {h.name}
                </button>
                <button
                  onClick={() => handleRenameHousehold(h.id)}
                  className="opacity-60 hover:opacity-100 p-1 rounded-md"
                  title={t('renameHome')}
                  aria-label={`${t('renameHome')}: ${h.name}`}
                >
                  <Pencil size={13} />
                </button>
                {appState.households.length > 1 && (
                  <button
                    onClick={() => handleDeleteHousehold(h.id)}
                    className="opacity-60 hover:opacity-100 hover:text-red-400 p-1 rounded-md"
                    title={t('deleteHome')}
                    aria-label={`${t('deleteHome')}: ${h.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleAddHousehold}
            className="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle size={16} /> {t('newHome')}
          </button>
        </section>

        {/* NAVEGACIÓN POR PESTAÑA (MENÚ DESPLEGABLE) */}
        <label className="block mb-8">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            aria-label={t('selectTab')}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-shadow"
          >
            {TAB_ORDER.map(id => (
              <option key={id} value={id}>{t(`tabs.${id}`)}</option>
            ))}
          </select>
        </label>

        {/* AVISO DE SINCRONIZACIÓN */}
        {isShopping && (
          <div className="mb-6 flex items-center gap-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-sm px-4 py-3 rounded-xl">
            <Info size={18} className="shrink-0" />
            {activeTab === TABS.FALTANTES ? (
              <span>{t('syncNoticeMissing')}</span>
            ) : (
              <span>{t('syncNoticeExisting')}</span>
            )}
          </div>
        )}

        {/* SUMATORIA DE PESTAÑA ACTIVA */}
        <div className="mb-6 p-6 bg-blue-600 rounded-2xl text-white shadow-lg flex justify-between items-center">
          <div>
            <h2 className="text-blue-100 text-sm font-medium uppercase tracking-wider">{t('totalIn')} {t(`tabs.${activeTab}`)}</h2>
            <p className="text-3xl sm:text-4xl font-bold mt-1">
              {formatMoney(tabSum)}
            </p>
          </div>
          <DollarSign size={48} className="text-blue-400 opacity-50" />
        </div>

        {/* GRÁFICO DE TORTA GLOBAL (faltantes + existentes + servicios) */}
        <div className="mb-8 ido-paper ido-hand p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">{t('pieTitle')}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{t('pieScope')}</p>
          {globalPie.sum > 0 && globalPie.data.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <PieChart data={globalPie.data} dark={dark} />
              <ul className="flex-1 w-full space-y-2.5">
                {globalPie.data.map(d => (
                  <li key={d.name} className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0">
                    <span className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-medium">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {formatMoney(d.value)}
                      <span className="text-slate-400 text-xs ml-1.5">({Math.round((d.value / globalPie.sum) * 100)}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">{t('pieEmpty')}</p>
          )}
        </div>

        {/* GESTIÓN DE CATEGORÍAS */}
        <form onSubmit={handleAddCategory} className="mb-8 ido-paper ido-hand flex flex-wrap gap-3 items-center p-3">
          <input
            type="text"
            placeholder={t('newCategory')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          <label
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
            title={t('color')}
          >
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              aria-label={t('color')}
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('color')}</span>
          </label>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <PlusCircle size={20} /> {t('addCategory')}
          </button>
        </form>

        {/* ORDENAR PRODUCTOS POR PRECIO */}
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <ArrowUpDown size={16} /> {t('sortProducts')}
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-shadow"
          >
            <option value="none">{t('sortNone')}</option>
            <option value="asc">{t('sortAsc')}</option>
            <option value="desc">{t('sortDesc')}</option>
          </select>
        </div>

        {/* LISTADO DE CATEGORÍAS Y PRODUCTOS */}
        <div className="space-y-6">
          {activeCategories.map(cat => {
            const catItems = sortedItems(tabItems.filter(item => item.category === cat.name));
            return (
            <div key={cat.name} className="ido-paper ido-hand overflow-hidden">

              {/* Cabecera de Categoría (clic para desplegar/replegar) */}
              <div
                onClick={() => toggleCollapse(cat.name)}
                role="button"
                aria-expanded={!isCollapsed(cat.name)}
                className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700 p-4 flex flex-wrap justify-between items-center gap-3 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isCollapsed(cat.name)
                    ? <ChevronRight size={18} className="text-slate-400 shrink-0" />
                    : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <Tag size={18} className="text-slate-400" />
                  <h3 className="ido-display text-lg font-bold text-slate-700 dark:text-slate-100">{cat.name}</h3>
                  {isCollapsed(cat.name) && catItems.length > 0 && (
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {t('items', { n: catItems.length })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right mr-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{t('subtotal')}</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatMoney(categorySubtotals[cat.name] ?? 0)}
                    </span>
                  </div>
                  <label
                    className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                    title={t('color')}
                  >
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => handleCategoryColor(cat.name, e.target.value)}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent p-0"
                      aria-label={`${t('color')}: ${cat.name}`}
                    />
                  </label>
                  <button
                    onClick={() => handleRenameCategory(cat.name)}
                    className="p-2 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                    title={t('editCategory')}
                    aria-label={`${t('editCategory')}: ${cat.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.name)}
                    className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title={t('deleteCategory')}
                    aria-label={`${t('deleteCategory')}: ${cat.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {!isCollapsed(cat.name) && (
                <div className="p-4">
                {/* Lista de productos */}
                <ul className="mb-4 space-y-2">
                  {catItems.map(item => (
                    editingId === item.id ? (
                      <li key={item.id} className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40">
                        <div className="w-full flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                          <Pencil size={14} /> {t('editingProduct', { name: item.name })}
                        </div>
                        <form
                          onSubmit={(e) => handleUpdateProduct(e, cat.name)}
                          className="flex flex-wrap gap-2 items-center"
                        >
                          <input
                            type="text"
                            placeholder={t('productName')}
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="flex-grow min-w-[150px] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          {isRecurring ? (
                            <input
                              type="number"
                              step="1"
                              min="1"
                              max="31"
                              placeholder={t('dueDay')}
                              value={newProduct.dueDay}
                              onChange={(e) => setNewProduct({ ...newProduct, dueDay: e.target.value })}
                              className="w-36 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                              required
                            />
                          ) : (
                            <input
                              type="number"
                              step="1"
                              min="1"
                              placeholder={t('quantity')}
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                              className="w-24 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                              required
                            />
                          )}
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder={t('price', { currency: settings.currency })}
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            className="w-32 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            required
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800"
                          >
                            <Check size={16} /> {t('save')}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                          >
                            <X size={16} /> {t('cancel')}
                          </button>
                        </form>
                      </li>
                    ) : (
                    <li key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-100">{item.name}</p>
                          {isRecurring ? (
                            <p className={`text-xs flex items-center gap-1 ${nextPaymentInfo(item.dueDay).cls}`}>
                              <CalendarDays size={13} /> {nextPaymentInfo(item.dueDay).text}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('units', { n: item.quantity ?? 1 })}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                          {formatMoney(item.price * (item.quantity ?? 1))}
                        </span>
                        {isShopping && (
                          activeTab === TABS.FALTANTES ? (
                            <button
                              onClick={() => handleToggleBought(item.id)}
                              className="text-green-500 hover:text-green-700 p-2 hover:bg-green-50 dark:hover:bg-green-950 rounded-md transition-colors"
                              title={t('buy')}
                              aria-label={`${t('buy')}: ${item.name}`}
                            >
                              <ShoppingCart size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleBought(item.id)}
                              className="text-amber-500 hover:text-amber-700 p-2 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-md transition-colors"
                              title={t('returnToShopping')}
                              aria-label={`${t('returnToShopping')}: ${item.name}`}
                            >
                              <RotateCcw size={18} />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleEditProduct(item)}
                          className="text-slate-400 hover:text-blue-500 p-2 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md transition-colors"
                          title={t('editProduct')}
                          aria-label={`${t('editProduct')}: ${item.name}`}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                          title={t('deleteProduct')}
                          aria-label={`${t('deleteProduct')}: ${item.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </li>
                    )
                  ))}
                  {catItems.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-4">{t('noProducts')}</p>
                  )}
                </ul>

                {/* Formulario Añadir Producto a esta categoría */}
                <form
                  onSubmit={(e) => handleAddProduct(e, cat.name)}
                  className="flex flex-wrap gap-2 items-center bg-slate-50 dark:bg-slate-700/40 p-2 rounded-xl border border-slate-100 dark:border-slate-700"
                >
                  <input
                    type="text"
                    placeholder={t('productName')}
                    value={newProduct.category === cat.name ? newProduct.name : ''}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value, category: cat.name })}
                    className="flex-grow min-w-[150px] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {isRecurring ? (
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="31"
                      placeholder={t('dueDay')}
                      value={newProduct.category === cat.name ? newProduct.dueDay : ''}
                      onChange={(e) => setNewProduct({ ...newProduct, dueDay: e.target.value, category: cat.name })}
                      className="w-36 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  ) : (
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder={t('quantity')}
                      value={newProduct.category === cat.name ? newProduct.quantity : '1'}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value, category: cat.name })}
                      className="w-24 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                  )}
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder={t('price', { currency: settings.currency })}
                    value={newProduct.category === cat.name ? newProduct.price : ''}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value, category: cat.name })}
                    className="w-32 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  >
                    <PlusCircle size={16} /> {t('add')}
                  </button>
                </form>
                </div>
              )}
            </div>
            );
          })}

          {activeCategories.length === 0 && (
            <div className="text-center p-12 ido-paper ido-hand">
              <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('emptyCategories')}</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER BRANDING IDOTIZA */}
      <footer className="text-center px-4 py-8 border-t border-slate-200 dark:border-[#1a1a1a]">
        <p className="ido-display text-sm text-slate-500 dark:text-slate-400 mb-1">
          <span className="ido-scratch">© 2026 IDOTIZA — SANTIAGO, CL</span>
        </p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-400">
          hecho a mano · con tinta y ruido
        </p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-400 mt-1">
          ido = abstraerse · tiza = perfecto
        </p>
      </footer>

      {/* MODAL DE AJUSTES */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="ido-paper ido-hand-red max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={t('settingsTitle')}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-slate-400" /> {t('settingsTitle')}
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={t('close')}
                aria-label={t('close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Moneda */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('currency')}</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.keys(CURRENCIES).map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              {/* Idioma */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('language')}</label>
                <select
                  value={settings.lang}
                  onChange={(e) => setSettings(s => ({ ...s, lang: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Tema */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{t('theme')}</label>
                <div className="flex gap-2">
                  {['light', 'dark'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSettings(s => ({ ...s, theme: mode }))}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        settings.theme === mode
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {t(mode === 'light' ? 'light' : 'dark')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exportación / Importación */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-3">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Download size={16} /> {t('exportData')}
                </button>
                {isNative ? (
                  <button
                    onClick={handleNativeImport}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-800 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Upload size={16} /> {t('importData')}
                  </button>
                ) : (
                  <label className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-800 text-white px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                    <Upload size={16} /> {t('importData')}
                    <input type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
                  </label>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  {t('exportDesc')} {t('importDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const CAR_BRANDS_LIST: string[] = [
  'Toyota',
  'Hyundai',
  'Kia',
  'Peugeot',
  'Renault',
  'Citroën',
  'Volkswagen',
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Ford',
  'Fiat',
  'Opel',
  'Nissan',
  'Dacia',
  'Seat',
  'Skoda',
  'Suzuki',
  'Honda',
  'Mazda',
  'Mitsubishi',
  'MG',
  'Chery',
  'Geely',
  'BYD',
  'Chevrolet',
  'Isuzu',
];

export const DEFAULT_CAR_MODELS_MAP: Record<string, string[]> = {
  Toyota: [
    'Yaris',
    'Corolla',
    'Camry',
    'RAV4',
    'C-HR',
    'Land Cruiser',
    'Hilux',
    'Aygo',
    'Prius',
    'Fortuner',
  ],
  Peugeot: [
    '208',
    '2008',
    '308',
    '3008',
    '408',
    '508',
    'Partner',
    'Expert',
    'Rifter',
    '5008',
  ],
  Renault: [
    'Clio',
    'Captur',
    'Megane',
    'Arkana',
    'Austral',
    'Kangoo',
    'Trafic',
    'Kadjar',
    'Twingo',
    'Duster',
  ],
  Hyundai: [
    'i10',
    'i20',
    'i30',
    'Elantra',
    'Tucson',
    'Santa Fe',
    'Accent',
    'Creta',
    'Kona',
    'Staria',
  ],
  Kia: [
    'Picanto',
    'Rio',
    'Ceed',
    'Cerato',
    'Sportage',
    'Sorento',
    'Sonet',
    'Seltos',
    'K5',
  ],
  Citroën: [
    'C3',
    'C3 Aircross',
    'C4',
    'C4 Cactus',
    'C5 Aircross',
    'Berlingo',
    'Jumpy',
    'C-Elysée',
  ],
  Volkswagen: [
    'Polo',
    'Golf',
    'T-Roc',
    'Tiguan',
    'Passat',
    'Caddy',
    'Touareg',
    'Taigo',
    'T-Cross',
    'Amarok',
  ],
  Audi: [
    'A1',
    'A3',
    'A4',
    'A5',
    'A6',
    'Q2',
    'Q3',
    'Q5',
    'Q7',
    'Q8',
  ],
  BMW: [
    'Série 1',
    'Série 2',
    'Série 3',
    'Série 4',
    'Série 5',
    'X1',
    'X3',
    'X5',
    'X6',
  ],
  'Mercedes-Benz': [
    'Classe A',
    'Classe B',
    'Classe C',
    'Classe E',
    'GLA',
    'GLB',
    'GLC',
    'GLE',
    'Vito',
    'Citan',
  ],
  Ford: [
    'Fiesta',
    'Focus',
    'Puma',
    'Kuga',
    'Ranger',
    'Transit',
    'Mondeo',
    'EcoSport',
  ],
  Fiat: [
    '500',
    'Panda',
    'Tipo',
    'Fiorino',
    'Doblo',
    'Ducato',
    '500X',
    'Punto',
  ],
  Opel: [
    'Corsa',
    'Astra',
    'Mokka',
    'Crossland',
    'Grandland',
    'Combo',
    'Zafira',
  ],
  Nissan: [
    'Micra',
    'Juke',
    'Qashqai',
    'X-Trail',
    'Navara',
    'Sunny',
    'Patrol',
  ],
  Dacia: [
    'Sandero',
    'Sandero Stepway',
    'Duster',
    'Logan',
    'Jogger',
    'Dokker',
    'Lodgy',
  ],
  Seat: [
    'Ibiza',
    'Leon',
    'Arona',
    'Ateca',
    'Tarraco',
  ],
  Skoda: [
    'Fabia',
    'Scala',
    'Octavia',
    'Superb',
    'Kamiq',
    'Karoq',
    'Kodiaq',
  ],
  Suzuki: [
    'Swift',
    'Baleno',
    'Jimny',
    'Vitara',
    'S-Cross',
    'Celerio',
    'Dzire',
  ],
  Honda: [
    'Civic',
    'HR-V',
    'CR-V',
    'Jazz',
    'City',
    'Accord',
  ],
  Mazda: [
    'Mazda 2',
    'Mazda 3',
    'Mazda 6',
    'CX-3',
    'CX-30',
    'CX-5',
    'BT-50',
  ],
  Mitsubishi: [
    'Space Star',
    'Attrage',
    'ASX',
    'Eclipse Cross',
    'Outlander',
    'L200',
    'Pajero',
  ],
  MG: [
    'MG3',
    'MG4',
    'MG5',
    'MG ZS',
    'MG HS',
    'MG One',
    'MG GT',
  ],
  Chery: [
    'Tiggo 2 Pro',
    'Tiggo 4 Pro',
    'Tiggo 7 Pro',
    'Tiggo 8 Pro',
    'Arrizo 5',
    'Arrizo 6 Pro',
  ],
  Geely: [
    'Coolray',
    'Emgrand',
    'Azkarra',
    'Tugella',
    'Monjaro',
    'GX3 Pro',
    'Okavango',
  ],
  BYD: [
    'Dolphin',
    'Atto 3',
    'Seal',
    'Tang',
    'Han',
    'Song Plus',
    'F3',
  ],
  Chevrolet: [
    'Spark',
    'Aveo',
    'Optra',
    'Captiva',
    'Colorado',
    'Tahoe',
    'Groove',
  ],
  Isuzu: [
    'D-Max',
    'MU-X',
    'N-Series',
  ],
};

export function getModelsForBrand(brand: string, customMap?: Record<string, string[]>): string[] {
  if (!brand) return [];
  const map = customMap || DEFAULT_CAR_MODELS_MAP;
  return map[brand] || [];
}

const CUSTOM_CATALOG_STORAGE_KEY = 'janenecar_custom_car_catalog_v1';

type CustomCatalog = Record<string, string[]>;

function normalizeCatalogKey(value: string): string {
  return (value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');
}

function prettifyCatalogValue(value: string): string {
  return (value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|[\s'-])([\p{L}])/gu, (_match, prefix: string, letter: string) =>
      `${prefix}${letter.toLocaleUpperCase('fr')}`
    );
}

function readCustomCatalog(): CustomCatalog {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_CATALOG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCustomCatalog(catalog: CustomCatalog): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  localStorage.setItem(CUSTOM_CATALOG_STORAGE_KEY, JSON.stringify(catalog));
}

export function getCarBrands(): string[] {
  const custom = Object.keys(readCustomCatalog());
  const merged = [...CAR_BRANDS_LIST];
  custom.forEach((brand) => {
    if (!merged.some((item) => normalizeCatalogKey(item) === normalizeCatalogKey(brand))) {
      merged.push(brand);
    }
  });
  return merged.sort((a, b) => a.localeCompare(b, 'fr'));
}

export function getAllModelsForBrand(brand: string): string[] {
  if (!brand) return [];
  const canonicalBrand = getCarBrands().find(
    (item) => normalizeCatalogKey(item) === normalizeCatalogKey(brand)
  ) || brand;
  const defaults = DEFAULT_CAR_MODELS_MAP[canonicalBrand] || [];
  const customCatalog = readCustomCatalog();
  const customBrandKey = Object.keys(customCatalog).find(
    (item) => normalizeCatalogKey(item) === normalizeCatalogKey(canonicalBrand)
  );
  const custom = customBrandKey ? customCatalog[customBrandKey] || [] : [];
  const merged = [...defaults];
  custom.forEach((model) => {
    if (!merged.some((item) => normalizeCatalogKey(item) === normalizeCatalogKey(model))) {
      merged.push(model);
    }
  });
  return merged.sort((a, b) => a.localeCompare(b, 'fr'));
}

export function addCustomBrand(input: string): { value: string; created: boolean } {
  const cleaned = prettifyCatalogValue(input);
  if (!cleaned) return { value: '', created: false };
  const existing = getCarBrands().find(
    (item) => normalizeCatalogKey(item) === normalizeCatalogKey(cleaned)
  );
  if (existing) return { value: existing, created: false };

  const catalog = readCustomCatalog();
  catalog[cleaned] = [];
  writeCustomCatalog(catalog);
  return { value: cleaned, created: true };
}

export function addCustomModel(brandInput: string, modelInput: string): { value: string; created: boolean } {
  const brandResult = addCustomBrand(brandInput);
  const brand = brandResult.value;
  const cleanedModel = prettifyCatalogValue(modelInput);
  if (!brand || !cleanedModel) return { value: '', created: false };

  const existing = getAllModelsForBrand(brand).find(
    (item) => normalizeCatalogKey(item) === normalizeCatalogKey(cleanedModel)
  );
  if (existing) return { value: existing, created: false };

  const catalog = readCustomCatalog();
  const key = Object.keys(catalog).find(
    (item) => normalizeCatalogKey(item) === normalizeCatalogKey(brand)
  ) || brand;
  catalog[key] = [...(catalog[key] || []), cleanedModel];
  writeCustomCatalog(catalog);
  return { value: cleanedModel, created: true };
}

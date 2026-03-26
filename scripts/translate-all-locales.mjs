/**
 * Offline batch translator for all Swaply locales.
 * Uses comprehensive word/phrase dictionaries per language.
 * For remaining untranslated strings, the runtime Claude API handles them.
 */
import fs from 'fs';

function flatten(obj, prefix = '') {
  const r = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) Object.assign(r, flatten(v, p));
    else r[p] = v;
  }
  return r;
}

function setNested(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// Core vocabulary per language for high-frequency UI words
const VOCAB = {
  it: {
    'Save': 'Salva', 'Cancel': 'Annulla', 'Delete': 'Elimina', 'Edit': 'Modifica',
    'View': 'Visualizza', 'Back': 'Indietro', 'Next': 'Avanti', 'Close': 'Chiudi',
    'Open': 'Apri', 'Submit': 'Invia', 'Confirm': 'Conferma', 'Search': 'Cerca',
    'Filter': 'Filtra', 'Share': 'Condividi', 'Report': 'Segnala', 'Block': 'Blocca',
    'Settings': 'Impostazioni', 'Profile': 'Profilo', 'Home': 'Home',
    'Loading': 'Caricamento', 'Saving': 'Salvataggio', 'Sending': 'Invio',
    'Active': 'Attivo', 'Pending': 'In attesa', 'Completed': 'Completato',
    'Expired': 'Scaduto', 'New': 'Nuovo', 'Good': 'Buono', 'Used': 'Usato',
    'Location': 'Posizione', 'Description': 'Descrizione', 'Title': 'Titolo',
    'Category': 'Categoria', 'Condition': 'Condizione', 'Status': 'Stato',
    'Photos': 'Foto', 'Tags': 'Tag', 'Date': 'Data', 'Price': 'Prezzo',
    'Value': 'Valore', 'Free': 'Gratis', 'Premium': 'Premium',
    'Objects': 'Oggetti', 'Messages': 'Messaggi', 'Exchange': 'Scambio',
    'Matching': 'Corrispondenze', 'Notifications': 'Notifiche',
    'Accept': 'Accetta', 'Reject': 'Rifiuta', 'Negotiate': 'Negozia',
    'Send': 'Invia', 'Login': 'Accedi', 'Register': 'Registrati',
    'Sign Out': 'Esci', 'Email': 'Email', 'Password': 'Password',
    'or': 'o', 'and': 'e', 'from': 'da', 'to': 'a', 'for': 'per',
    'Yes': 'Sì', 'No': 'No', 'Other': 'Altro', 'All': 'Tutti',
    'items': 'oggetti', 'item': 'oggetto', 'swap': 'scambio', 'swaps': 'scambi',
    'match': 'corrispondenza', 'matches': 'corrispondenze',
    'courier': 'corriere', 'couriers': 'corrieri',
    'review': 'recensione', 'reviews': 'recensioni',
    'token': 'token', 'tokens': 'token',
  },
  de: {
    'Save': 'Speichern', 'Cancel': 'Abbrechen', 'Delete': 'Löschen', 'Edit': 'Bearbeiten',
    'View': 'Ansehen', 'Back': 'Zurück', 'Next': 'Weiter', 'Close': 'Schließen',
    'Open': 'Öffnen', 'Submit': 'Absenden', 'Confirm': 'Bestätigen', 'Search': 'Suchen',
    'Filter': 'Filtern', 'Share': 'Teilen', 'Report': 'Melden', 'Block': 'Blockieren',
    'Settings': 'Einstellungen', 'Profile': 'Profil', 'Home': 'Startseite',
    'Loading': 'Laden', 'Active': 'Aktiv', 'Pending': 'Ausstehend', 'Completed': 'Abgeschlossen',
    'New': 'Neu', 'Good': 'Gut', 'Used': 'Gebraucht', 'Location': 'Standort',
    'Description': 'Beschreibung', 'Title': 'Titel', 'Category': 'Kategorie',
    'Objects': 'Objekte', 'Messages': 'Nachrichten', 'Exchange': 'Tausch',
    'Matching': 'Übereinstimmungen', 'Notifications': 'Benachrichtigungen',
    'Accept': 'Akzeptieren', 'Reject': 'Ablehnen', 'Send': 'Senden',
    'Login': 'Anmelden', 'Register': 'Registrieren', 'Sign Out': 'Abmelden',
    'Yes': 'Ja', 'No': 'Nein', 'Other': 'Sonstiges', 'All': 'Alle',
    'items': 'Objekte', 'swap': 'Tausch', 'swaps': 'Tausche',
    'courier': 'Kurier', 'review': 'Bewertung',
  },
  fr: {
    'Save': 'Enregistrer', 'Cancel': 'Annuler', 'Delete': 'Supprimer', 'Edit': 'Modifier',
    'View': 'Voir', 'Back': 'Retour', 'Next': 'Suivant', 'Close': 'Fermer',
    'Open': 'Ouvrir', 'Submit': 'Envoyer', 'Confirm': 'Confirmer', 'Search': 'Rechercher',
    'Filter': 'Filtrer', 'Share': 'Partager', 'Report': 'Signaler', 'Block': 'Bloquer',
    'Settings': 'Paramètres', 'Profile': 'Profil', 'Home': 'Accueil',
    'Loading': 'Chargement', 'Active': 'Actif', 'Pending': 'En attente', 'Completed': 'Terminé',
    'New': 'Neuf', 'Good': 'Bon', 'Used': 'Utilisé', 'Location': 'Localisation',
    'Description': 'Description', 'Title': 'Titre', 'Category': 'Catégorie',
    'Objects': 'Objets', 'Messages': 'Messages', 'Exchange': 'Échange',
    'Matching': 'Correspondances', 'Notifications': 'Notifications',
    'Accept': 'Accepter', 'Reject': 'Refuser', 'Send': 'Envoyer',
    'Login': 'Se connecter', 'Register': "S'inscrire", 'Sign Out': 'Se déconnecter',
    'Yes': 'Oui', 'No': 'Non', 'Other': 'Autre', 'All': 'Tous',
    'items': 'objets', 'swap': 'échange', 'courier': 'coursier', 'review': 'avis',
  },
  es: {
    'Save': 'Guardar', 'Cancel': 'Cancelar', 'Delete': 'Eliminar', 'Edit': 'Editar',
    'View': 'Ver', 'Back': 'Atrás', 'Next': 'Siguiente', 'Close': 'Cerrar',
    'Open': 'Abrir', 'Submit': 'Enviar', 'Confirm': 'Confirmar', 'Search': 'Buscar',
    'Filter': 'Filtrar', 'Share': 'Compartir', 'Report': 'Reportar', 'Block': 'Bloquear',
    'Settings': 'Configuración', 'Profile': 'Perfil', 'Home': 'Inicio',
    'Loading': 'Cargando', 'Active': 'Activo', 'Pending': 'Pendiente', 'Completed': 'Completado',
    'New': 'Nuevo', 'Good': 'Bueno', 'Used': 'Usado', 'Location': 'Ubicación',
    'Objects': 'Objetos', 'Messages': 'Mensajes', 'Exchange': 'Intercambio',
    'Accept': 'Aceptar', 'Reject': 'Rechazar', 'Send': 'Enviar',
    'Login': 'Iniciar sesión', 'Register': 'Registrarse', 'Sign Out': 'Cerrar sesión',
    'Yes': 'Sí', 'No': 'No', 'Other': 'Otro', 'All': 'Todos',
    'items': 'objetos', 'swap': 'intercambio', 'courier': 'mensajero', 'review': 'reseña',
  },
  pt: {
    'Save': 'Guardar', 'Cancel': 'Cancelar', 'Delete': 'Eliminar', 'Edit': 'Editar',
    'View': 'Ver', 'Back': 'Voltar', 'Next': 'Seguinte', 'Close': 'Fechar',
    'Objects': 'Objetos', 'Messages': 'Mensagens', 'Exchange': 'Troca',
    'Accept': 'Aceitar', 'Reject': 'Rejeitar', 'Send': 'Enviar',
    'Login': 'Entrar', 'Register': 'Registar', 'Settings': 'Definições',
    'Yes': 'Sim', 'No': 'Não', 'All': 'Todos',
  },
};

// Process each locale
const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));
const enFlat = flatten(en);
const locales = fs.readdirSync('src/messages').filter(f => f.endsWith('.json') && f !== 'en.json').map(f => f.replace('.json', ''));

let totalApplied = 0;

for (const locale of locales.sort()) {
  const locFile = `src/messages/${locale}.json`;
  const loc = JSON.parse(fs.readFileSync(locFile, 'utf8'));
  const locFlat = flatten(loc);

  const vocab = VOCAB[locale] || {};
  let applied = 0;

  for (const [key, enVal] of Object.entries(enFlat)) {
    if (locFlat[key] !== enVal || typeof enVal !== 'string' || enVal.length <= 3) continue;

    // Try exact match in vocab
    if (vocab[enVal]) {
      setNested(loc, key, vocab[enVal]);
      applied++;
      continue;
    }

    // Try word-level substitution for short strings (< 50 chars)
    if (enVal.length < 50 && Object.keys(vocab).length > 0) {
      let translated = enVal;
      let changed = false;
      // Sort vocab by length (longest first) to avoid partial replacements
      const sorted = Object.entries(vocab).sort((a, b) => b[0].length - a[0].length);
      for (const [enWord, locWord] of sorted) {
        const regex = new RegExp(`\\b${enWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const newVal = translated.replace(regex, locWord);
        if (newVal !== translated) { translated = newVal; changed = true; }
      }
      if (changed && translated !== enVal) {
        setNested(loc, key, translated);
        applied++;
      }
    }
  }

  if (applied > 0) {
    fs.writeFileSync(locFile, JSON.stringify(loc, null, 2) + '\n');
    totalApplied += applied;
  }
  console.log(`${locale}: ${applied} translations applied`);
}

console.log(`\nTotal: ${totalApplied} translations applied across ${locales.length} locales`);

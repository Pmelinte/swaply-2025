/**
 * SEO data for category and city landing pages.
 * Used by static generation (generateStaticParams) and metadata.
 */

/* ─── Categories ─── */

export interface SEOCategory {
  slug: string;
  name: string;
  /** Romanian display name for H1/titles */
  nameRo: string;
  /** Unique intro paragraph (150-200 words) */
  intro: string;
  /** Related category slugs for internal linking */
  related: string[];
  /** Lucide icon name */
  icon: string;
}

export const SEO_CATEGORIES: SEOCategory[] = [
  {
    slug: "electronics",
    name: "Electronics",
    nameRo: "Electronică",
    intro:
      "Telefoane, laptopuri, console de jocuri, căști și gadget-uri — electronicele sunt cele mai schimbate obiecte pe Swaply. Ciclul rapid de upgrade face ca milioane de dispozitive funcționale să rămână neutilizate în sertare. În loc să le vinzi la preț redus sau să le arunci, le poți schimba direct pe alt dispozitiv de care ai nevoie. Un iPhone din generația anterioară poate deveni un monitor de gaming. O tabletă veche poate deveni o pereche de căști wireless premium. Pe Swaply, algoritmul AI analizează starea, marca și valoarea estimată pentru a-ți sugera cele mai echitabile potriviri. Nu plătești comisioane și nu aștepți cumpărători — doar schimb direct, rapid și sigur.",
    related: ["toys", "music", "tools"],
    icon: "monitor",
  },
  {
    slug: "sport",
    name: "Sport",
    nameRo: "Sport & Outdoor",
    intro:
      "Biciclete, echipament de fitness, trotinete, ski-uri, echipament de camping și tot ce ține de sport și activități în aer liber. Sezonalitatea sporturilor face barter-ul ideal: iarna schimbi rolele pe ski-uri, vara schimbi sania pe o bicicletă. Echipamentul sportiv de calitate este scump nou, dar își păstrează funcționalitatea ani de zile. Pe Swaply, poți schimba acel set de gantere pe care nu le mai folosești pe o rachetă de tenis, sau trampolina copiilor pe un cort de camping. Comunitatea de sportivi activi din România crește constant pe platformă, iar potrivirile sunt rapide datorită cererii ridicate din această categorie.",
    related: ["fashion", "electronics", "garden"],
    icon: "bike",
  },
  {
    slug: "arts",
    name: "Arts",
    nameRo: "Artă & Hobby",
    intro:
      "Instrumente muzicale, echipament de pictură, jocuri de societate, colecții și tot ce ține de hobby-uri creative. Pasiunile se schimbă, dar obiectele rămân. Chitara pe care ai învățat primele acorduri poate deveni un set profesional de acuarele pentru altcineva. Un colț de Lego neutilizat poate deveni un puzzle de 5000 de piese. Categoria Artă & Hobby este una dintre cele mai diverse de pe Swaply — aici găsești de la vinilinuri rare la echipament de fotografie analogică, de la seturi de desen manga la instrumente de ceramică. Fiecare obiect are o poveste, iar prin schimb, acea poveste continuă în mâinile cuiva care îl va folosi cu adevărat.",
    related: ["books", "music", "toys"],
    icon: "palette",
  },
  {
    slug: "books",
    name: "Books",
    nameRo: "Cărți & Media",
    intro:
      "Romane, manuale, cărți de dezvoltare personală, benzi desenate, DVD-uri și viniluri. România are una dintre cele mai active comunități de schimb de cărți din Europa. O carte citită o dată nu trebuie să adune praf pe raft — poate ajunge la un cititor care o caută de luni de zile. Pe Swaply, poți schimba un lot de cărți de ficțiune pe un set de manuale universitare, sau colecția ta de DVD-uri pe viniluri clasice. Algoritmul nostru detectează automat titlul, autorul și ediția din fotografie, facilitând listarea rapidă. Categoria include și media fizică: CD-uri, Blu-ray-uri, viniluri și casete — tot ce are valoare pentru colecționari și entuziaști.",
    related: ["arts", "toys", "music"],
    icon: "book-open",
  },
  {
    slug: "home",
    name: "Home",
    nameRo: "Casă & Grădină",
    intro:
      "Mobilier, electrocasnice, decorațiuni, ustensile de bucătărie și tot ce ține de amenajarea casei. Reamenajezi un apartament? În loc să cumperi totul nou, schimbă ce nu mai folosești pe ce ai nevoie. O canapea în stare bună poate deveni un birou ergonomic. Un set de oale profesional poate deveni un aspirator vertical. Barter-ul de mobilier și obiecte casnice este extrem de popular în orașele mari din România, unde apartamentele se renovează constant. Pe Swaply, poți filtra după locație pentru a găsi schimburi locale și a evita costurile de transport pentru piese voluminoase.",
    related: ["garden", "tools", "electronics"],
    icon: "home",
  },
  {
    slug: "fashion",
    name: "Fashion",
    nameRo: "Modă & Accesorii",
    intro:
      "Haine, încălțăminte, genți, ceasuri, bijuterii și accesorii. Fast fashion-ul generează tone de deșeuri textile anual, iar barter-ul este antidotul perfect. Pe Swaply, poți schimba hainele de brand pe care nu le mai porți pe piese noi pentru garderobă, fără să cheltuiești un leu. Categoria include îmbrăcăminte pentru bărbați, femei și copii, încălțăminte de toate tipurile, genți și rucsacuri, ceasuri și bijuterii. Schimbul de haine vintage și de designer este deosebit de popular în rândul tinerilor din Cluj, București și Timișoara. Fiecare schimb de modă este un pas mic spre sustenabilitate.",
    related: ["sport", "arts", "home"],
    icon: "shirt",
  },
  {
    slug: "automotive",
    name: "Automotive",
    nameRo: "Auto & Moto",
    intro:
      "Piese auto, accesorii moto, anvelope, jante, echipament de întreținere și gadget-uri pentru mașină. Industria auto generează o cantitate enormă de piese reutilizabile care pot fi schimbate în loc să fie casate. Anvelope de iarnă pe care le-ai schimbat pe altele? Schimbă-le pe un set de anvelope de vară. O cameră auto pe care nu o mai folosești poate deveni un set de scule auto. Pe Swaply, categoria Auto & Moto conectează proprietari de mașini și motociclete care vor să facă schimb de piese și accesorii fără intermediari sau service-uri scumpe.",
    related: ["tools", "electronics", "sport"],
    icon: "car",
  },
  {
    slug: "music",
    name: "Music",
    nameRo: "Muzică & Audio",
    intro:
      "Instrumente muzicale, echipament audio, viniluri, pick-up-uri, amplificatoare și accesorii. Muzica este o pasiune care evoluează, iar instrumentele care nu mai sunt folosite merită să ajungă la cineva care le va da viață din nou. Pe Swaply, o chitară acustică pentru începători poate deveni un sintetizator MIDI. Un set de tobe acustice poate deveni un pick-up vintage. Comunitatea muzicală din România este activă și diversă, iar barter-ul de instrumente elimină bariera financiară care împiedică mulți tineri să învețe un instrument nou. Algoritmul AI recunoaște automat marca și modelul instrumentului din fotografie.",
    related: ["electronics", "arts", "books"],
    icon: "music",
  },
  {
    slug: "garden",
    name: "Garden",
    nameRo: "Grădinărit & Exterior",
    intro:
      "Unelte de grădinărit, plante, mobilier de exterior, grătare, decorațiuni de grădină și tot ce ține de spațiul exterior. Primăvara și vara aduc un val de interes pentru grădinărit, iar barter-ul face accesibilă echiparea unei grădini fără investiții mari. Pe Swaply, poți schimba un set de unelte de grădinărit pe butași de plante rare, sau un grătar vechi pe un set de mobilier de terasă. Comunitatea de grădinari amatori din România crește de la an la an, iar schimbul de plante și semințe este una dintre cele mai apreciate forme de barter de pe platformă — natural, ecologic și fără niciun cost.",
    related: ["home", "tools", "sport"],
    icon: "sprout",
  },
  {
    slug: "toys",
    name: "Toys",
    nameRo: "Jucării & Copii",
    intro:
      "Jucării, echipamente pentru copii, cărucioare, scaune auto, jocuri educative și tot ce ține de universul copiilor. Copiii cresc rapid, iar jucăriile și echipamentele lor au o durată de utilizare surprinzător de scurtă. Un cărucior folosit 8 luni poate deveni un scaun auto pentru următoarea etapă. Un set de Lego Duplo poate deveni un set Lego Technic. Barter-ul de jucării și echipamente pentru copii este una dintre cele mai active categorii pe Swaply, cu părinți care schimbă constant pe măsură ce micuții lor cresc. Este economie circulară în forma ei cea mai naturală — obiectele circulă de la o familie la alta.",
    related: ["books", "electronics", "fashion"],
    icon: "baby",
  },
  {
    slug: "tools",
    name: "Tools",
    nameRo: "Unelte & Bricolaj",
    intro:
      "Bormasini, seturi de chei, scări, echipament de sudură, unelte electrice și manuale pentru bricolaj. Multe unelte sunt cumpărate pentru un singur proiect și apoi uitate în garaj. Pe Swaply, acea bormaschină pe care ai folosit-o o dată poate deveni un fierăstrău circular de care ai nevoie acum. Un compresor de aer poate deveni un set de scule de precizie. Comunitatea de bricoleuri și meșteșugari din România folosește activ barter-ul pentru a-și extinde arsenalul de unelte fără investiții majore. Categoria include atât unelte electrice profesionale, cât și seturi de mână pentru hobbyiști.",
    related: ["home", "garden", "automotive"],
    icon: "hammer",
  },
  {
    slug: "other",
    name: "Other",
    nameRo: "Altele",
    intro:
      "Tot ce nu se încadrează într-o categorie specifică are loc aici. De la obiecte de colecție neobișnuite la echipament specializat, de la materiale de artizanat la piese vintage unice. Categoria Altele este spațiul pentru obiectele care sfidează clasificarea tradițională — și tocmai de aceea sunt adesea cele mai interesante schimburi de pe Swaply. Aici poți găsi un glob pământesc vintage, un costum de astronaut pentru petreceri, o mașină de scris funcțională sau un set complet de draperii de teatru. Surprizele sunt garantate, iar algoritmul AI se adaptează pentru a găsi potriviri chiar și pentru cele mai neobișnuite obiecte.",
    related: ["arts", "home", "toys"],
    icon: "package",
  },
];

export function getCategoryBySlug(slug: string): SEOCategory | undefined {
  return SEO_CATEGORIES.find((c) => c.slug === slug);
}

/* ─── Cities ─── */

export interface SEOCity {
  slug: string;
  name: string;
  county: string;
}

export const SEO_CITIES: SEOCity[] = [
  { slug: "bucuresti", name: "București", county: "București" },
  { slug: "cluj-napoca", name: "Cluj-Napoca", county: "Cluj" },
  { slug: "timisoara", name: "Timișoara", county: "Timiș" },
  { slug: "iasi", name: "Iași", county: "Iași" },
  { slug: "constanta", name: "Constanța", county: "Constanța" },
  { slug: "craiova", name: "Craiova", county: "Dolj" },
  { slug: "brasov", name: "Brașov", county: "Brașov" },
  { slug: "galati", name: "Galați", county: "Galați" },
  { slug: "ploiesti", name: "Ploiești", county: "Prahova" },
  { slug: "oradea", name: "Oradea", county: "Bihor" },
  { slug: "braila", name: "Brăila", county: "Brăila" },
  { slug: "arad", name: "Arad", county: "Arad" },
  { slug: "pitesti", name: "Pitești", county: "Argeș" },
  { slug: "sibiu", name: "Sibiu", county: "Sibiu" },
  { slug: "bacau", name: "Bacău", county: "Bacău" },
];

export function getCityBySlug(slug: string): SEOCity | undefined {
  return SEO_CITIES.find((c) => c.slug === slug);
}

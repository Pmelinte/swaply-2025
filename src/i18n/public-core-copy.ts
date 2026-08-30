import { locales, type Locale } from "./config";
import type { SwapStatus } from "@/lib/swaps/lifecycle";

type PublicCoreCopy = {
  preview: string;
  matchingDescription: string;
  messagesDescription: string;
  exchangeDescription: string;
  statuses: Record<SwapStatus, string>;
};

const status = (
  pending: string,
  accepted: string,
  inProgress: string,
  completed: string,
  rejected: string,
  cancelled: string,
  expired: string,
  disputed: string,
): Record<SwapStatus, string> => ({
  pending,
  accepted,
  in_progress: inProgress,
  completed,
  rejected,
  cancelled,
  expired,
  disputed,
});

export const publicCoreCopy = {
  en: {
    preview: "Preview",
    matchingDescription: "Compare what you offer with what others want and discover compatible swaps.",
    messagesDescription: "Keep each swap conversation, shared decisions and next steps in one place.",
    exchangeDescription: "Turn an agreed match into a clear handover with logistics, confirmation and feedback.",
    statuses: status("Pending", "Accepted", "In progress", "Completed", "Rejected", "Cancelled", "Expired", "Disputed"),
  },
  ro: {
    preview: "Previzualizare",
    matchingDescription: "Compară ceea ce oferi cu ceea ce caută ceilalți și descoperă schimburi compatibile.",
    messagesDescription: "Păstrează într-un singur loc fiecare conversație de schimb, deciziile comune și pașii următori.",
    exchangeDescription: "Transformă o potrivire acceptată într-o predare clară, cu logistică, confirmare și feedback.",
    statuses: status("În așteptare", "Acceptat", "În desfășurare", "Finalizat", "Respins", "Anulat", "Expirat", "În dispută"),
  },
  fr: {
    preview: "Aperçu",
    matchingDescription: "Comparez ce que vous proposez avec ce que recherchent les autres et découvrez des échanges compatibles.",
    messagesDescription: "Regroupez chaque conversation d’échange, les décisions partagées et les prochaines étapes au même endroit.",
    exchangeDescription: "Transformez une correspondance acceptée en remise claire avec logistique, confirmation et avis.",
    statuses: status("En attente", "Accepté", "En cours", "Terminé", "Refusé", "Annulé", "Expiré", "En litige"),
  },
  de: {
    preview: "Vorschau",
    matchingDescription: "Vergleiche dein Angebot mit den Wünschen anderer und entdecke passende Tauschmöglichkeiten.",
    messagesDescription: "Behalte jede Tauschunterhaltung, gemeinsame Entscheidungen und nächste Schritte an einem Ort.",
    exchangeDescription: "Mache aus einem vereinbarten Match eine klare Übergabe mit Logistik, Bestätigung und Feedback.",
    statuses: status("Ausstehend", "Akzeptiert", "In Bearbeitung", "Abgeschlossen", "Abgelehnt", "Storniert", "Abgelaufen", "Strittig"),
  },
  es: {
    preview: "Vista previa",
    matchingDescription: "Compara lo que ofreces con lo que buscan los demás y descubre intercambios compatibles.",
    messagesDescription: "Mantén cada conversación de intercambio, las decisiones compartidas y los próximos pasos en un solo lugar.",
    exchangeDescription: "Convierte una coincidencia aceptada en una entrega clara con logística, confirmación y valoración.",
    statuses: status("Pendiente", "Aceptado", "En curso", "Completado", "Rechazado", "Cancelado", "Expirado", "En disputa"),
  },
  it: {
    preview: "Anteprima",
    matchingDescription: "Confronta ciò che offri con ciò che cercano gli altri e scopri scambi compatibili.",
    messagesDescription: "Tieni in un unico posto ogni conversazione di scambio, le decisioni condivise e i prossimi passi.",
    exchangeDescription: "Trasforma un abbinamento accettato in una consegna chiara con logistica, conferma e feedback.",
    statuses: status("In attesa", "Accettato", "In corso", "Completato", "Rifiutato", "Annullato", "Scaduto", "In contestazione"),
  },
  pt: {
    preview: "Pré-visualização",
    matchingDescription: "Compare o que oferece com o que outras pessoas procuram e descubra trocas compatíveis.",
    messagesDescription: "Mantenha cada conversa de troca, decisões partilhadas e próximos passos num só lugar.",
    exchangeDescription: "Transforme uma correspondência aceite numa entrega clara com logística, confirmação e avaliação.",
    statuses: status("Pendente", "Aceite", "Em curso", "Concluído", "Rejeitado", "Cancelado", "Expirado", "Em disputa"),
  },
  nl: {
    preview: "Voorbeeld",
    matchingDescription: "Vergelijk wat je aanbiedt met wat anderen zoeken en ontdek passende ruilmogelijkheden.",
    messagesDescription: "Houd elk ruilgesprek, gezamenlijke beslissingen en volgende stappen op één plek.",
    exchangeDescription: "Maak van een geaccepteerde match een duidelijke overdracht met logistiek, bevestiging en feedback.",
    statuses: status("In afwachting", "Geaccepteerd", "Bezig", "Voltooid", "Afgewezen", "Geannuleerd", "Verlopen", "Betwist"),
  },
  pl: {
    preview: "Podgląd",
    matchingDescription: "Porównaj to, co oferujesz, z tym, czego szukają inni, i odkryj zgodne wymiany.",
    messagesDescription: "Przechowuj każdą rozmowę o wymianie, wspólne ustalenia i kolejne kroki w jednym miejscu.",
    exchangeDescription: "Zamień zaakceptowane dopasowanie w jasne przekazanie z logistyką, potwierdzeniem i opinią.",
    statuses: status("Oczekuje", "Zaakceptowano", "W toku", "Zakończono", "Odrzucono", "Anulowano", "Wygasło", "Spór"),
  },
  el: {
    preview: "Προεπισκόπηση",
    matchingDescription: "Συγκρίνετε όσα προσφέρετε με όσα αναζητούν οι άλλοι και βρείτε συμβατές ανταλλαγές.",
    messagesDescription: "Κρατήστε κάθε συζήτηση ανταλλαγής, τις κοινές αποφάσεις και τα επόμενα βήματα σε ένα σημείο.",
    exchangeDescription: "Μετατρέψτε μια αποδεκτή αντιστοίχιση σε σαφή παράδοση με οργάνωση, επιβεβαίωση και αξιολόγηση.",
    statuses: status("Σε αναμονή", "Αποδεκτό", "Σε εξέλιξη", "Ολοκληρώθηκε", "Απορρίφθηκε", "Ακυρώθηκε", "Έληξε", "Σε διαφορά"),
  },
  hu: {
    preview: "Előnézet",
    matchingDescription: "Hasonlítsd össze, amit kínálsz, azzal, amit mások keresnek, és találj összeillő cseréket.",
    messagesDescription: "Tarts minden cserebeszélgetést, közös döntést és következő lépést egy helyen.",
    exchangeDescription: "Az elfogadott párosításból legyen egyértelmű átadás logisztikával, megerősítéssel és visszajelzéssel.",
    statuses: status("Függőben", "Elfogadva", "Folyamatban", "Befejezve", "Elutasítva", "Törölve", "Lejárt", "Vitatott"),
  },
  bg: {
    preview: "Преглед",
    matchingDescription: "Сравнете това, което предлагате, с това, което търсят другите, и открийте съвместими размени.",
    messagesDescription: "Съхранявайте всеки разговор за размяна, общите решения и следващите стъпки на едно място.",
    exchangeDescription: "Превърнете прието съвпадение в ясна размяна с логистика, потвърждение и обратна връзка.",
    statuses: status("Изчаква", "Прието", "В процес", "Завършено", "Отхвърлено", "Отменено", "Изтекло", "Оспорено"),
  },
  cs: {
    preview: "Náhled",
    matchingDescription: "Porovnejte svou nabídku s tím, co hledají ostatní, a objevte kompatibilní výměny.",
    messagesDescription: "Mějte každou konverzaci o výměně, společná rozhodnutí a další kroky na jednom místě.",
    exchangeDescription: "Proměňte přijatou shodu v přehledné předání s logistikou, potvrzením a zpětnou vazbou.",
    statuses: status("Čeká", "Přijato", "Probíhá", "Dokončeno", "Odmítnuto", "Zrušeno", "Vypršelo", "Ve sporu"),
  },
  sk: {
    preview: "Náhľad",
    matchingDescription: "Porovnajte svoju ponuku s tým, čo hľadajú ostatní, a objavte kompatibilné výmeny.",
    messagesDescription: "Majte každú konverzáciu o výmene, spoločné rozhodnutia a ďalšie kroky na jednom mieste.",
    exchangeDescription: "Premeňte prijatú zhodu na jasné odovzdanie s logistikou, potvrdením a spätnou väzbou.",
    statuses: status("Čaká", "Prijaté", "Prebieha", "Dokončené", "Odmietnuté", "Zrušené", "Vypršalo", "V spore"),
  },
  hr: {
    preview: "Pregled",
    matchingDescription: "Usporedite ono što nudite s onim što drugi traže i pronađite kompatibilne zamjene.",
    messagesDescription: "Držite svaki razgovor o zamjeni, zajedničke odluke i sljedeće korake na jednom mjestu.",
    exchangeDescription: "Pretvorite prihvaćeno podudaranje u jasnu primopredaju uz logistiku, potvrdu i povratne informacije.",
    statuses: status("Na čekanju", "Prihvaćeno", "U tijeku", "Dovršeno", "Odbijeno", "Otkazano", "Isteklo", "U sporu"),
  },
  sl: {
    preview: "Predogled",
    matchingDescription: "Primerjajte svojo ponudbo s tem, kar iščejo drugi, in odkrijte združljive menjave.",
    messagesDescription: "Naj bodo vsak pogovor o menjavi, skupne odločitve in naslednji koraki na enem mestu.",
    exchangeDescription: "Sprejeto ujemanje spremenite v jasno predajo z logistiko, potrditvijo in povratnimi informacijami.",
    statuses: status("V čakanju", "Sprejeto", "V teku", "Dokončano", "Zavrnjeno", "Preklicano", "Poteklo", "V sporu"),
  },
  sr: {
    preview: "Преглед",
    matchingDescription: "Упоредите оно што нудите са оним што други траже и пронађите компатибилне размене.",
    messagesDescription: "Држите сваки разговор о размени, заједничке одлуке и следеће кораке на једном месту.",
    exchangeDescription: "Претворите прихваћено подударање у јасну примопредају са логистиком, потврдом и повратним информацијама.",
    statuses: status("На чекању", "Прихваћено", "У току", "Завршено", "Одбијено", "Отказано", "Истекло", "У спору"),
  },
  sv: {
    preview: "Förhandsvisning",
    matchingDescription: "Jämför det du erbjuder med det andra söker och hitta kompatibla byten.",
    messagesDescription: "Samla varje byteskonversation, gemensamma beslut och nästa steg på ett ställe.",
    exchangeDescription: "Gör en accepterad matchning till en tydlig överlämning med logistik, bekräftelse och feedback.",
    statuses: status("Väntande", "Accepterad", "Pågår", "Slutförd", "Avvisad", "Avbruten", "Utgången", "Tvist"),
  },
  da: {
    preview: "Forhåndsvisning",
    matchingDescription: "Sammenlign det, du tilbyder, med det andre søger, og find kompatible bytter.",
    messagesDescription: "Saml hver byttesamtale, fælles beslutninger og næste skridt ét sted.",
    exchangeDescription: "Gør et accepteret match til en tydelig overdragelse med logistik, bekræftelse og feedback.",
    statuses: status("Afventer", "Accepteret", "I gang", "Fuldført", "Afvist", "Annulleret", "Udløbet", "Omstridt"),
  },
  fi: {
    preview: "Esikatselu",
    matchingDescription: "Vertaa tarjoamaasi siihen, mitä muut etsivät, ja löydä yhteensopivia vaihtoja.",
    messagesDescription: "Pidä kaikki vaihtokeskustelut, yhteiset päätökset ja seuraavat vaiheet yhdessä paikassa.",
    exchangeDescription: "Muuta hyväksytty osuma selkeäksi luovutukseksi logistiikan, vahvistuksen ja palautteen avulla.",
    statuses: status("Odottaa", "Hyväksytty", "Käynnissä", "Valmis", "Hylätty", "Peruutettu", "Vanhentunut", "Kiistanalainen"),
  },
  no: {
    preview: "Forhåndsvisning",
    matchingDescription: "Sammenlign det du tilbyr med det andre leter etter, og finn kompatible bytter.",
    messagesDescription: "Samle hver byttesamtale, felles beslutninger og neste steg på ett sted.",
    exchangeDescription: "Gjør en akseptert match til en tydelig overlevering med logistikk, bekreftelse og tilbakemelding.",
    statuses: status("Venter", "Akseptert", "Pågår", "Fullført", "Avvist", "Kansellert", "Utløpt", "Omstridt"),
  },
  lt: {
    preview: "Peržiūra",
    matchingDescription: "Palyginkite tai, ką siūlote, su tuo, ko ieško kiti, ir raskite suderinamus mainus.",
    messagesDescription: "Laikykite visus mainų pokalbius, bendrus sprendimus ir kitus žingsnius vienoje vietoje.",
    exchangeDescription: "Paverskite priimtą atitikmenį aiškiu perdavimu su logistika, patvirtinimu ir atsiliepimu.",
    statuses: status("Laukiama", "Priimta", "Vykdoma", "Baigta", "Atmesta", "Atšaukta", "Pasibaigė", "Ginčijama"),
  },
  lv: {
    preview: "Priekšskatījums",
    matchingDescription: "Salīdziniet savu piedāvājumu ar to, ko meklē citi, un atrodiet saderīgas maiņas.",
    messagesDescription: "Glabājiet visas maiņas sarunas, kopīgos lēmumus un nākamos soļus vienuviet.",
    exchangeDescription: "Pārvērtiet apstiprinātu atbilstību skaidrā nodošanā ar loģistiku, apstiprinājumu un atsauksmi.",
    statuses: status("Gaida", "Pieņemts", "Procesā", "Pabeigts", "Noraidīts", "Atcelts", "Beidzies", "Apstrīdēts"),
  },
  et: {
    preview: "Eelvaade",
    matchingDescription: "Võrdle oma pakkumist sellega, mida teised otsivad, ja leia sobivad vahetused.",
    messagesDescription: "Hoia kõik vahetusvestlused, ühised otsused ja järgmised sammud ühes kohas.",
    exchangeDescription: "Muuda kinnitatud sobivus selgeks üleandmiseks koos logistika, kinnituse ja tagasisidega.",
    statuses: status("Ootel", "Vastu võetud", "Käimas", "Lõpetatud", "Tagasi lükatud", "Tühistatud", "Aegunud", "Vaidlustatud"),
  },
  ga: {
    preview: "Réamhamharc",
    matchingDescription: "Cuir an méid a thairgeann tú i gcomparáid leis an méid atá daoine eile ag lorg agus aimsigh malartuithe oiriúnacha.",
    messagesDescription: "Coinnigh gach comhrá malartaithe, cinneadh comhroinnte agus céim eile in aon áit amháin.",
    exchangeDescription: "Déan aistriú soiléir de mheaitseáil ghlactha le lóistíocht, deimhniú agus aiseolas.",
    statuses: status("Ar feitheamh", "Glactha", "Ar siúl", "Críochnaithe", "Diúltaithe", "Cealaithe", "Imithe in éag", "Faoi dhíospóid"),
  },
  mt: {
    preview: "Previżjoni",
    matchingDescription: "Qabbel dak li toffri ma’ dak li qed ifittxu oħrajn u sib skambji kompatibbli.",
    messagesDescription: "Żomm kull konverżazzjoni ta’ skambju, deċiżjoni maqsuma u pass li jmiss f’post wieħed.",
    exchangeDescription: "Ibdel tqabbil aċċettat fi trasferiment ċar b’loġistika, konferma u feedback.",
    statuses: status("Pendenti", "Aċċettat", "Għaddej", "Mitmum", "Miċħud", "Ikkanċellat", "Skada", "F’tilwima"),
  },
  ru: {
    preview: "Предпросмотр",
    matchingDescription: "Сравните то, что вы предлагаете, с тем, что ищут другие, и найдите подходящие обмены.",
    messagesDescription: "Храните все обсуждения обмена, совместные решения и следующие шаги в одном месте.",
    exchangeDescription: "Превратите согласованное совпадение в понятную передачу с логистикой, подтверждением и отзывом.",
    statuses: status("Ожидает", "Принято", "В процессе", "Завершено", "Отклонено", "Отменено", "Истекло", "Оспаривается"),
  },
  tr: {
    preview: "Önizleme",
    matchingDescription: "Sunduğunuz şeyi başkalarının aradıklarıyla karşılaştırın ve uyumlu takasları keşfedin.",
    messagesDescription: "Her takas konuşmasını, ortak kararları ve sonraki adımları tek yerde tutun.",
    exchangeDescription: "Kabul edilen bir eşleşmeyi lojistik, onay ve geri bildirimle net bir teslim sürecine dönüştürün.",
    statuses: status("Beklemede", "Kabul edildi", "Devam ediyor", "Tamamlandı", "Reddedildi", "İptal edildi", "Süresi doldu", "Uyuşmazlıkta"),
  },
  ar: {
    preview: "معاينة",
    matchingDescription: "قارن ما تعرضه بما يبحث عنه الآخرون واكتشف عمليات تبادل متوافقة.",
    messagesDescription: "احتفظ بكل محادثة تبادل والقرارات المشتركة والخطوات التالية في مكان واحد.",
    exchangeDescription: "حوّل التطابق المقبول إلى عملية تسليم واضحة تشمل الترتيبات والتأكيد والتقييم.",
    statuses: status("قيد الانتظار", "مقبول", "قيد التنفيذ", "مكتمل", "مرفوض", "ملغى", "منتهي الصلاحية", "محل نزاع"),
  },
  zh: {
    preview: "预览",
    matchingDescription: "将你提供的内容与他人的需求进行比较，发现合适的交换机会。",
    messagesDescription: "将每次交换对话、共同决定和后续步骤集中在一个地方。",
    exchangeDescription: "把已达成的匹配变成清晰的交接流程，包括物流、确认和反馈。",
    statuses: status("待处理", "已接受", "进行中", "已完成", "已拒绝", "已取消", "已过期", "争议中"),
  },
  hi: {
    preview: "पूर्वावलोकन",
    matchingDescription: "आप जो पेश कर रहे हैं उसकी तुलना दूसरों की ज़रूरतों से करें और उपयुक्त अदला-बदली खोजें।",
    messagesDescription: "हर अदला-बदली की बातचीत, साझा निर्णय और अगले कदम एक ही जगह रखें।",
    exchangeDescription: "स्वीकृत मिलान को लॉजिस्टिक्स, पुष्टि और प्रतिक्रिया के साथ स्पष्ट हस्तांतरण में बदलें।",
    statuses: status("लंबित", "स्वीकृत", "प्रगति में", "पूर्ण", "अस्वीकृत", "रद्द", "समाप्त", "विवादित"),
  },
  bn: {
    preview: "পূর্বরূপ",
    matchingDescription: "আপনি যা দিচ্ছেন তা অন্যরা যা খুঁজছেন তার সঙ্গে তুলনা করুন এবং মানানসই বিনিময় খুঁজে নিন।",
    messagesDescription: "প্রতিটি বিনিময় আলোচনা, যৌথ সিদ্ধান্ত এবং পরবর্তী পদক্ষেপ এক জায়গায় রাখুন।",
    exchangeDescription: "গৃহীত মিলকে লজিস্টিকস, নিশ্চিতকরণ এবং প্রতিক্রিয়াসহ পরিষ্কার হস্তান্তরে পরিণত করুন।",
    statuses: status("অপেক্ষমাণ", "গৃহীত", "চলমান", "সম্পন্ন", "প্রত্যাখ্যাত", "বাতিল", "মেয়াদোত্তীর্ণ", "বিরোধপূর্ণ"),
  },
  ja: {
    preview: "プレビュー",
    matchingDescription: "自分が提供するものと他の人が求めるものを比較し、相性の良い交換を見つけましょう。",
    messagesDescription: "交換に関する会話、共有した決定、次の手順を一か所で管理できます。",
    exchangeDescription: "合意したマッチを、物流、確認、フィードバックを含む明確な受け渡しに進めます。",
    statuses: status("保留中", "承認済み", "進行中", "完了", "拒否", "キャンセル", "期限切れ", "異議あり"),
  },
  ko: {
    preview: "미리보기",
    matchingDescription: "내가 제공하는 것과 다른 사람이 원하는 것을 비교해 잘 맞는 교환을 찾아보세요.",
    messagesDescription: "각 교환 대화와 공동 결정, 다음 단계를 한곳에서 관리하세요.",
    exchangeDescription: "합의된 매칭을 물류, 확인, 피드백이 포함된 명확한 인계 과정으로 이어가세요.",
    statuses: status("대기 중", "수락됨", "진행 중", "완료됨", "거절됨", "취소됨", "만료됨", "분쟁 중"),
  },
  vi: {
    preview: "Xem trước",
    matchingDescription: "So sánh thứ bạn cung cấp với nhu cầu của người khác và khám phá các trao đổi phù hợp.",
    messagesDescription: "Giữ mọi cuộc trò chuyện trao đổi, quyết định chung và bước tiếp theo ở cùng một nơi.",
    exchangeDescription: "Biến một kết quả ghép đã đồng ý thành quy trình bàn giao rõ ràng với hậu cần, xác nhận và phản hồi.",
    statuses: status("Đang chờ", "Đã chấp nhận", "Đang thực hiện", "Hoàn tất", "Bị từ chối", "Đã hủy", "Hết hạn", "Đang tranh chấp"),
  },
  th: {
    preview: "ตัวอย่าง",
    matchingDescription: "เปรียบเทียบสิ่งที่คุณเสนอเข้ากับสิ่งที่ผู้อื่นกำลังมองหา และค้นหาการแลกเปลี่ยนที่เข้ากันได้",
    messagesDescription: "เก็บทุกการสนทนาเกี่ยวกับการแลกเปลี่ยน การตัดสินใจร่วมกัน และขั้นตอนถัดไปไว้ในที่เดียว",
    exchangeDescription: "เปลี่ยนการจับคู่ที่ตกลงแล้วให้เป็นการส่งมอบที่ชัดเจน พร้อมการจัดการ การยืนยัน และความคิดเห็น",
    statuses: status("รอดำเนินการ", "ยอมรับแล้ว", "กำลังดำเนินการ", "เสร็จสิ้น", "ถูกปฏิเสธ", "ยกเลิกแล้ว", "หมดอายุ", "มีข้อพิพาท"),
  },
  id: {
    preview: "Pratinjau",
    matchingDescription: "Bandingkan apa yang Anda tawarkan dengan apa yang dicari orang lain dan temukan pertukaran yang cocok.",
    messagesDescription: "Simpan setiap percakapan pertukaran, keputusan bersama, dan langkah berikutnya di satu tempat.",
    exchangeDescription: "Ubah kecocokan yang disepakati menjadi serah terima yang jelas dengan logistik, konfirmasi, dan umpan balik.",
    statuses: status("Menunggu", "Diterima", "Berlangsung", "Selesai", "Ditolak", "Dibatalkan", "Kedaluwarsa", "Dalam sengketa"),
  },
  ms: {
    preview: "Pratonton",
    matchingDescription: "Bandingkan apa yang anda tawarkan dengan apa yang dicari orang lain dan temui pertukaran yang serasi.",
    messagesDescription: "Simpan setiap perbualan pertukaran, keputusan bersama dan langkah seterusnya di satu tempat.",
    exchangeDescription: "Tukar padanan yang dipersetujui menjadi penyerahan yang jelas dengan logistik, pengesahan dan maklum balas.",
    statuses: status("Menunggu", "Diterima", "Sedang berjalan", "Selesai", "Ditolak", "Dibatalkan", "Tamat tempoh", "Dalam pertikaian"),
  },
  fil: {
    preview: "Preview",
    matchingDescription: "Ihambing ang inaalok mo sa hinahanap ng iba at tumuklas ng mga tugmang palitan.",
    messagesDescription: "Panatilihin sa isang lugar ang bawat usapan sa palitan, magkakasamang desisyon, at susunod na hakbang.",
    exchangeDescription: "Gawing malinaw na pagpapalitan ang napagkasunduang match gamit ang logistics, kumpirmasyon, at feedback.",
    statuses: status("Naghihintay", "Tinanggap", "Isinasagawa", "Tapos na", "Tinanggihan", "Kinansela", "Nag-expire", "May pagtatalo"),
  },
  fa: {
    preview: "پیش‌نمایش",
    matchingDescription: "آنچه ارائه می‌دهید را با نیاز دیگران مقایسه کنید و مبادله‌های سازگار را پیدا کنید.",
    messagesDescription: "هر گفت‌وگوی مبادله، تصمیم‌های مشترک و گام‌های بعدی را در یک مکان نگه دارید.",
    exchangeDescription: "یک تطبیق پذیرفته‌شده را با هماهنگی، تأیید و بازخورد به تحویلی روشن تبدیل کنید.",
    statuses: status("در انتظار", "پذیرفته‌شده", "در حال انجام", "تکمیل‌شده", "ردشده", "لغوشده", "منقضی‌شده", "مورد اختلاف"),
  },
  mn: {
    preview: "Урьдчилан харах",
    matchingDescription: "Өөрийн санал болгож буй зүйлийг бусдын хайж буй зүйлтэй харьцуулж, тохирох солилцоог олоорой.",
    messagesDescription: "Солилцооны бүх яриа, хамтын шийдвэр болон дараагийн алхмуудыг нэг дор хадгалаарай.",
    exchangeDescription: "Зөвшөөрсөн тохирлыг логистик, баталгаажуулалт, санал хүсэлттэй тодорхой хүлээлгэн өгөх үйл явц болгоорой.",
    statuses: status("Хүлээгдэж байна", "Зөвшөөрсөн", "Явагдаж байна", "Дууссан", "Татгалзсан", "Цуцалсан", "Хугацаа дууссан", "Маргаантай"),
  },
  uk: {
    preview: "Попередній перегляд",
    matchingDescription: "Порівняйте те, що пропонуєте, з тим, що шукають інші, і знайдіть сумісні обміни.",
    messagesDescription: "Зберігайте всі розмови про обмін, спільні рішення та наступні кроки в одному місці.",
    exchangeDescription: "Перетворіть погоджений збіг на зрозумілу передачу з логістикою, підтвердженням і відгуком.",
    statuses: status("Очікує", "Прийнято", "У процесі", "Завершено", "Відхилено", "Скасовано", "Термін минув", "Оскаржується"),
  },
  yi: {
    preview: "פֿאָרויסקוק",
    matchingDescription: "פֿאַרגלײַכט וואָס איר אָפֿערט מיט וואָס אַנדערע זוכן און געפֿינט פּאַסיקע אויסטוישן.",
    messagesDescription: "האַלט אַלע אויסטויש־שמועסן,共同ע באַשלוסן און קומענדיקע שריט אויף איין אָרט.",
    exchangeDescription: "מאַכט פֿון אַ מסכּים־געוואָרענעם פּאַס אַ קלאָרע איבערגעבן מיט לאָגיסטיק, באַשטעטיקונג און באַמערקונגען.",
    statuses: status("וואַרטנדיק", "אָנגענומען", "אין גאַנג", "פֿאַרענדיקט", "אָפּגעזאָגט", "קאַנסאַלירט", "אויסגעגאַנגען", "אין מחלוקת"),
  },
} as const satisfies Record<Locale, PublicCoreCopy>;

export function getPublicCoreCopy(locale: string): PublicCoreCopy {
  const normalized = locale.toLowerCase().split("-")[0] as Locale;
  return locales.includes(normalized) ? publicCoreCopy[normalized] : publicCoreCopy.en;
}

export function getLocalizedSwapStatus(locale: string, value: string): string {
  const copy = getPublicCoreCopy(locale);
  return value in copy.statuses
    ? copy.statuses[value as SwapStatus]
    : value.replaceAll("_", " ");
}

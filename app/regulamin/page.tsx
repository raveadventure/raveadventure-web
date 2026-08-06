import styles from '../polityka-prywatnosci/privacy.module.css'

export const metadata = {
  title: 'Regulamin — RaveAdventure',
  description: 'Regulamin serwisu RaveAdventure.pl',
}

export default function Regulamin() {
  return (
    <div className={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <nav className={styles.nav}>
        <a href="/" className={styles.logo}>Rave<span>Adventure</span></a>
      </nav>

      <div className={styles.content}>
        <p className={styles.eyebrow}>// dokumenty</p>
        <h1 className={styles.title}>Regulamin</h1>
        <p className={styles.updated}>Ostatnia aktualizacja: sierpień 2026</p>

        <div className={styles.body}>

          <h2>1. Postanowienia ogólne</h2>
          <p>Niniejszy regulamin określa zasady korzystania z serwisu RaveAdventure dostępnego pod adresem <strong>raveadventure.pl</strong>, prowadzonego przez Michała Kocha (adres do korespondencji: Wiewiec 96, 98-337 Strzelce Wielkie; kontakt: <a href="mailto:kontakt@raveadventure.pl">kontakt@raveadventure.pl</a>).</p>
          <p>Składając zamówienie, akceptujesz niniejszy regulamin w całości.</p>

          <h2>2. Przedmiot usługi</h2>
          <p>RaveAdventure świadczy usługę wykonania personalizowanych kart kolekcjonerskich w formacie karty kredytowej (PVC) lub karty laminowanej, na podstawie materiałów dostarczonych przez Klienta.</p>

          <h2>3. Składanie zamówień</h2>
          <p>Zamówienie składa się poprzez formularz dostępny na stronie raveadventure.pl. Klient zobowiązany jest do:</p>
          <ul>
            <li>Podania prawdziwych danych kontaktowych i adresu dostawy</li>
            <li>Dostarczenia zdjęć i materiałów graficznych do których posiada prawa</li>
            <li>Opisania oczekiwań dotyczących projektu</li>
          </ul>
          <p>Po złożeniu zamówienia Klient otrzymuje potwierdzenie na podany adres e-mail.</p>

          <h2>4. Realizacja zamówienia</h2>
          <p>Proces realizacji zamówienia składa się z następujących etapów:</p>
          <ul>
            <li><strong>Projekt:</strong> W ciągu 24–48 godzin roboczych od złożenia zamówienia przygotowujemy projekt graficzny karty i przesyłamy go do akceptacji na adres e-mail Klienta.</li>
            <li><strong>Akceptacja:</strong> Klient zatwierdza projekt lub zgłasza uwagi wraz z opisem oczekiwanych zmian. Poprawki projektu są bezpłatne i wprowadzane do momentu zaakceptowania karty przez Klienta.</li>
            <li><strong>Produkcja i wysyłka:</strong> Po akceptacji projektu karta jest drukowana i wysyłana w ciągu 3–5 dni roboczych.</li>
          </ul>

          <h2>5. Ceny i płatności</h2>
          <p>Aktualne ceny dostępne są na stronie raveadventure.pl. Płatność następuje dopiero po zaakceptowaniu projektu karty przez Klienta — zamówienie jest przekazywane do druku po zaksięgowaniu płatności.</p>
          <p>Płatność można zrealizować:</p>
          <ul>
            <li>przelewem bankowym lub przez BLIK na podstawie danych przekazanych indywidualnie w mailu z projektem karty, lub</li>
            <li>automatycznie przez system płatności online (BLIK, Przelewy Online) obsługiwany przez <strong>Paybylink</strong> — usługę świadczoną przez Systemy Płatnicze Robert Paszkowski, ul. Jana Pawła II 22, 00-133 Warszawa, NIP 1182105129, REGON 360726494, wpisaną do rejestru małych instytucji płatniczych prowadzonego przez Komisję Nadzoru Finansowego pod numerem MIP31/2019.</li>
          </ul>
          <p>Reklamacje dotyczące samej płatności (np. nieudanej transakcji, błędnego obciążenia) rozpatruje dostawca usług płatniczych — kontakt: <a href="mailto:platnosci@rpdp.pl">platnosci@rpdp.pl</a>. Reklamacje dotyczące zamówionej karty należy kierować do RaveAdventure zgodnie z pkt 8.</p>

          <h2>6. Dostawa</h2>
          <p>Karty wysyłamy na terenie Polski, na adres wskazany przez Klienta lub do wybranego paczkomatu InPost. Koszt dostawy wynosi stałe 15 zł i jest doliczany do każdego zamówienia. Czas dostawy zależy od wybranego sposobu wysyłki i wynosi zazwyczaj 1–3 dni robocze od momentu nadania przesyłki.</p>

          <h2>7. Prawo odstąpienia od umowy</h2>
          <p>Zgodnie z art. 38 pkt 3 ustawy z dnia 30 maja 2014 r. o prawach konsumenta, prawo odstąpienia od umowy zawartej na odległość nie przysługuje w odniesieniu do umów, w których przedmiotem świadczenia jest rzecz nieprefabrykowana, wyprodukowana według specyfikacji konsumenta lub służąca zaspokojeniu jego zindywidualizowanych potrzeb. Każda karta RaveAdventure jest projektowana indywidualnie na podstawie zdjęcia i opisu dostarczonego przez Klienta, w związku z czym standardowe 14-dniowe prawo odstąpienia od umowy nie ma zastosowania.</p>
          <p>Nie ogranicza to prawa Klienta do reklamacji karty niezgodnej z zatwierdzonym projektem lub uszkodzonej w transporcie — patrz pkt 8.</p>

          <h2>8. Reklamacje</h2>
          <p>Jeśli otrzymana karta jest niezgodna z zatwierdzonym projektem lub uszkodzona w transporcie, Klient ma prawo do reklamacji w ciągu 7 dni od otrzymania przesyłki. Reklamacje należy zgłaszać na adres <a href="mailto:kontakt@raveadventure.pl">kontakt@raveadventure.pl</a> wraz ze zdjęciem wadliwego produktu. Uznana reklamacja skutkuje bezpłatnym wykonaniem nowej karty.</p>
          <p>Reklamacje dotyczące samej płatności (np. nieudanej transakcji przez Paybylink) należy kierować bezpośrednio do dostawcy usług płatniczych — patrz pkt 5.</p>

          <h2>9. Prawa autorskie i wizerunek</h2>
          <p>Składając zamówienie, Klient oświadcza, że:</p>
          <ul>
            <li>Posiada prawa do wszystkich dostarczonych materiałów graficznych i zdjęć</li>
            <li>Dysponuje zgodą osób widocznych na zdjęciach na wykorzystanie ich wizerunku</li>
            <li>Dostarczone materiały nie naruszają praw osób trzecich</li>
          </ul>
          <p>RaveAdventure zastrzega sobie prawo do odmowy realizacji zamówienia jeśli dostarczone materiały naruszają prawa osób trzecich lub są niezgodne z prawem.</p>

          <h2>10. Portfolio i materiały promocyjne</h2>
          <p>RaveAdventure zastrzega sobie prawo do wykorzystania wykonanych projektów (po anonimizacji lub za zgodą Klienta) w celach promocyjnych — na stronie internetowej i w mediach społecznościowych. Jeśli nie wyrażasz zgody na prezentację swojej karty w portfolio, poinformuj nas o tym przy składaniu zamówienia.</p>

          <h2>11. Odpowiedzialność</h2>
          <p>RaveAdventure nie ponosi odpowiedzialności za błędy w dostarczonych przez Klienta materiałach graficznych zaakceptowanych przez Klienta w projekcie. Klient ponosi pełną odpowiedzialność za treści zamieszczane na kartach.</p>

          <h2>12. Postanowienia końcowe</h2>
          <p>W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy polskiego Kodeksu Cywilnego. Wszelkie spory rozstrzygane będą przez sąd właściwy dla miejsca zamieszkania Usługodawcy. Regulamin może być zmieniany — aktualna wersja zawsze dostępna jest na stronie raveadventure.pl/regulamin.</p>

        </div>

        <div className={styles.links}>
          <a href="/polityka-prywatnosci" className={styles.link}>Polityka prywatności →</a>
          <a href="/" className={styles.link}>Powrót do strony głównej →</a>
        </div>
      </div>
    </div>
  )
}

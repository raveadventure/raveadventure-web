import styles from './privacy.module.css'

export const metadata = {
  title: 'Polityka Prywatności — RaveAdventure',
  description: 'Polityka prywatności serwisu RaveAdventure.pl',
}

export default function PolitykaPrywatnosci() {
  return (
    <div className={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <nav className={styles.nav}>
        <a href="/" className={styles.logo}>Rave<span>Adventure</span></a>
      </nav>

      <div className={styles.content}>
        <p className={styles.eyebrow}>// dokumenty</p>
        <h1 className={styles.title}>Polityka Prywatności</h1>
        <p className={styles.updated}>Ostatnia aktualizacja: czerwiec 2025</p>

        <div className={styles.body}>

          <h2>1. Administrator danych</h2>
          <p>Administratorem Twoich danych osobowych jest Michał Koch, prowadzący serwis RaveAdventure dostępny pod adresem <strong>raveadventure.pl</strong>. Kontakt: <a href="mailto:kontakt@raveadventure.pl">kontakt@raveadventure.pl</a></p>

          <h2>2. Jakie dane zbieramy</h2>
          <p>Podczas składania zamówienia zbieramy następujące dane:</p>
          <ul>
            <li>Imię i nazwisko</li>
            <li>Adres e-mail</li>
            <li>Numer telefonu (opcjonalnie)</li>
            <li>Adres do wysyłki</li>
            <li>Zdjęcia przesłane przez Ciebie w celu wykonania zamówienia</li>
            <li>Treść wiadomości i uwagi do zamówienia</li>
          </ul>

          <h2>3. W jakim celu przetwarzamy dane</h2>
          <p>Twoje dane przetwarzamy wyłącznie w celu:</p>
          <ul>
            <li>Realizacji zamówienia na personalizowaną kartę</li>
            <li>Komunikacji w sprawie zamówienia (e-mail, SMS)</li>
            <li>Wysyłki gotowej karty na podany adres</li>
            <li>Rozpatrywania reklamacji i zwrotów</li>
          </ul>

          <h2>4. Podstawa prawna</h2>
          <p>Przetwarzamy Twoje dane na podstawie art. 6 ust. 1 lit. b) RODO — przetwarzanie jest niezbędne do wykonania umowy (realizacji zamówienia), której jesteś stroną.</p>

          <h2>5. Jak długo przechowujemy dane</h2>
          <p>Dane przechowujemy przez czas niezbędny do realizacji zamówienia oraz przez okres wymagany przepisami prawa (do 5 lat dla celów rozliczeń). Zdjęcia przesłane do realizacji zamówienia są przechowywane w serwisie Supabase i mogą być usunięte na Twoje żądanie.</p>

          <h2>6. Komu przekazujemy dane</h2>
          <p>Twoje dane mogą być przekazywane wyłącznie podmiotom niezbędnym do realizacji zamówienia:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> — przechowywanie danych i zdjęć (serwery w Europie, Frankfurt)</li>
            <li><strong>Resend Inc.</strong> — wysyłka wiadomości e-mail z potwierdzeniem zamówienia</li>
            <li><strong>Operatorzy pocztowi / kurierzy</strong> — dostarczenie zamówionej karty</li>
          </ul>
          <p>Nie sprzedajemy Twoich danych osobowych żadnym podmiotom trzecim.</p>

          <h2>7. Twoje prawa</h2>
          <p>Masz prawo do:</p>
          <ul>
            <li>Dostępu do swoich danych</li>
            <li>Sprostowania nieprawidłowych danych</li>
            <li>Usunięcia danych (prawo do bycia zapomnianym)</li>
            <li>Ograniczenia przetwarzania</li>
            <li>Przenoszenia danych</li>
            <li>Wniesienia sprzeciwu wobec przetwarzania</li>
          </ul>
          <p>Aby skorzystać z tych praw, skontaktuj się z nami: <a href="mailto:kontakt@raveadventure.pl">kontakt@raveadventure.pl</a></p>
          <p>Masz również prawo złożenia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa.</p>

          <h2>8. Pliki cookies</h2>
          <p>Serwis RaveAdventure.pl nie używa plików cookies do celów marketingowych ani śledzenia. Używamy wyłącznie technicznego cookie sesji dla panelu administracyjnego.</p>

          <h2>9. Bezpieczeństwo danych</h2>
          <p>Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych osobowych przed nieautoryzowanym dostępem, utratą lub zniszczeniem. Połączenie z serwisem jest szyfrowane (HTTPS/SSL).</p>

          <h2>10. Zmiany polityki prywatności</h2>
          <p>Zastrzegamy sobie prawo do zmiany niniejszej polityki prywatności. O wszelkich zmianach poinformujemy poprzez aktualizację daty na początku dokumentu.</p>

        </div>

        <div className={styles.links}>
          <a href="/regulamin" className={styles.link}>Regulamin serwisu →</a>
          <a href="/" className={styles.link}>Powrót do strony głównej →</a>
        </div>
      </div>
    </div>
  )
}

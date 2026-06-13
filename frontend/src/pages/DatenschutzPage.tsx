import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Scissors } from 'lucide-react'

export default function DatenschutzPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/start')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gray-700" />
            <span className="font-bold text-gray-900">SALON</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-gray-400 mb-10">Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>

        <div className="space-y-10 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO ist:<br /><br />
              [Vorname Nachname / Firmenname]<br />
              [Straße Hausnummer]<br />
              [PLZ Ort]<br />
              E-Mail: [kontakt@beispiel.de]
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p>
              Beim Besuch unserer Website werden automatisch Informationen in sogenannten Server-Log-Dateien
              gespeichert, die Ihr Browser automatisch übermittelt. Dies sind:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Browsertyp und Browserversion</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p className="mt-3">
              Diese Daten sind nicht bestimmten Personen zuordenbar. Eine Zusammenführung dieser Daten mit
              anderen Datenquellen wird nicht vorgenommen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Registrierung und Nutzerkonto</h2>
            <p>
              Zur Nutzung von SALON ist eine Registrierung erforderlich. Dabei erheben wir folgende Daten:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Name</li>
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert via bcrypt)</li>
            </ul>
            <p className="mt-3">
              Diese Daten werden ausschließlich zur Bereitstellung des Dienstes verwendet. Rechtsgrundlage ist
              Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Salon- und Betriebsdaten</h2>
            <p>
              Im Rahmen der Nutzung erfassen und verarbeiten wir Betriebsdaten, die Sie selbst eingeben,
              insbesondere Mitarbeiterdaten (Namen, Gehälter, Arbeitszeiten), Kostenpositionen und
              Dienstleistungen. Diese Daten werden ausschließlich zur Erbringung des vertraglich vereinbarten
              Dienstes verarbeitet und nicht an Dritte weitergegeben.
            </p>
            <p className="mt-2">
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Datenspeicherung und Löschung</h2>
            <p>
              Personenbezogene Daten werden gelöscht, sobald der Zweck der Speicherung entfällt und keine
              gesetzlichen Aufbewahrungspflichten entgegenstehen. Sie können Ihr Konto jederzeit löschen lassen,
              indem Sie uns eine E-Mail an [kontakt@beispiel.de] senden. Alle zugehörigen Daten werden dann
              unverzüglich entfernt.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Datensicherheit</h2>
            <p>
              Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen
              Manipulation, Verlust, Zerstörung oder gegen den Zugriff unberechtigter Personen zu schützen.
              Unsere Sicherheitsmaßnahmen werden entsprechend der technologischen Entwicklung fortlaufend
              verbessert. Passwörter werden ausschließlich verschlüsselt (bcrypt) gespeichert.
              Die Kommunikation zwischen Ihrem Browser und unseren Servern erfolgt verschlüsselt über HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              SALON verwendet keine Tracking-Cookies und keine Cookies von Drittanbietern. Für die
              Authentifizierung wird ein JSON Web Token (JWT) im <code className="bg-gray-100 px-1 rounded">localStorage</code> des
              Browsers gespeichert. Dieser enthält ausschließlich technisch notwendige Informationen zur
              Sitzungsverwaltung.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Weitergabe von Daten an Dritte</h2>
            <p>
              Eine Weitergabe Ihrer personenbezogenen Daten an Dritte findet nicht statt, es sei denn, wir sind
              gesetzlich dazu verpflichtet oder Sie haben ausdrücklich eingewilligt.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Ihre Rechte</h2>
            <p>Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: [kontakt@beispiel.de]
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Beschwerderecht bei der Aufsichtsbehörde</h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
              personenbezogenen Daten durch uns zu beschweren. Die zuständige Aufsichtsbehörde richtet sich
              nach Ihrem Wohnort bzw. dem Sitz unseres Unternehmens.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen
              rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen.
              Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-3xl mx-auto text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} SALON
        </div>
      </footer>
    </div>
  )
}

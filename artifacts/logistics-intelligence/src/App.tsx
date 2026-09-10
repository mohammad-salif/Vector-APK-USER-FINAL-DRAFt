import { FieldPortalPage } from '@/pages/FieldPortalPage';
import { I18nProvider } from '@/services/i18n';

/**
 * VECTOR - Gov Logistics & Ops Driver Field Application (APK)
 *
 * Official VECTOR branding for authorized Driver operations.
 */
function App() {
  return (
    <I18nProvider>
      <FieldPortalPage />
    </I18nProvider>
  );
}

export default App;

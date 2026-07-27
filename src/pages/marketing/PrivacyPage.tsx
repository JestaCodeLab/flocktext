import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '@/pages/marketing/data/contact';
import { Seo } from '@/pages/marketing/components/Seo';
import { LegalLayout, LegalSection } from '@/pages/marketing/components/LegalLayout';
import { routeSeo } from '@/pages/marketing/data/seo';

const EFFECTIVE_DATE = 'July 27, 2026';

export function PrivacyPage() {
  return (
    <>
      <Seo {...routeSeo['/privacy']} />

      <LegalLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
        <LegalSection title="1. Introduction">
          <p>
            This Privacy Policy explains how FlockText ("FlockText", "we", "us", or "our") collects, uses, shares,
            and protects information in connection with our website, dashboard, mobile apps, and API (together, the
            "Service"). It applies both to you as a FlockText account holder and, as explained in Section 3, to the
            contacts you manage through the Service.
          </p>
        </LegalSection>

        <LegalSection title="2. Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-foreground">Account information</span> — name, email address, phone
              number, organization details, and password (stored in hashed form) when you register.
            </li>
            <li>
              <span className="font-medium text-foreground">Contact data you upload</span> — phone numbers, names,
              birthdays, group membership, and any other details you add to your contact lists.
            </li>
            <li>
              <span className="font-medium text-foreground">Message content</span> — the text of messages you
              compose and send, and delivery status reported back by carriers.
            </li>
            <li>
              <span className="font-medium text-foreground">Payment information</span> — processed by our
              third-party payment providers; we retain transaction records but not full card or mobile-money
              credentials.
            </li>
            <li>
              <span className="font-medium text-foreground">Usage & device data</span> — log data, IP address,
              browser type, and actions taken within the dashboard, collected automatically as you use the Service.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Your Role and Ours for Contact Data">
          <p>
            When you upload contact lists to send messages to your customers, congregation, or community, you act
            as the data controller for that information, and FlockText acts as a data processor, handling it only
            to provide the Service on your instructions (storage, sending, and reporting). You are responsible for
            ensuring you have a lawful basis, and any consent required by law, to collect and share that data with
            us and to message those individuals.
          </p>
        </LegalSection>

        <LegalSection title="4. How We Use Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Provide, operate, and maintain the Service, including sending your messages through SMS carriers;</li>
            <li>Process payments and maintain your SMS credit balance;</li>
            <li>Communicate with you about your account, updates, and support requests;</li>
            <li>Monitor for fraud, abuse, and violations of our Terms & Conditions;</li>
            <li>Improve and troubleshoot the Service; and</li>
            <li>Comply with legal obligations, including those imposed by telecom regulators.</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. How We Share Information">
          <p>We share information only as needed to operate the Service, including with:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Mobile network operators and SMS aggregators, to deliver your messages to recipients;</li>
            <li>Payment processors, to handle credit purchases;</li>
            <li>Infrastructure and hosting providers who store and process data on our behalf under contract;</li>
            <li>Regulators or law enforcement, where required by law or to protect the rights and safety of others; and</li>
            <li>A successor entity, in the event of a merger, acquisition, or sale of assets.</li>
          </ul>
          <p>We do not sell your personal information or your contacts' personal information to third parties.</p>
        </LegalSection>

        <LegalSection title="6. Data Retention">
          <p>
            We retain account and contact data for as long as your account is active, and for a reasonable period
            afterward to comply with legal, accounting, or reporting obligations, resolve disputes, and enforce our
            agreements. You may request deletion of your account and associated contact data at any time, subject
            to Section 7.
          </p>
        </LegalSection>

        <LegalSection title="7. Data Security">
          <p>
            We use technical and organizational safeguards — including encryption in transit, access controls, and
            hashed password storage — designed to protect information against unauthorized access, alteration, or
            loss. No method of transmission or storage is completely secure, and we cannot guarantee absolute
            security.
          </p>
        </LegalSection>

        <LegalSection title="8. Your Rights & Choices">
          <p>
            Depending on your location, you may have rights to access, correct, export, or delete your personal
            information, and to object to or restrict certain processing. You can update most account information
            directly in your dashboard, or contact us at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{' '}
            to exercise these rights. If you are a recipient who wants a message sender to stop contacting you,
            please contact that organization directly, or reply STOP where supported.
          </p>
        </LegalSection>

        <LegalSection title="9. Cookies & Tracking">
          <p>
            Our website and dashboard use cookies and similar technologies to keep you signed in, remember your
            preferences, and understand how the Service is used. You can control cookies through your browser
            settings, though disabling them may affect some functionality.
          </p>
        </LegalSection>

        <LegalSection title="10. Children's Privacy">
          <p>
            The Service is intended for business, organizational, and institutional use and is not directed at
            children. We do not knowingly collect personal information directly from children under 18 through
            account registration.
          </p>
        </LegalSection>

        <LegalSection title="11. International Data Transfers">
          <p>
            We may store and process information in countries other than your own, including where our hosting and
            infrastructure providers operate. Where this involves a transfer of personal data across borders, we
            take steps to ensure it receives an adequate level of protection consistent with this Policy.
          </p>
        </LegalSection>

        <LegalSection title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by
            email or through the Service before the changes take effect. The "Effective" date at the top of this
            page reflects the most recent update.
          </p>
        </LegalSection>

        <LegalSection title="13. Contact Us">
          <p>
            Questions about this Privacy Policy or how we handle your data can be sent to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            . See also our{' '}
            <Link to="/terms" className="text-foreground underline underline-offset-2">
              Terms & Conditions
            </Link>
            .
          </p>
        </LegalSection>
      </LegalLayout>
    </>
  );
}

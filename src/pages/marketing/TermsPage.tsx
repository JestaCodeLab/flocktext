import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL, CONTACT_PHONE_DISPLAY } from '@/pages/marketing/data/contact';
import { Seo } from '@/pages/marketing/components/Seo';
import { LegalLayout, LegalSection } from '@/pages/marketing/components/LegalLayout';
import { routeSeo } from '@/pages/marketing/data/seo';

const EFFECTIVE_DATE = 'July 27, 2026';

export function TermsPage() {
  return (
    <>
      <Seo {...routeSeo['/terms']} />

      <LegalLayout title="Terms & Conditions" effectiveDate={EFFECTIVE_DATE}>
        <LegalSection title="1. Acceptance of these Terms">
          <p>
            These Terms & Conditions ("Terms") govern your access to and use of FlockText, including our website,
            dashboard, mobile apps, and API (together, the "Service"), operated by FlockText ("FlockText", "we",
            "us", or "our"). By creating an account or otherwise using the Service, you agree to be bound by these
            Terms. If you are using the Service on behalf of an organization, you confirm you have authority to
            bind that organization, and "you" refers to that organization as well as you individually.
          </p>
        </LegalSection>

        <LegalSection title="2. The Service">
          <p>
            FlockText lets organizations send bulk SMS messages to contacts they manage — including group
            messaging, scheduled and recurring sends, birthday automation, sender ID registration, and delivery
            reporting. Messages are transmitted through third-party mobile network operators and SMS aggregators
            that we do not control, so delivery times, formatting, and success rates can vary and are not
            guaranteed.
          </p>
        </LegalSection>

        <LegalSection title="3. Eligibility & Account Registration">
          <p>
            You must be at least 18 years old and able to form a binding contract to use the Service. You agree to
            provide accurate, current information when creating your account and to keep it up to date. You are
            responsible for safeguarding your login credentials and API keys, and for all activity that occurs
            under your account. Notify us immediately at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{' '}
            if you suspect unauthorized use of your account.
          </p>
        </LegalSection>

        <LegalSection title="4. Acceptable Use">
          <p>You agree not to use the Service to send, and to ensure your contacts have consented to receive, messages that:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Are unsolicited, unwanted, or sent without the recipient's consent (spam);</li>
            <li>Are fraudulent, deceptive, defamatory, obscene, or harassing;</li>
            <li>Promote illegal goods or services, or violate any applicable law or regulation;</li>
            <li>Infringe the intellectual property, privacy, or other rights of any third party;</li>
            <li>Contain malware, phishing links, or attempt to harvest personal data; or</li>
            <li>Violate the acceptable-use policies of the mobile network operators or SMS carriers we rely on.</li>
          </ul>
          <p>
            We may suspend or terminate accounts that we reasonably believe violate this policy, and may report
            unlawful activity to the relevant authorities or telecom regulators.
          </p>
        </LegalSection>

        <LegalSection title="5. Your Contacts & Data You Upload">
          <p>
            You are solely responsible for the contact lists, phone numbers, birthdays, and other personal data you
            upload to the Service, and for having a lawful basis and, where required, the consent of each
            individual to store their information and send them messages. FlockText acts as a processor of this
            data on your behalf and does not verify that your contacts have opted in. You agree to honor opt-out
            requests from your contacts promptly.
          </p>
        </LegalSection>

        <LegalSection title="6. SMS Credits, Fees & Payment">
          <p>
            The Service is offered on a pay-as-you-go basis: you purchase SMS credits which are consumed as
            messages are sent. Prices are shown at the time of purchase and may change going forward; changes will
            not affect credits you have already purchased. Credits are non-refundable except where required by
            law or expressly stated otherwise, and unused credits may expire as disclosed on our pricing page.
            Failed or undelivered messages due to invalid numbers, network unavailability, or carrier filtering may
            still consume credits, since carriers typically charge for message submission rather than confirmed
            delivery.
          </p>
        </LegalSection>

        <LegalSection title="7. Sender IDs & Regulatory Compliance">
          <p>
            Custom sender IDs are subject to review and approval, and may be rejected, suspended, or reassigned to
            comply with telecom regulator requirements. You are responsible for ensuring your use of the Service
            complies with applicable telecommunications and consumer-protection laws in the countries where your
            messages are sent.
          </p>
        </LegalSection>

        <LegalSection title="8. Service Availability">
          <p>
            We aim to keep the Service available and reliable but do not guarantee uninterrupted or error-free
            operation. The Service depends on third-party infrastructure, including mobile network operators and
            payment providers, which may cause delays or outages outside our control. We may modify, suspend, or
            discontinue features of the Service at any time, with reasonable notice where practical.
          </p>
        </LegalSection>

        <LegalSection title="9. Intellectual Property">
          <p>
            FlockText and its licensors own all rights, title, and interest in the Service, including its software,
            branding, and documentation. These Terms do not grant you any rights to our trademarks or branding
            without prior written consent. You retain ownership of the content and contact data you upload, and
            grant us a limited license to process it solely to provide the Service to you.
          </p>
        </LegalSection>

        <LegalSection title="10. Termination">
          <p>
            You may stop using the Service and close your account at any time. We may suspend or terminate your
            access if you breach these Terms, misuse the Service, or where required by law or a telecom regulator.
            On termination, your right to use the Service ends immediately; provisions that by their nature should
            survive termination (including Sections 6, 9, 11, 12, and 13) will continue to apply.
          </p>
        </LegalSection>

        <LegalSection title="11. Disclaimer of Warranties">
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, whether express or
            implied, including implied warranties of merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that messages will be delivered, delivered on time, or delivered
            without error, as this depends on third-party carriers outside our control.
          </p>
        </LegalSection>

        <LegalSection title="12. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, FlockText will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill,
            arising from your use of the Service. Our total liability for any claim arising out of these Terms or
            the Service is limited to the amount you paid us for SMS credits in the three months preceding the
            claim.
          </p>
        </LegalSection>

        <LegalSection title="13. Indemnification">
          <p>
            You agree to indemnify and hold FlockText harmless from any claims, damages, or expenses (including
            reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your
            violation of any rights of a third party, including recipients of messages you send.
          </p>
        </LegalSection>

        <LegalSection title="14. Governing Law & Disputes">
          <p>
            These Terms are governed by the laws of the Republic of Ghana, without regard to conflict-of-law
            principles. Any dispute arising out of or relating to these Terms or the Service will be subject to the
            exclusive jurisdiction of the courts of Ghana.
          </p>
        </LegalSection>

        <LegalSection title="15. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we will notify you by email
            or through the Service before the changes take effect. Continued use of the Service after changes
            become effective constitutes acceptance of the updated Terms.
          </p>
        </LegalSection>

        <LegalSection title="16. Contact Us">
          <p>
            Questions about these Terms can be sent to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-foreground underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{' '}
            or by phone at {CONTACT_PHONE_DISPLAY}. See also our{' '}
            <Link to="/privacy" className="text-foreground underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </LegalSection>
      </LegalLayout>
    </>
  );
}

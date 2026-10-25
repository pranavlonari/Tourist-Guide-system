# Bibliography and References

The following sources document the technologies, standards, and security
guidance relevant to the Smart Tourist Guide System. Accessed 21 October 2026.

## Web technologies

1. Mozilla Contributors. “HTML forms.” *MDN Web Docs*.
   <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_forms>
   Reference for the application's server-submitted HTML forms and associated
   labels.
2. Mozilla Contributors. “CSS: Cascading Style Sheets.” *MDN Web Docs*.
   <https://developer.mozilla.org/en-US/docs/Web/CSS>
   Reference for the responsive, CSS-only presentation layer.
3. OpenJS Foundation. “Introduction to Node.js.” *Node.js Learn*.
   <https://nodejs.org/en/learn/getting-started/introduction-to-nodejs>
   Reference for the server-side JavaScript runtime.
4. OpenJS Foundation. “Routing.” *Express 5 Guide*.
   <https://expressjs.com/en/guide/routing/>
   Reference for HTTP routes and request handling in the Express backend.
5. OpenJS Foundation. “Express session middleware.”
   <https://expressjs.com/en/resources/middleware/session/>
   Reference for server-side sessions and session-cookie behavior.
6. Oracle. “MySQL 8.4 Reference Manual.”
   <https://dev.mysql.com/doc/refman/8.4/en/>
   Reference for the relational database used by the application.
7. MySQL2 contributors. “MySQL2 documentation.”
   <https://sidorares.github.io/node-mysql2/docs>
   Reference for the Node.js MySQL client and parameterized queries.

## Security and accessibility

8. OWASP Foundation. “Password Storage Cheat Sheet.”
   <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
   Guidance for password hashing. The project uses bcryptjs hashes and does
   not store plaintext passwords.
9. OWASP Foundation. “Session Management Cheat Sheet.”
   <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
   Guidance for authenticated session handling.
10. OWASP Foundation. “Secure Integration of Third-Party Payment Gateways
    Cheat Sheet.”
    <https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.html>
    Security guidance for a future real payment integration, including
    server-side amount validation and payment verification.
11. World Wide Web Consortium. “Web Content Accessibility Guidelines (WCAG)
    2.2.”
    <https://www.w3.org/TR/WCAG22/>
    Accessibility standard used as a reference for accessible forms,
    navigation, and responsive web content.

## Payment-flow reference and project limitation

12. Stripe. “How Checkout works.”
    <https://docs.stripe.com/payments/checkout/how-checkout-works>
    Reference for the lifecycle of a hosted payment checkout.
13. Stripe. “Fulfil orders.”
    <https://docs.stripe.com/checkout/fulfillment>
    Reference for server-side payment confirmation and fulfillment.

**Important:** These payment references describe a possible future production
integration; the project does not integrate Stripe or another payment gateway.
Its payment choices, transaction IDs, and receipts are simulations. The app
does not collect or process real payment credentials or money.

## Destination and image data

14. Ministry of Tourism, Government of India. “Incredible India.”
    <https://www.incredibleindia.gov.in/en>
    A recommended official starting point for independently verifying Indian
    destination information.
15. Unsplash. “Unsplash License.”
    <https://unsplash.com/license>
    License information for the Unsplash-hosted sample images referenced in
    `backend/sql/seed.sql`.

Destination descriptions, ratings, sample prices, and availability in the
seed data are illustrative demo content. They are not live offers or verified
tourism facts. Check current official destination and provider information
before using them for real travel planning.

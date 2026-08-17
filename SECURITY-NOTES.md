# Trial Security / Privacy Notes

This trial intentionally minimizes risk:

- No backend.
- No database.
- No authentication implementation.
- No clinical data collection.
- No file uploads.
- No analytics or tracking scripts.
- No microphone, camera or geolocation permission requests.
- Real booking/account actions link to the practice's current secure client portal.
- Only optional first name, preferred location and accessibility display preferences can be stored in browser localStorage for the demo.

## Before production use with real Mood & Mind clients

A production release should not be treated as a simple extension of this static trial. It needs a formal privacy/security review and approved data map, including:

1. Exact systems of record and API/integration contracts.
2. Authentication and account recovery design.
3. Role/permission boundaries.
4. Encryption and secrets management.
5. Audit logging and incident response.
6. Data retention/deletion rules.
7. Australian privacy obligations and health-information requirements applicable to the practice.
8. Accessibility testing.
9. Load, failure and rollback testing.
10. Monitoring and release controls.

Do not place production secrets, credentials or client data in the GitHub repository.

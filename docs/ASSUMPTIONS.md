# Assumptions

- Real-time fan reports are simulated via seed data and a live demo submission form;
  no real stadium sensor/IoT/camera feed is integrated in this MVP.
- Transit/rideshare timing shown to fans is illustrative/mocked, clearly labeled as
  estimated, not sourced from a live transit API.
- "Sustainability nudge" compares estimated CO2 for public transit vs. private car
  using static, publicly documented average emission factors (cited in code comments),
  not a live carbon-tracking service.
- Anonymous session identifiers are used only to rate-limit and weight repeated
  reports from the same source slightly lower (to reduce single-source manipulation);
  no personal data is collected or stored.
- Language coverage in the demo is limited to a handful of languages for time reasons;
  the architecture supports any language Gemini can translate.
- One demo venue/map is used; the data model supports multiple venues but only one is
  seeded for this submission.

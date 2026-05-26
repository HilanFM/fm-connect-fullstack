# FM Connect Full-Stack v6 – Future Minds Style UI Upgrade

This version upgrades the FM Connect full-stack demo to look closer to the polished Future Minds-inspired UI mockups.

## Major UI upgrades

- Premium homepage with large hero image, overlay text, search/filter bar, featured institutes, featured courses, stats band, videos, counseling, testimonials, and Contact Us section.
- More realistic institute listing cards with institute images, stats, ratings, and CTA buttons.
- Rich institute profile page with hero banner, logo panel, metrics strip, overview tabs, gallery, videos, contact sidebar, open day, intake info, and course cards.
- Rich course/degree detail page with image hero, course facts, modules, videos, related careers, and enrollment CTAs.
- Video cards styled with play buttons, duration labels, owner/category tags, and thumbnails.
- Updated footer and Contact Us section.
- Existing v5 functionality is retained: login roles, institute/admin video upload, institute course management, admin user/institute management, Contact Us messages, dashboards, and demo JSON database.

## How to run locally

```bash
cd fm-connect-fullstack-v6
node server.js
```

Open:

```text
http://localhost:3000
```

## Demo logins

```text
Student: student@fmconnect.lk / demo123
Institute: institute@fmconnect.lk / demo123
Counselor: counselor@fmconnect.lk / demo123
Admin: admin@fmconnect.lk / demo123
```

## How to update your hosted Codespaces demo

1. Extract this ZIP.
2. Upload/replace the files in your GitHub repository.
3. In Codespaces, stop the running server if needed.
4. Run:

```bash
node server.js
```

5. Open the forwarded port 3000 public URL again.

## Notes

This is still a demo/starter full-stack system. For production, replace the JSON database with PostgreSQL/MySQL, add secure password hashing, OTP/SMS, email, payment gateway, real storage/CDN, stronger validation, backups, and deployment monitoring.

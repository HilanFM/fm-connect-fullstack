# FM Connect Full-Stack v10 – Course Discovery Filters

This version keeps the realistic Future Minds-style UI from v7/v8 and adds the missing counselor management and booking availability workflows.

## What is new in v9

- Admin dashboard now has a dedicated **Counselors** tab.
- Admin can create a counselor profile and counselor login account together.
- Admin can edit counselor profile details: name, email, phone, image, focus area, languages, bio, qualification, experience, and status.
- Admin can add, edit, disable, or delete availability slots on behalf of any counselor.
- Counselor dashboard now has an **Availability / Slots** tab.
- Counselors can add their own available booking slots.
- Counselors can edit or delete their own slots.
- Slots support date, start time, end time, online/physical mode, meeting link, location, capacity, status, and notes.
- Students can see available counselor slots on the public Counseling page and book them.
- Existing v8 Contact Us alignment fix is retained.
- Existing realistic images, course/institute tabs, video management, and dashboards are retained.

## How to run locally

```bash
cd fm-connect-fullstack-v10
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

## How to test the new counselor workflows

### Admin creates a counselor

1. Login as Admin.
2. Open Admin Dashboard.
3. Click the **Counselors** tab.
4. Use **Create counselor + login**.
5. Save.
6. The counselor can login using the email/password you entered.

### Admin adds slots for a counselor

1. Login as Admin.
2. Open Admin Dashboard.
3. Click **Counselors**.
4. Open a counselor card.
5. Use **Manage availability slots**.
6. Add date, time, mode, link/location, and status.

### Counselor adds their own slots

1. Login as Counselor.
2. Open Counselor Dashboard.
3. Click **Availability / Slots**.
4. Add a new available slot.
5. Go to public **Counseling** page to see the slot available for students.

## Hosting update

To update your hosted Codespaces demo:

1. Extract this ZIP.
2. Replace the files in your GitHub repository with this v9 folder contents.
3. Open Codespaces.
4. Run:

```bash
node server.js
```

5. Open the forwarded port 3000 public URL again.

## Production note

This is still a demo/starter full-stack system. For production, replace the JSON database with PostgreSQL/MySQL, add secure password hashing, OTP/SMS, email, payment gateway, cloud object storage/CDN, stronger validation, backups, audit logs, and monitoring.


## V10 update

Course Discovery now includes richer filters: location, cost range, study mode, course type, duration, institute, sponsored listing, and sorting.

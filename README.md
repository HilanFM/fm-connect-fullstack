# FM Connect Full-Stack System v2

This is an improved full-stack demo/starter system for FutureMinds Connect.

## Main improvements in v2

### Institute Owner
- Edit institute profile
- Upload/change institute image
- Add new courses/degrees
- Edit existing courses/degrees
- Change course status: Draft, Pending Approval, Published, Disabled
- Update course images
- Update modules, skills, related jobs, price, discount, duration, and start date
- Delete courses
- View student leads

### Admin
- Create institutes directly
- Create institute owner during institute creation
- Edit institute details
- Activate/block institutes
- Create users for Student, Institute Owner, Counselor, and Admin roles
- Assign institute owner to an institute
- Activate/block users
- Create/edit/delete any course for any institute
- Convert institute registration request into institute + owner account
- Approve institute requests
- Approve articles and feedback
- View platform overview metrics

## How to run locally

1. Install Node.js LTS.
2. Extract this ZIP.
3. Open Command Prompt in the project folder.
4. Run:

```cmd
node server.js
```

5. Open:

```text
http://localhost:3000
```

## Demo accounts

```text
Student: student@fmconnect.lk / demo123
Institute Owner: institute@fmconnect.lk / demo123
Counselor: counselor@fmconnect.lk / demo123
Admin: admin@fmconnect.lk / demo123
```

## Data storage

This demo uses:

```text
data/db.json
```

The system saves created institutes, users, courses, leads, bookings, and uploaded image paths into this JSON database.

For production, replace this JSON file with PostgreSQL/MySQL and add secure password hashing, OTP, real file storage, payment gateway, email/SMS, monitoring, backups, and proper deployment.


## v3 Image Upgrade

This version includes generated PNG artwork for:

- Homepage hero banner
- Sponsored/free-course banner
- Institute profile images
- Course and degree images
- Counseling and article visuals

The images are stored in `public/assets/` and referenced from `data/db.json` and `data/db.seed.json`.

To reset the demo database back to these image-upgraded records, copy `data/db.seed.json` over `data/db.json` or run the reset command from the README if available.


## v4 Amendments Added

This version adds the requested amendments:

1. Contact Us / Reach Us / Inquiry sections
   - Public Contact page
   - Inquiry submission form
   - Admin dashboard Inquiry tab
   - Mark inquiry as resolved

2. Dashboard Stats sections
   - Student dashboard Stats tab
   - Institute Owner dashboard Stats tab
   - Counselor dashboard Stats tab
   - Admin dashboard Stats tab

3. Video sections
   - Public Videos page
   - Homepage video highlights
   - Institute profile video section
   - Course detail video section
   - Institute Owner video management
   - Admin video management

## Run

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

Demo logins remain:

```text
Student: student@fmconnect.lk / demo123
Institute: institute@fmconnect.lk / demo123
Counselor: counselor@fmconnect.lk / demo123
Admin: admin@fmconnect.lk / demo123
```

# FM Connect API Summary

## Public APIs

- `GET /api/public/home`
- `GET /api/public/courses?q=&category=`
- `GET /api/public/courses/:slug`
- `GET /api/public/institutes`
- `GET /api/public/institutes/:slug`
- `GET /api/public/counselors`
- `GET /api/public/articles`

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

## Student APIs

- `POST /api/student/signup`
- `PUT /api/student/profile`
- `POST /api/student/leads`
- `POST /api/counseling/bookings`
- `GET /api/me/notifications`
- `POST /api/me/notifications/read`

## Institute APIs

- `GET /api/dashboard`
- `PUT /api/institute/profile`
- `POST /api/institute/courses`
- `DELETE /api/institute/courses/:id`
- `POST /api/institute/image`

## Admin APIs

- `POST /api/admin/institute-requests`
- `POST /api/admin/institute-requests/:id/approve`
- `POST /api/admin/articles/:id/approve`

## Dashboard API

- `GET /api/dashboard`

The response changes based on the logged-in user role.

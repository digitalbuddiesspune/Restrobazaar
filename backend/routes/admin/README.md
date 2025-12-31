# Super Admin API Documentation

This document provides API endpoints for Super Admin management. All endpoints require authentication with a JWT token and super_admin role authorization.

## Base URL
```
http://localhost:PORT/api/v1/admin
```
*Replace `PORT` with your server port (default: 3000 or check your .env file)*

## Authentication

All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Note:** The user must have the `super_admin` role to access these endpoints.

---

## API Endpoints

### 1. Get All Super Admins

Retrieve a list of all super admins.

**Request:**
```
GET /api/v1/admin/super-admins
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Postman Setup:**
- Method: `GET`
- URL: `http://localhost:3000/api/v1/admin/super-admins`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`

---

### 2. Get Super Admin by ID

Retrieve a specific super admin by their ID.

**Request:**
```
GET /api/v1/admin/super-admins/:id
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Postman Setup:**
- Method: `GET`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID from your database.

---

### 3. Get Super Admin by Email

Retrieve a specific super admin by their email address.

**Request:**
```
GET /api/v1/admin/super-admins/email/:email
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Postman Setup:**
- Method: `GET`
- URL: `http://localhost:3000/api/v1/admin/super-admins/email/admin@example.com`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`

**Example:**
Replace `admin@example.com` with an actual super admin email from your database.

---

### 4. Create Super Admin

Create a new super admin account.

**Request:**
```
POST /api/v1/admin/super-admins
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "superadmin@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "permissions": {
    "canManageAdmins": true,
    "canManageUsers": true,
    "canManageSettings": true
  }
}
```

**Postman Setup:**
- Method: `POST`
- URL: `http://localhost:3000/api/v1/admin/super-admins`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`
  - Key: `Content-Type`
  - Value: `application/json`
- Body: Select `raw` and `JSON`, then paste the JSON body above

**Note:** Adjust the body fields according to your SuperAdmin model schema.

---

### 5. Update Super Admin

Update an existing super admin's information.

**Request:**
```
PUT /api/v1/admin/super-admins/:id
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "John Doe Updated",
  "email": "superadmin.updated@example.com",
  "phone": "+1234567890",
  "isActive": true
}
```

**Postman Setup:**
- Method: `PUT`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`
  - Key: `Content-Type`
  - Value: `application/json`
- Body: Select `raw` and `JSON`, then paste the JSON body above

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID.

---

### 6. Update Super Admin Password

Update a super admin's password.

**Request:**
```
PUT /api/v1/admin/super-admins/:id/password
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

**Postman Setup:**
- Method: `PUT`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011/password`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`
  - Key: `Content-Type`
  - Value: `application/json`
- Body: Select `raw` and `JSON`, then paste the JSON body above

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID.

---

### 7. Update Super Admin Permissions

Update a super admin's permissions.

**Request:**
```
PUT /api/v1/admin/super-admins/:id/permissions
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "permissions": {
    "canManageAdmins": true,
    "canManageUsers": true,
    "canManageSettings": false,
    "canViewReports": true
  }
}
```

**Postman Setup:**
- Method: `PUT`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011/permissions`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`
  - Key: `Content-Type`
  - Value: `application/json`
- Body: Select `raw` and `JSON`, then paste the JSON body above

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID.

---

### 8. Delete Super Admin

Delete a super admin account.

**Request:**
```
DELETE /api/v1/admin/super-admins/:id
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Postman Setup:**
- Method: `DELETE`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID.

**Warning:** This action is permanent and cannot be undone.

---

### 9. Toggle Super Admin Active Status

Toggle a super admin's active/inactive status.

**Request:**
```
PATCH /api/v1/admin/super-admins/:id/toggle-active
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Postman Setup:**
- Method: `PATCH`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011/toggle-active`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID.

**Note:** This endpoint typically toggles the `isActive` field between `true` and `false`.

---

### 10. Update Last Login

Update a super admin's last login timestamp.

**Request:**
```
PATCH /api/v1/admin/super-admins/:id/update-last-login
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Postman Setup:**
- Method: `PATCH`
- URL: `http://localhost:3000/api/v1/admin/super-admins/507f1f77bcf86cd799439011/update-last-login`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer <your_jwt_token>`

**Example:**
Replace `507f1f77bcf86cd799439011` with an actual super admin ID.

---

## Postman Collection Setup

### Quick Setup Steps:

1. **Create a new Collection** in Postman named "Super Admin API"

2. **Set Collection Variables:**
   - Go to Collection → Variables
   - Add variables:
     - `base_url`: `http://localhost:3000/api/v1/admin`
     - `token`: `<your_jwt_token>`

3. **Use Variables in Requests:**
   - URL: `{{base_url}}/super-admins`
   - Authorization Header: `Bearer {{token}}`

4. **Authorization Setup:**
   - Go to Collection → Authorization
   - Type: `Bearer Token`
   - Token: `{{token}}`
   - This will automatically add the Authorization header to all requests

---

## Common Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have super_admin role
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Testing Tips

1. **Get a JWT Token First:**
   - You'll need to authenticate through your login endpoint to get a JWT token
   - The user must have `super_admin` role

2. **Use Environment Variables:**
   - Create a Postman Environment with:
     - `base_url`: Your server URL
     - `token`: Your JWT token
     - `admin_id`: A test super admin ID

3. **Test Sequence:**
   - Create a super admin (POST)
   - Get all super admins (GET)
   - Get by ID (GET)
   - Update super admin (PUT)
   - Update password (PUT)
   - Update permissions (PUT)
   - Toggle active status (PATCH)
   - Update last login (PATCH)
   - Delete super admin (DELETE) - Use with caution!

---

## Notes

- All endpoints require `super_admin` role authorization
- Replace placeholder IDs and emails with actual values from your database
- Adjust request body fields according to your SuperAdmin model schema
- Ensure your server is running before testing
- Check your `.env` file for the correct `PORT` value


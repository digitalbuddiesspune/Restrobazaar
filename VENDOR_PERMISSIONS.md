# Vendor Permissions Summary

This document outlines all permissions and capabilities granted to vendors in the RestroBazaar system.

## Authentication & Access Requirements

### Prerequisites for Vendor Access
- **Account Status**: Vendor account must be `isActive: true`
- **Approval Status**: Vendor account must be `isApproved: true`
- **Authentication**: Vendors receive a JWT token with role `"vendor"` upon successful login
- **Token Expiry**: JWT tokens expire after 24 hours

### Login Endpoint
- **Route**: `POST /api/v1/vendors/login`
- **Access**: Public (no authentication required)
- **Returns**: JWT token with vendor ID and role

---

## Product Management Permissions

### 1. View Products

#### View All Vendor Products (Public)
- **Route**: `GET /api/v1/vendor-products`
- **Access**: Public (optional authentication)
- **Description**: View all vendor products in the system (can be filtered)

#### View Own Products
- **Route**: `GET /api/v1/vendor-products/my-products`
- **Access**: Vendor only (`authenticate`, `authorize("vendor")`)
- **Description**: View only the products belonging to the logged-in vendor
- **Query Parameters**:
  - `cityId`: Filter by city
  - `status`: Filter by status (true/false)
  - `page`: Page number for pagination
  - `limit`: Items per page

#### View Specific Product
- **Route**: `GET /api/v1/vendor-products/:id`
- **Access**: Public (optional authentication)
- **Description**: View details of a specific vendor product

#### Search Products
- **Route**: `GET /api/v1/vendor-products/search`
- **Access**: Public (optional authentication)
- **Description**: Search vendor products with various filters

#### View Products by Vendor
- **Route**: `GET /api/v1/vendor-products/vendor/:vendorId`
- **Access**: Public (optional authentication)
- **Description**: View all products from a specific vendor

#### View Products by City
- **Route**: `GET /api/v1/vendor-products/city/:cityId`
- **Access**: Public (optional authentication)
- **Description**: View all vendor products in a specific city

#### View Products by City and Category
- **Route**: `GET /api/v1/vendor-products/city/:cityId/category/:categoryId`
- **Access**: Public (optional authentication)
- **Description**: View vendor products filtered by city and category

---

### 2. Create Products

- **Route**: `POST /api/v1/vendor-products`
- **Access**: Vendor, Admin, Super Admin (`authenticate`, `authorize("vendor", "admin", "super_admin")`)
- **Description**: Create a new vendor product
- **Auto-Assignment**: When a vendor creates a product, the `vendorId` is automatically set from their JWT token
- **Required Fields**:
  - `productId`: Reference to global product
  - `cityId`: City where product is available
  - `priceType`: "single" or "bulk"
  - `pricing`: Price structure based on priceType
- **Optional Fields**:
  - `availableStock`: Stock quantity
  - `minimumOrderQuantity`: Minimum order amount
  - `notifyQuantity`: Low stock alert threshold
  - `status`: Active/inactive status

---

### 3. Update Products

- **Route**: `PUT /api/v1/vendor-products/:id`
- **Access**: Vendor, Admin, Super Admin (`authenticate`, `authorize("vendor", "admin", "super_admin")`)
- **Restriction**: **Vendors can ONLY update their own products**
- **Validation**: System checks if `vendorProduct.vendorId` matches `req.user.userId` for vendors
- **Updatable Fields**:
  - `priceType`: Change between "single" and "bulk"
  - `pricing`: Update price structure
  - `availableStock`: Update stock quantity
  - `minimumOrderQuantity`: Change minimum order quantity
  - `notifyQuantity`: Update low stock alert threshold
  - `status`: Activate/deactivate product

---

### 4. Delete Products

- **Route**: `DELETE /api/v1/vendor-products/:id`
- **Access**: Vendor, Admin, Super Admin (`authenticate`, `authorize("vendor", "admin", "super_admin")`)
- **Restriction**: **Vendors can ONLY delete their own products**
- **Validation**: System checks if `vendorProduct.vendorId` matches `req.user.userId` for vendors

---

### 5. Update Stock

- **Route**: `PATCH /api/v1/vendor-products/:id/stock`
- **Access**: Vendor, Admin, Super Admin (`authenticate`, `authorize("vendor", "admin", "super_admin")`)
- **Description**: Update stock quantity for a vendor product
- **Restriction**: Vendors can only update stock for their own products

---

### 6. Toggle Product Status

- **Route**: `PATCH /api/v1/vendor-products/:id/status`
- **Access**: Vendor, Admin, Super Admin (`authenticate`, `authorize("vendor", "admin", "super_admin")`)
- **Description**: Activate or deactivate a vendor product
- **Restriction**: Vendors can only toggle status for their own products

---

## Vendor Profile Permissions

### Update Last Login
- **Route**: `PATCH /api/v1/vendors/:id/update-last-login`
- **Access**: Vendor, Admin, Super Admin (`authenticate`, `authorize("admin", "super_admin", "vendor")`)
- **Description**: Update last login timestamp (automatically done on login)

---

## Restrictions & Limitations

### ❌ What Vendors CANNOT Do:

1. **Vendor Management**
   - Cannot view list of all vendors
   - Cannot create new vendor accounts
   - Cannot update other vendors' information
   - Cannot delete vendor accounts
   - Cannot approve/reject vendor accounts
   - Cannot update vendor KYC status
   - Cannot toggle vendor active status

2. **Product Management Restrictions**
   - Cannot update products belonging to other vendors
   - Cannot delete products belonging to other vendors
   - Cannot modify other vendors' stock or pricing

3. **Admin Functions**
   - Cannot access admin dashboard
   - Cannot manage global products (only add them to their catalog)
   - Cannot manage categories, cities, or other system settings
   - Cannot view or manage orders (if order management exists)

4. **Account Management**
   - Cannot update their own vendor profile information (business name, email, etc.)
   - Cannot change their password through vendor routes (admin-only)
   - Cannot update their own KYC status or documents

---

## Security Features

### Authentication Middleware Checks:
1. **Token Validation**: JWT token must be valid and not expired
2. **Vendor Existence**: Vendor must exist in database
3. **Active Status**: `vendor.isActive` must be `true`
4. **Approval Status**: `vendor.isApproved` must be `true`

### Authorization Checks:
1. **Role Verification**: Token must contain `role: "vendor"`
2. **Ownership Verification**: For update/delete operations, system verifies product ownership
3. **Resource Access**: Vendors can only access/modify their own resources

---

## Summary

Vendors have **limited, product-focused permissions**:

✅ **Can Do:**
- View all products (read-only)
- View their own products
- Create new vendor products
- Update their own products (pricing, stock, status)
- Delete their own products
- Toggle status of their own products
- Update stock of their own products

❌ **Cannot Do:**
- Manage other vendors or their products
- Access admin functions
- Modify system settings
- Update their own vendor profile
- Manage global product catalog (only add to their catalog)

---

## Notes

- All vendor product operations automatically use the vendor's ID from the JWT token
- Vendors are restricted to managing only their own products through ownership checks
- The system enforces these restrictions at both the route level (authorization) and controller level (ownership validation)


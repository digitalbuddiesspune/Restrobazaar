# Vendor Dashboard - Component-Based Architecture

## Overview

A professional, modern vendor dashboard built with React, featuring a component-based architecture, React Query for data fetching and caching, and Axios for API calls.

## Architecture

### Component Structure

```
frontend/src/
├── components/vendor/
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── Header.jsx           # Top header with search and notifications
│   ├── StatsCard.jsx        # Reusable statistics card component
│   ├── ProductTable.jsx     # Table for displaying vendor's products
│   ├── CatalogTable.jsx     # Table for product catalog
│   └── ProductForm.jsx      # Form for adding/editing products
├── services/
│   └── vendorService.js    # Axios-based API service layer
├── hooks/
│   └── useVendorQueries.js # React Query hooks for data fetching
└── pages/
    └── VendorDashboard.jsx # Main dashboard component
```

## Features

### 1. **Professional Layout**
- Fixed sidebar navigation with gradient design
- Responsive header with search functionality
- Clean, modern UI with Tailwind CSS
- Card-based statistics display
- Professional color scheme (blue gradient)

### 2. **Component-Based Structure**
- **Sidebar**: Navigation menu with active state highlighting
- **Header**: Search bar, notifications, and user profile
- **StatsCard**: Reusable card component for displaying metrics
- **ProductTable**: Data table with pagination, edit, delete, and status toggle
- **CatalogTable**: Product catalog with search and add-to-catalog functionality
- **ProductForm**: Comprehensive form for adding/editing products

### 3. **Data Management**

#### Axios Service Layer (`vendorService.js`)
- Centralized API configuration
- Automatic token injection via interceptors
- Error handling and token expiration management
- Services for:
  - Vendor Products (CRUD operations)
  - Global Products (catalog)
  - Cities

#### React Query Hooks (`useVendorQueries.js`)
- Automatic caching and refetching
- Optimistic updates
- Query invalidation on mutations
- Hooks available:
  - `useMyVendorProducts` - Get vendor's products
  - `useGlobalProducts` - Get product catalog
  - `useCities` - Get cities list
  - `useCreateVendorProduct` - Create product mutation
  - `useUpdateVendorProduct` - Update product mutation
  - `useDeleteVendorProduct` - Delete product mutation
  - `useToggleStatus` - Toggle product status mutation

### 4. **Dashboard Tabs**

1. **Overview**
   - Statistics cards (Total Products, Active Products, Low Stock, Total Stock)
   - Recent products table
   - Quick insights

2. **My Products**
   - Full list of vendor's products
   - Search and filter functionality
   - Pagination
   - Edit, delete, and status toggle actions

3. **Product Catalog**
   - Browse all available products
   - Search functionality
   - Add products to vendor catalog
   - Pagination

4. **Add Product**
   - Form for adding new products
   - Support for single and bulk pricing
   - Stock management
   - Edit existing products

5. **Analytics** (Placeholder)
   - Future analytics dashboard

## Usage

### Accessing the Dashboard

Navigate to `/vendor/dashboard` after logging in as a vendor.

### Adding a Product

1. Go to "Product Catalog" tab
2. Search for desired product
3. Click "Add to Catalog"
4. Fill in pricing, stock, and other details
5. Submit the form

### Editing a Product

1. Go to "My Products" tab
2. Click "Edit" on any product
3. Modify the details
4. Submit the form

### Managing Products

- **Toggle Status**: Click "Activate" or "Deactivate" to change product status
- **Delete**: Click "Delete" to remove a product (with confirmation)
- **Search**: Use the search bar in the header to filter products

## API Integration

### Authentication
- Token stored in `localStorage`
- Automatically included in all API requests via Axios interceptor
- Automatic redirect to login on 401 errors

### Data Fetching
- Uses React Query for caching
- Automatic background refetching
- Optimistic updates for better UX
- Query invalidation ensures data consistency

## Styling

- **Framework**: Tailwind CSS
- **Color Scheme**: Blue gradient (professional)
- **Responsive**: Mobile-friendly design
- **Icons**: Emoji icons (can be replaced with icon library)

## Key Features

✅ Component-based architecture
✅ React Query for data fetching and caching
✅ Axios for API calls with interceptors
✅ Professional UI/UX design
✅ Search and filter functionality
✅ Pagination support
✅ Error handling
✅ Loading states
✅ Optimistic updates
✅ Token management

## File Structure

```
frontend/src/
├── components/vendor/
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── StatsCard.jsx
│   ├── ProductTable.jsx
│   ├── CatalogTable.jsx
│   └── ProductForm.jsx
├── services/
│   └── vendorService.js
├── hooks/
│   └── useVendorQueries.js
└── pages/
    └── VendorDashboard.jsx
```

## Dependencies

- `react` - UI library
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching and caching
- `axios` - HTTP client
- `tailwindcss` - CSS framework

## Future Enhancements

- [ ] Replace emoji icons with professional icon library (Heroicons, Lucide)
- [ ] Add analytics charts and graphs
- [ ] Add bulk operations (bulk edit, bulk delete)
- [ ] Add export functionality (CSV, PDF)
- [ ] Add advanced filtering options
- [ ] Add product image upload
- [ ] Add order management
- [ ] Add revenue analytics

## Migration Notes

The old `VendorAdminDashboard` is still available at `/vendor/dashboard/old` for reference. The new dashboard is the default at `/vendor/dashboard`.


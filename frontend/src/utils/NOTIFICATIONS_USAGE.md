# Notifications Usage Guide

This guide shows how to use the notification system throughout the application.

## Import

```javascript
import { notifySuccess, notifyError, notifyInfo, notifyLoading, notifyPromise } from '../utils/notifications';
```

## Basic Usage

### Success Notification

```javascript
import { notifySuccess } from '../utils/notifications';

// Simple success message
notifySuccess('Order placed successfully!');

// With custom duration
notifySuccess('Item added to cart!', { duration: 2000 });
```

### Error Notification

```javascript
import { notifyError } from '../utils/notifications';

// Simple error message
notifyError('Failed to load data');

// With custom duration
notifyError('Payment failed. Please try again.', { duration: 5000 });
```

### Info Notification

```javascript
import { notifyInfo } from '../utils/notifications';

notifyInfo('Your order will be delivered in 2-3 days');
```

### Loading Notification

```javascript
import { notifyLoading, dismissToast } from '../utils/notifications';

// Show loading
const toastId = notifyLoading('Processing your request...');

// Dismiss when done
setTimeout(() => {
  dismissToast(toastId);
  notifySuccess('Request completed!');
}, 2000);
```

## Promise-Based Notifications

Automatically handles loading, success, and error states:

```javascript
import { notifyPromise } from '../utils/notifications';

// Basic usage
notifyPromise(
  api.createOrder(orderData),
  {
    loading: 'Creating order...',
    success: 'Order created successfully!',
    error: 'Failed to create order'
  }
);

// With dynamic messages
notifyPromise(
  api.updateProduct(id, data),
  {
    loading: 'Updating product...',
    success: (data) => `Product "${data.name}" updated successfully!`,
    error: (err) => err.response?.data?.message || 'Update failed'
  }
);
```

## Usage in Components

### Form Submission

```javascript
import { notifySuccess, notifyError, notifyLoading, dismissToast } from '../utils/notifications';

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const loadingId = notifyLoading('Submitting form...');
  
  try {
    const response = await api.submitForm(formData);
    dismissToast(loadingId);
    notifySuccess('Form submitted successfully!');
  } catch (error) {
    dismissToast(loadingId);
    notifyError(error.response?.data?.message || 'Submission failed');
  }
};
```

### API Response Handlers

```javascript
import { notifyPromise } from '../utils/notifications';

// Using with async/await
const handleAddToCart = async (productId) => {
  try {
    await notifyPromise(
      cartAPI.addItem(productId),
      {
        loading: 'Adding to cart...',
        success: 'Item added to cart!',
        error: 'Failed to add item'
      }
    );
  } catch (error) {
    // Error is already handled by notifyPromise
  }
};

// Using with .then()
const handleDelete = (id) => {
  notifyPromise(
    api.deleteItem(id),
    {
      loading: 'Deleting...',
      success: 'Item deleted successfully',
      error: 'Failed to delete item'
    }
  ).then(() => {
    // Refresh data or navigate
    refetch();
  });
};
```

## Usage in React Query Mutations

```javascript
import { useMutation } from '@tanstack/react-query';
import { notifySuccess, notifyError } from '../utils/notifications';

const useCreateOrder = () => {
  return useMutation({
    mutationFn: orderAPI.createOrder,
    onSuccess: (data) => {
      notifySuccess('Order created successfully!');
    },
    onError: (error) => {
      notifyError(error.response?.data?.message || 'Failed to create order');
    },
  });
};
```

## Advanced Usage

### Custom Options

All notification functions accept an options object:

```javascript
notifySuccess('Success!', {
  duration: 5000,
  position: 'top-center',
  style: {
    background: '#333',
    color: '#fff',
  },
});
```

### Dismiss All Toasts

```javascript
import { dismissAllToasts } from '../utils/notifications';

// Clear all notifications
dismissAllToasts();
```

## Examples in Real Scenarios

### Add to Cart

```javascript
import { notifyPromise } from '../utils/notifications';

const handleAddToCart = async (product) => {
  await notifyPromise(
    cartAPI.addItem(product),
    {
      loading: 'Adding to cart...',
      success: `${product.name} added to cart!`,
      error: 'Failed to add item to cart'
    }
  );
};
```

### Form Validation

```javascript
import { notifyError } from '../utils/notifications';

const validateForm = (data) => {
  if (!data.email) {
    notifyError('Email is required');
    return false;
  }
  if (!data.password) {
    notifyError('Password is required');
    return false;
  }
  return true;
};
```

### File Upload

```javascript
import { notifyLoading, notifySuccess, notifyError, dismissToast } from '../utils/notifications';

const handleFileUpload = async (file) => {
  const loadingId = notifyLoading('Uploading file...');
  
  try {
    const response = await api.uploadFile(file);
    dismissToast(loadingId);
    notifySuccess('File uploaded successfully!');
    return response;
  } catch (error) {
    dismissToast(loadingId);
    notifyError(error.response?.data?.message || 'Upload failed');
    throw error;
  }
};
```

export const formatPrice = (price) => {
  return 'Rs. ' + Number(price).toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export const getDiscountedPrice = (price, discountPercent) => {
  return price * (1 - discountPercent / 100);
};

export const truncate = (str, n) => {
  return str?.length > n ? str.substring(0, n) + '...' : str;
};

export const slugify = (text) => {
  return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'amber',
    confirmed: 'blue',
    processing: 'indigo',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
  };
  return colors[status] || 'gray';
};

export const getPaymentStatusColor = (status) => {
  const colors = { unpaid: 'red', paid: 'green', refunded: 'amber' };
  return colors[status] || 'gray';
};

export const parseColors = (colorsJson) => {
  try {
    return typeof colorsJson === 'string' ? JSON.parse(colorsJson) : colorsJson || [];
  } catch {
    return [];
  }
};

export const parseStorageOptions = (storageJson) => {
  try {
    return typeof storageJson === 'string' ? JSON.parse(storageJson) : storageJson || [];
  } catch {
    return [];
  }
};

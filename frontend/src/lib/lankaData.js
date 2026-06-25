export const PROVINCES = [
  'Western', 'Central', 'Southern', 'North Western', 'Sabaragamuwa', 'Eastern', 'Uva', 'North Central', 'Northern'
];

export const CITIES_BY_PROVINCE = {
  'Western': ['Colombo', 'Gampaha', 'Kalutara', 'Negombo', 'Moratuwa', 'Kotte', 'Dehiwala', 'Maharagama'],
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya', 'Gampola', 'Dambulla'],
  'Southern': ['Galle', 'Matara', 'Hambantota', 'Ambalangoda', 'Weligama'],
  'North Western': ['Kurunegala', 'Puttalam', 'Chilaw', 'Kuliyapitiya'],
  'Sabaragamuwa': ['Ratnapura', 'Kegalle', 'Balangoda'],
  'Eastern': ['Trincomalee', 'Batticaloa', 'Ampara', 'Kattankudy'],
  'Uva': ['Badulla', 'Monaragala', 'Bandarawela', 'Haputale'],
  'North Central': ['Anuradhapura', 'Polonnaruwa', 'Kekirawa'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu']
};

export const BANKS = [
  { id: 'boc', name: 'Bank of Ceylon', icon: '🏦' },
  { id: 'sampath', name: 'Sampath Bank', icon: '🏦' },
  { id: 'peoples', name: 'People\'s Bank', icon: '🏦' },
  { id: 'rdb', name: 'RDB Bank', icon: '🏦' }
];

export const INSTALLMENT_DURATIONS = [4, 6, 12, 24];

export const CALCULATE_SHIPPING = (province, city) => {
  // Simple mock logic:
  if (!province || !city) return 0;
  if (province === 'Western' && city === 'Colombo') return 350; // Inside city
  if (province === 'Western') return 450; // Outskirts
  return 750; // Outside provinces
};

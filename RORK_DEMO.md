# Rork-Style Homepage Demo

This project now includes a Rork-style homepage that replicates the design and functionality shown in the reference images.

## Features

### 🏠 Homepage (`/rork`)
- **Dark theme** with modern UI design
- **Hero section** with "Build native mobile apps, fast" heading
- **App description input** with:
  - Large textarea for describing mobile apps
  - Upload image button
  - Public/Private toggle
  - Build App button with loading state
- **Your Projects section** (currently empty state)
- **Footer** with navigation links

### 👤 Profile Dropdown Menu
- **User information** display (Gourab, gourabxopm@gmail.com)
- **Daily usage tracking** with progress bar (2/5 messages)
- **Menu options**:
  - Upgrade Plan
  - FAQ
  - Account settings
  - Log out

## How to Access

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the Rork demo**:
   - Visit `http://localhost:3000/rork` directly
   - Or click the "View Rork Demo" button on the main homepage

## Design Details

### Color Scheme
- **Background**: Black (`bg-black`)
- **Text**: White (`text-white`)
- **Accents**: Blue (`bg-blue-600`)
- **Borders**: Gray (`border-gray-700`, `border-gray-800`)

### Typography
- **Hero heading**: Large, bold text
- **Body text**: Clean, readable fonts
- **Placeholder text**: Subtle gray styling

### Interactive Elements
- **Hover effects** on buttons and links
- **Loading states** with spinners
- **Disabled states** for form validation
- **Smooth transitions** for better UX

## Components Used

- **Radix UI Dropdown Menu** for the profile menu
- **Lucide React Icons** for consistent iconography
- **Tailwind CSS** for styling
- **React Hook Form** patterns for form handling

## Customization

The interface is fully customizable through:
- Tailwind CSS classes
- Component props
- State management
- API integration points

## Next Steps

To make this fully functional, you would need to:
1. Connect to a backend API for app creation
2. Implement user authentication
3. Add project management functionality
4. Integrate with a payment system for upgrades
5. Add image upload functionality
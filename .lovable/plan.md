

# StockMaint — Industrial Maintenance Stock Management PWA

## Overview
A full-stack warehouse management PWA for industrial maintenance teams with QR code integration, dark industrial theme, and role-based access. Built with React + Supabase + Tailwind CSS, entirely in Portuguese (Brazil).

## Design Theme
- **Dark industrial UI**: Navy/charcoal backgrounds (`#0f172a`, `#1e293b`)
- **Amber/yellow** for warnings and alerts
- **Green** for OK status and maintenance notes
- **Red** for critical/out-of-stock items
- Monospace font for quantities and codes

## Database (Supabase)
- **categories** table with 8 predefined categories (ROL, VED, FIL, ELE, COR, FIX, LUB, FER)
- **items** table with drawer codes as primary keys (e.g., GV-001)
- **movements** table tracking all stock entries/exits
- **user_roles** table for admin/tecnico role management
- **Storage bucket** for item photos
- RLS policies: items publicly readable (for QR codes), movements require auth, admin actions restricted by role
- Seed data with 10 items pre-populated

## Authentication
- Email/password via Supabase Auth
- Two roles: `admin` (full CRUD) and `tecnico` (view + register movements)
- `/item/:id` is publicly accessible (no auth required) so QR codes work for anyone

## Pages

### 1. Dashboard (`/dashboard`)
- 4 stat cards: Total Items, Critical Items, Out of Stock, Total Movements
- Alert panel listing all critical items (qty ≤ min_qty) with current/min quantities
- Recent movements feed (last 6 entries)

### 2. Catalog (`/catalog`)
- Search bar (by name, model, drawer ID)
- Category filter buttons with icons/colors
- Item cards showing: category badge, drawer ID, name, model, color-coded stock bar, CRITICAL badge
- Click navigates to item detail

### 3. Item Detail (`/item/:id`) — QR code target
- Item photo with placeholder fallback
- Technical description and maintenance notes (green highlight)
- Large stock status number (color-coded)
- Location info panel
- QR code display (generated via qrserver.com API)
- "Registrar Saída" (red) and "Registrar Entrada" (green) buttons
- Modal form for movements: quantity, reason/OS number, responsible person

### 4. QR Codes (`/qr-codes`)
- Grid of all items with QR codes
- Select/deselect checkboxes with Select All/Deselect All
- Print button opens new window with A4-optimized 4-column layout
- Auto-triggers `window.print()`

### 5. History (`/history`)
- Full movements table: type badge (ENT↓/SAÍ↑), item name+ID, reason, qty (+/-), date, responsible
- Sorted most recent first

### 6. Admin (`/admin`) — Protected
- Add new item form with all fields
- Edit existing items
- Photo upload to Supabase Storage
- Delete item with confirmation

## Navigation
- **Desktop**: Sidebar with icons, labels, and critical items count badge (red)
- **Mobile**: Bottom tab bar with key navigation items
- Collapsible sidebar on desktop

## PWA
- Web app manifest for installability
- App icons and theme color matching dark industrial theme

## Additional Details
- Toast notifications (sonner) for all successful operations
- All text in Portuguese (Brazil)
- URL-based routing so QR codes link directly to `/item/:id`


# Spec: Assets Management

## ADDED Requirements

### Requirement: Assets Overview Layout
The system MUST provide an assets management interface that integrates a TopAppBar, an AssetsHero section, an AssetList, an AllocationChart, a Floating Action Button (FAB), and a BottomNavBar.

#### Scenario: User navigates to the assets page
- **WHEN** the user opens the "Assets" page
- **THEN** they should see the interface styled with Tailwind CSS, including a navigation bar at the top, followed by the main content area with assets data, and the bottom navigation bar.

### Requirement: Assets Hero Section
The system MUST display an Assets Hero section showing the user's Total Net Worth and the Monthly Growth rate.

#### Scenario: Viewing total net worth and growth
- **WHEN** the assets page loads
- **THEN** the Total Net Worth is prominently displayed alongside a trending up/down indicator for the monthly growth.

### Requirement: Asset List
The system MUST display a list of available assets or financial accounts.

#### Scenario: Viewing asset items
- **WHEN** viewing the asset list
- **THEN** each item must display a specific icon (based on asset type), name, description, current balance, and a small visual bar indicating its proportion.

#### Scenario: Hovering an asset item
- **WHEN** a user hovers over an asset item
- **THEN** the system MUST display action buttons (such as edit and delete) for that specific asset.

### Requirement: Asset Allocation Chart
The system MUST provide a visual representation of how assets are distributed across different categories (e.g., Cash, Bank, Digital Assets).

#### Scenario: Viewing asset allocation
- **WHEN** viewing the assets page
- **THEN** a segmented progress bar or chart MUST be displayed, showing the percentage breakdown of each asset category.

### Requirement: Reusable TopAppBar
The system MUST reuse the `TopAppBar` component from the Dashboard across the Assets page.

#### Scenario: TopAppBar customization
- **WHEN** the TopAppBar is rendered on the Assets page
- **THEN** it should display the correct context title ("資產管理" or Ledger Name depending on the specific implementation choice) while keeping the same layout structure.

# Spec: Transaction Dashboard

## ADDED Requirements

### Requirement: Dashboard Overview Layout
The system MUST provide a comprehensive dashboard interface that integrates TopAppBar, Hero Section, Segmented Control, Main Content Area (Transactions/Insights), FAB, and BottomNavBar.

#### Scenario: User navigates to the dashboard
- **WHEN** the user opens the "Overview" page
- **THEN** they should see the TopAppBar with "Luminous Ledger" branding, followed by the Hero Section, Content Area, and BottomNavBar.

### Requirement: Hero Section (Net Worth)
The system MUST display a Hero Section card showing Total Net Worth, Monthly Growth percentage, and Liquid Cash amount using the defined gradient styles.

#### Scenario: Viewing total net worth
- **WHEN** the dashboard loads
- **THEN** the Total Net Worth should be prominently displayed with the integer and fractional parts styled differently.

### Requirement: Segmented Navigation
The system MUST provide a segmented control to switch between "今日紀錄" (Today's Records) and "資產明細" (Asset Details).

#### Scenario: Switching to Asset Details
- **WHEN** the user clicks "資產明細"
- **THEN** the active tab styling should move to "資產明細", and the content area below should switch to display asset information (implementation scope limited to UI placeholder for now).

### Requirement: Today's Transactions List
The system MUST display a list of recent transactions under the "今日花費" section when the "今日紀錄" tab is active.

#### Scenario: Viewing a transaction item
- **WHEN** viewing the transactions list
- **THEN** each item must display an icon, title, category/time, amount, and a specific tag or status.

### Requirement: Insights and Stats
The system MUST display side or bottom Bento-box cards for "Expense Analysis" (a bar chart placeholder and summary text) and "Credit Utilization" (progress bar and limit text).

#### Scenario: Viewing credit utilization
- **WHEN** viewing the insights section
- **THEN** the system displays the "MAIN CARD" credit utilization percentage and a visual progress bar.

### Requirement: Global Navigation (BottomNavBar)
The system MUST provide a fixed BottomNavBar with options: Overview, Assets, Transactions, Cards, Investments.

#### Scenario: Using the bottom navigation
- **WHEN** the user looks at the bottom of the screen
- **THEN** the "Overview" item should be highlighted as the active state, and other items should be inactive but clickable.

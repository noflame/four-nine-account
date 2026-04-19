# Spec: Transaction Dashboard

## Purpose
TBD: Defines the requirements and interactions for the transaction dashboard interface.

## Requirements

### Requirement: Dashboard Overview Layout
The system MUST provide a comprehensive dashboard interface that retrieves its data from `/api/dashboard` using TanStack Query. It integrates TopAppBar, Hero Section, Segmented Control, Main Content Area (Transactions/Insights), FAB, and BottomNavBar. It MUST display skeleton loaders during the fetching state, and gracefully handle API errors.

#### Scenario: User navigates to the dashboard
- **WHEN** the user opens the "Overview" page
- **THEN** they should see the TopAppBar with "Luminous Ledger" branding, followed by the Hero Section, Content Area, and BottomNavBar.

#### Scenario: Loading dashboard data
- **WHEN** the user navigates to the dashboard and data is fetching
- **THEN** they should see skeleton loaders in place of the Hero Section, Transaction List, Expense Analysis, and Credit Limit cards.

#### Scenario: Successfully fetching dashboard data
- **WHEN** the `/api/dashboard` API responds successfully
- **THEN** the child components (HeroSection, TransactionList, ExpenseAnalysisCard, CreditLimitCard) MUST render with the actual data without any static mock data.

#### Scenario: Failing to fetch dashboard data
- **WHEN** the `/api/dashboard` API fails to load
- **THEN** an error message or UI state should be displayed, allowing the user to retry the request.

### Requirement: Hero Section (Net Worth)
The system MUST display a Hero Section card using the data from the API response (`netWorth`, `liquidCash`, `monthlyGrowth`) and showing Total Net Worth, Monthly Growth percentage, and Liquid Cash amount using the defined gradient styles.

#### Scenario: Viewing total net worth
- **WHEN** the dashboard loads
- **THEN** the Total Net Worth should be prominently displayed with the integer and fractional parts styled differently.

#### Scenario: Viewing real total net worth
- **WHEN** the API returns the dashboard data
- **THEN** the Hero Section should display the real `netWorth` and calculated `monthlyGrowth` accurately.

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
The system MUST display side or bottom Bento-box cards for "Expense Analysis" and "Credit Utilization" using real API data.

#### Scenario: Viewing credit utilization
- **WHEN** viewing the insights section
- **THEN** the system displays the "MAIN CARD" credit utilization percentage and a visual progress bar.

#### Scenario: Viewing real credit utilization
- **WHEN** the API returns the dashboard data
- **THEN** the Credit Limit card displays the real `totalCreditLimit` and `usedCredit` to calculate the visual progress bar and percentage.

### Requirement: Global Navigation (BottomNavBar)
The system MUST provide a fixed BottomNavBar with options: Overview, Assets, Transactions, Cards, Investments.

#### Scenario: Using the bottom navigation
- **WHEN** the user looks at the bottom of the screen
- **THEN** the "Overview" item should be highlighted as the active state, and other items should be inactive but clickable.

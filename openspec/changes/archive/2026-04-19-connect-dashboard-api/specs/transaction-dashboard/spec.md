# Spec: Transaction Dashboard (Data Fetching)

## MODIFIED Requirements

### Requirement: Dashboard Overview Layout
The system MUST provide a comprehensive dashboard interface that retrieves its data from `/api/dashboard` using TanStack Query. It MUST display skeleton loaders during the fetching state, and gracefully handle API errors.

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
The system MUST display a Hero Section card using the data from the API response (`netWorth`, `liquidCash`, `monthlyGrowth`).

#### Scenario: Viewing real total net worth
- **WHEN** the API returns the dashboard data
- **THEN** the Hero Section should display the real `netWorth` and calculated `monthlyGrowth` accurately.

### Requirement: Insights and Stats
The system MUST display Bento-box cards for "Expense Analysis" and "Credit Utilization" using real API data.

#### Scenario: Viewing real credit utilization
- **WHEN** the API returns the dashboard data
- **THEN** the Credit Limit card displays the real `totalCreditLimit` and `usedCredit` to calculate the visual progress bar and percentage.

# iExec Demo CLI

A TypeScript CLI demo project that demonstrates Web3Telegram and Web3Mail integration using iExec's DataProtector.

## Features

- **Subscribe Command**: Smart subscription for Web3Telegram or Web3Mail with intelligent protected data reuse
- **Unsubscribe Command**: Revoke access from Web3Telegram or Web3Mail services
- **Send Test Command**: Send test messages via Web3Telegram or Web3Mail
- **Deposit Command**: Check account balance and deposit RLC in the iExec protocol
- **Withdraw Command**: Check account balance and withdraw RLC from the iExec protocol
- **Beautiful CLI**: Colorful and styled output using chalk for better user experience

## Installation

1. Install dependencies:

```bash
yarn install
```

2. Build the project:

```bash
yarn build
```

## Usage

### Environment Setup

Create a `.env` file in the project root with your private key:

```bash
# Add your private key here (without 0x prefix)
PRIVATE_KEY=your_private_key_here
```

**Note for Frontend Implementation:** In a frontend application, the private key would not be stored in environment variables. Instead, users would connect their wallet using `window.ethereum` (MetaMask, WalletConnect, etc.) and the transactions would be paid for by the user's wallet directly. This CLI version uses a private key for demonstration purposes in a server-side environment.

### Available Commands

#### Subscribe Command

```bash
yarn start subscribe [options]
```

Smart subscription to Web3Telegram or Web3Mail with intelligent protected data management. The command checks for existing protected data and reuses them when possible, avoiding unnecessary resource creation.

**Options:**

- `-s, --service <service>`: Service to subscribe to (telegram or mail)
- `-c, --chat-id <chatId>`: Telegram chat ID to protect (for telegram service)
- `-e, --email <email>`: Email address to protect (for mail service)
- `-p, --price <price>`: Price per access in RLC (default: 0)
- `-n, --access-count <count>`: Number of access (default: unlimited)

**Smart Logic:**
- **Existing Access**: If already subscribed, reuses existing protected data
- **No Access**: If protected data exists without access, grants access to it
- **New Subscription**: Only creates new protected data when none exists

**Examples:**

Interactive mode (will prompt for service selection):

```bash
yarn start subscribe
```

Subscribe to Telegram with command line options:

```bash
yarn start subscribe --service telegram --chat-id "555555555"
```

Subscribe to Mail with command line options:

```bash
yarn start subscribe --service mail --email "user@example.com"
```

With custom pricing:

```bash
yarn start subscribe --service telegram --chat-id "555555555" --price 0.1 --access-count 10
```

### Getting Your Telegram Chat ID

If you choose Telegram service and don't provide a chat ID, the CLI will show you step-by-step instructions:

1. **Open Telegram** and start a conversation with [@IExecWeb3TelegramBot](https://t.me/IExecWeb3TelegramBot)
2. **Send any message** to the bot
3. **The bot will reply** with your unique chat ID
4. **Copy that chat ID** and paste it when prompted

**Note:** The authorized user address is currently hardcoded to `0x346BF25831698B27046F59210505F70F5391A197`.

#### Unsubscribe Command

```bash
yarn start unsubscribe [options]
```

Revoke access from Web3Telegram or Web3Mail services. The command finds all protected data owned by the user and revokes access to the selected service.

**Options:**

- `-s, --service <service>`: Service to unsubscribe from (telegram or mail)

**Process:**
1. **Find Protected Data**: Locates all protected data owned by the user with the correct schema
2. **Check Access**: For each protected data, verifies if it has granted access to the service
3. **Revoke Access**: Revokes all found granted access entries

**Examples:**

Interactive mode (will prompt for service selection):

```bash
yarn start unsubscribe
```

Unsubscribe from specific service:

```bash
yarn start unsubscribe -s telegram
yarn start unsubscribe -s mail
```

#### Send Test Command

```bash
yarn start send-test [options]
```

Send a test message via Web3Telegram or Web3Mail to all your available contacts. The command will prompt you to choose between the two services and send to all contacts you have access to.

**Options:**

- `-s, --service <service>`: Service to send test message via (telegram or mail)
- `-p, --max-price <price>`: Maximum price in RLC (default: 0.1)

**Examples:**

Interactive mode (will prompt for service selection):

```bash
yarn start send-test
```

Send test Telegram message:

```bash
yarn start send-test --service telegram
```

Send test email:

```bash
yarn start send-test --service mail
```

With custom pricing:

```bash
yarn start send-test --service telegram --max-price 0.2
```

**Content Generation:**

- **Telegram**: Automatically generates "RandomApe says hi!" with current UTC timestamp
- **Mail**: Automatically generates email with subject "Test Email from RandomApe" and content with current UTC timestamp

**Bulk Sending:**

- Sends to **all available contacts** you have access to **sequentially**
- Shows real-time progress for each contact (e.g., "Submitting to contact 1/3")
- Provides detailed summary with success/failure counts
- Lists all successful submissions with their Task IDs
- Shows any failed submissions with error messages
- Tracks total elapsed time for the entire submission process
- **Sequential processing** - each submission completes before the next begins

**Performance Features:**

- **Sequential Processing**: Each contact processed one at a time for maximum reliability
- **Reliable Execution**: Each submission completes fully before the next begins
- **Consistent Timing**: Predictable execution time based on individual submission times
- **Error Isolation**: Failures in one submission don't affect others
- **Easy Debugging**: Clear order of operations for troubleshooting

**Prerequisites:** You must run the `subscribe` command first to protect your data and grant access.

#### Deposit Command

```bash
yarn start deposit [options]
```

Check your account balance and deposit RLC in the iExec protocol for running tasks.

**Options:**

- `-a, --amount <amount>`: Amount of RLC to deposit (default: 1)

**Examples:**

Check balance only (no deposit):

```bash
yarn start deposit --amount 0
```

Deposit 1 RLC (default):

```bash
yarn start deposit
```

Deposit custom amount:

```bash
yarn start deposit --amount 5
```

#### Withdraw Command

```bash
yarn start withdraw [options]
```

Check your account balance and withdraw RLC from the iExec protocol back to your wallet.

**Options:**

- `-a, --amount <amount>`: Amount of RLC to withdraw (default: all available)

**Examples:**

Check balance and withdraw all available RLC:

```bash
yarn start withdraw
```

Withdraw specific amount:

```bash
yarn start withdraw --amount 2.5
```

## What the Commands Do

### Subscribe Command

The subscribe command implements a smart subscription flow with intelligent protected data management:

### Service Selection

- Prompts user to choose between Web3Telegram or Web3Mail
- Validates service selection and provides appropriate guidance

### Step 1: Smart Protected Data Management

- **Existing Data Discovery**: Finds all protected data owned by the user with the correct schema
- **Access Verification**: For each protected data, checks if it already has granted access to the service
- **Intelligent Decision Making**:
  - **Already Subscribed**: If access exists, reuses existing protected data (no new creation)
  - **No Access**: If protected data exists without access, grants access to it (reuses data)
  - **New Subscription**: Only creates new protected data when none exists

### Step 2: Conditional Access Authorization

- **Smart Access Granting**: Only grants access when necessary (using conditional logic)
- **Existing Access Detection**: If access already exists, skips the granting step
- **Clear Feedback**: Provides detailed feedback about what action was taken
- Grants access to the selected application:
  - Web3Telegram (`0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89`)
  - Web3Mail (`0xD5054a18565c4a9E5c1aa3cEB53258bd59d4c78C`)
- Authorizes a specific user address to send messages/emails
- Sets pricing and access limits

### Unsubscribe Command

The unsubscribe command implements a comprehensive access revocation flow:

### Service Selection

- Prompts user to choose between Web3Telegram or Web3Mail
- Validates service selection and configures appropriate app address

### Step 1: Protected Data Discovery

- **Find User's Protected Data**: Locates all protected data owned by the user with the correct schema (`telegram_chatId` or `email` + `apebonddata`)
- **Service-Specific Search**: Searches for protected data matching the selected service type
- **Comprehensive Coverage**: Ensures all relevant protected data is found

### Step 2: Access Discovery

- **Individual Access Check**: For each protected data found, calls `getGrantedAccess()` to find all granted access entries
- **Service-Specific Filtering**: Only looks for access to the selected service (Web3Telegram or Web3Mail)
- **Complete Collection**: Gathers all granted access entries from all protected data

### Step 3: Access Revocation

- **Bulk Revocation**: Revokes access for each found granted access entry
- **Individual Processing**: Handles each revocation separately with proper error handling
- **Progress Tracking**: Shows detailed progress for each revocation attempt
- **Comprehensive Summary**: Provides final statistics on successful and failed revocations

### Send Test Command

The send test command implements a unified test message flow for both Web3Telegram and Web3Mail:

### Service Selection

- Prompts user to choose between Web3Telegram or Web3Mail
- Validates service selection and configures appropriate client

### Step 3: Sequential Bulk Message/Email Sending

- Initializes the selected service (Web3Telegram or Web3Mail) with your private key
- Fetches your available contacts (protected data you have access to)
- **Submits test messages/emails to all available contacts sequentially**:
  - **Telegram**: Submits "RandomApe says hi!" with timestamp to each contact
  - **Mail**: Submits email with subject and formatted content to each contact
- **Sequential processing**: Each submission completes before the next begins
- Shows real-time progress for each contact submission
- Handles errors gracefully for individual contacts
- Returns task IDs for tracking all submissions (not deliveries)
- Provides comprehensive summary with success/failure statistics
- Displays pricing and transaction details for all submissions
- Tracks and reports total elapsed time for performance monitoring
- **Reliable execution**: No race conditions or parallel processing conflicts

### Deposit Command

The deposit command manages your iExec account balance:

### Account Management

- Checks your current RLC balance (staked and locked amounts)
- Calculates available balance for operations
- Deposits RLC into your iExec account
- Confirms deposit with updated balance check
- Includes user confirmation before depositing funds

### Withdraw Command

The withdraw command manages RLC withdrawal from your iExec account:

### Withdrawal Management

- Checks your current RLC balance (staked and locked amounts)
- Calculates available balance for withdrawal
- Withdraws RLC from your iExec account back to your wallet
- Supports partial or full withdrawal (default: all available)
- Validates sufficient balance before withdrawal
- Confirms withdrawal with updated balance check
- Includes user confirmation before withdrawing funds
- Handles edge cases (no available balance, insufficient funds)

## Development

### Build

```bash
yarn build
```

### Run in Development Mode

```bash
yarn dev
```

### Clean Build Files

```bash
yarn clean
```

## Dependencies

- `@iexec/dataprotector`: For data protection and access management
- `@iexec/web3telegram`: For Web3Telegram integration
- `@iexec/web3mail`: For Web3Mail integration
- `dotenv`: For environment variable management
- `commander`: For CLI command handling
- `inquirer`: For interactive prompts
- `chalk`: For beautiful colored CLI output
- `graphql`: Peer dependency for GraphQL requests

## Network

The application is configured to work with Arbitrum mainnet (chain ID: 42161).

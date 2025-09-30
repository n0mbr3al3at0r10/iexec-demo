# iExec Demo CLI

A TypeScript CLI demo project that demonstrates Web3Telegram integration using iExec's DataProtector.

## Features

- **Subscribe TG Command**: Web3Telegram subscription with data protection and access authorization
- **Send Test TG Command**: Send test Telegram messages via Web3Telegram
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

#### Subscribe TG Command
```bash
yarn start subscribe-tg [options]
```

Subscribe to Web3Telegram by protecting data and granting access.

**Options:**
- `-c, --chat-id <chatId>`: Telegram chat ID to protect
- `-p, --price <price>`: Price per access in RLC (default: 0)
- `-n, --access-count <count>`: Number of access (default: unlimited)

**Examples:**

Interactive mode (will show instructions for getting chat ID):
```bash
yarn start subscribe-tg
```

With command line options:
```bash
yarn start subscribe-tg --chat-id "555555555"
```

With custom pricing:
```bash
yarn start subscribe-tg --chat-id "555555555" --price 0.1 --access-count 10
```

### Getting Your Telegram Chat ID

If you don't provide a chat ID, the CLI will show you step-by-step instructions:

1. **Open Telegram** and start a conversation with [@IExecWeb3TelegramBot](https://t.me/IExecWeb3TelegramBot)
2. **Send any message** to the bot
3. **The bot will reply** with your unique chat ID
4. **Copy that chat ID** and paste it when prompted

**Note:** The authorized user address is currently hardcoded to `0x346BF25831698B27046F59210505F70F5391A197`.

#### Send Test TG Command
```bash
yarn start send-test-tg [options]
```

Send a test Telegram message via Web3Telegram using your protected data. The message is automatically generated as "RandomApe says hi!" with the current UTC timestamp.

**Options:**
- `-p, --max-price <price>`: Maximum price in RLC (default: 0.1)

**Examples:**

Basic usage:
```bash
yarn start send-test-tg
```

With custom pricing:
```bash
yarn start send-test-tg --max-price 0.2
```

**Prerequisites:** You must run the `subscribe-tg` command first to protect your data and grant access.

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

### Subscribe TG Command

The subscribe-tg command implements two key steps:

### Step 1: Data Protection
- Initializes an Ethereum provider using your private key
- Creates a DataProtector instance
- Protects your Telegram chat ID data on the blockchain

### Step 2: Access Authorization
- Grants access to the Web3Telegram application (`0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89`)
- Authorizes a specific user address to send messages
- Sets pricing and access limits

### Send Test Command

The send test command implements step 3 of the Web3Telegram flow:

### Step 3: Message Sending
- Initializes Web3Telegram with your private key
- Fetches your available contacts (protected data you have access to)
- Sends a test message via Web3Telegram using the first available contact
- Returns the task ID for tracking the message delivery
- Displays pricing and transaction details

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
- `dotenv`: For environment variable management
- `commander`: For CLI command handling
- `inquirer`: For interactive prompts
- `chalk`: For beautiful colored CLI output
- `graphql`: Peer dependency for GraphQL requests

## Network

The application is configured to work with Arbitrum mainnet (chain ID: 42161).

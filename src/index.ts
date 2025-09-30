#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { IExecDataProtectorCore, getWeb3Provider } from "@iexec/dataprotector";
import {
  IExecWeb3telegram,
  getWeb3Provider as getWeb3ProviderWeb3mail,
} from "@iexec/web3telegram";
import { IExec } from "iexec";
import dotenv from "dotenv";
import chalk from "chalk";

// Load environment variables from .env file
dotenv.config();

// * Note: In a frontend implementation, users would connect their wallet via window.ethereum
// * and transactions would be paid directly by the user's wallet, not via a stored private key
const privateKey = process.env.PRIVATE_KEY;
const authorizedUser =
  process.env.AUTHORIZED_USER || "0x346BF25831698B27046F59210505F70F5391A197";
const authorizedAppTelegram =
  process.env.AUTHORIZED_APP_TELEGRAM ||
  "0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89"; // Web3Telegram application address
const authorizedAppMail = process.env.AUTHORIZED_APP_MAIL || ""; // Web3Mail application address

// Common utility functions
const validatePrivateKey = () => {
  if (!privateKey) {
    throw new Error(chalk.red("Error: PRIVATE_KEY not found in the .env file"));
  }
};

const initializeIExec = () => {
  validatePrivateKey();
  const ethProvider = getWeb3Provider(privateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const iexec = new IExec({
    ethProvider,
  });
  return { iexec, ethProvider };
};

const initializeDataProtector = () => {
  validatePrivateKey();
  const ethProvider = getWeb3Provider(privateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const dataProtector = new IExecDataProtectorCore(ethProvider);
  return dataProtector;
};

const initializeWeb3Telegram = () => {
  validatePrivateKey();
  const ethProviderWeb3telegram = getWeb3ProviderWeb3mail(privateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const web3telegram = new IExecWeb3telegram(ethProviderWeb3telegram, {
    dappWhitelistAddress: authorizedAppTelegram,
  });
  return web3telegram;
};

const formatBalance = (balance: any) => {
  const availableBalance =
    BigInt(balance.stake.toString()) - BigInt(balance.locked.toString());
  const availableBalanceRLC = Number(availableBalance) / 1_000_000_000;

  return {
    staked: balance.stake.toString(),
    locked: balance.locked.toString(),
    available: availableBalance.toString(),
    availableRLC: availableBalanceRLC,
  };
};

const displayBalance = (balance: any, label: string = "Account balance") => {
  const formatted = formatBalance(balance);
  console.log(chalk.green(`✅ ${label} retrieved successfully!`));
  console.log(
    chalk.gray(`   Nano RLC staked: ${chalk.cyan(formatted.staked)}`)
  );
  console.log(
    chalk.gray(`   Nano RLC locked: ${chalk.cyan(formatted.locked)}`)
  );
  console.log(
    chalk.gray(
      `   Available balance: ${chalk.cyan(formatted.available)} nano RLC`
    )
  );
  console.log(
    chalk.gray(
      `   Available balance: ${chalk.cyan(
        formatted.availableRLC.toFixed(9)
      )} RLC\n`
    )
  );
};

const handleError = (error: any, context: string) => {
  console.error(chalk.red.bold(`❌ An error occurred during ${context}:`));
  if (error instanceof Error) {
    console.error(chalk.red(`   Message: ${error.message}`));
    if ((error as any).cause) {
      console.error(chalk.red(`   Cause: ${(error as any).cause}`));
    }
    if (error.stack) {
      console.error(chalk.gray(`   Stack: ${error.stack}`));
    }
  } else {
    console.error(chalk.red(`   ${JSON.stringify(error, null, 2)}`));
  }
  process.exit(1);
};

const program = new Command();

program
  .name("iexec-demo")
  .description("A TypeScript CLI demo project")
  .version("1.0.0");

program
  .command("subscribe-tg")
  .description(
    "Subscribe to Web3Telegram by protecting data and granting access"
  )
  .option("-c, --chat-id <chatId>", "Telegram chat ID to protect")
  .option("-p, --price <price>", "Price per access in RLC (default: 0)", "0")
  .option(
    "-n, --access-count <count>",
    "Number of access (default: unlimited)",
    (Number.MAX_SAFE_INTEGER - 1).toString()
  )
  .action(async (options) => {
    try {
      // Get required parameters from options or prompt
      if (!options.chatId) {
        console.log(
          chalk.yellow.bold(
            "\n📱 No chat ID provided. Follow these steps to get your Telegram chat ID:\n"
          )
        );
        console.log(
          chalk.cyan(
            "1. Open Telegram and start a conversation with @IExecWeb3TelegramBot"
          )
        );
        console.log(chalk.cyan("   🔗 https://t.me/IExecWeb3TelegramBot"));
        console.log(chalk.cyan("2. Send any message to the bot"));
        console.log(
          chalk.cyan("3. The bot will reply with your unique chat ID")
        );
        console.log(chalk.cyan("4. Copy that chat ID and paste it below\n"));
      }

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "chatId",
          message: "Enter Telegram chat ID:",
          when: !options.chatId,
          validate: (input: string) => {
            if (input.trim().length === 0) {
              return "Please enter a valid chat ID";
            }
            return true;
          },
        },
      ]);

      const chatId = options.chatId || answers.chatId;
      const pricePerAccess = parseFloat(options.price);
      const numberOfAccess = parseInt(options.accessCount);

      console.log(
        chalk.cyan.bold("\n🚀 Starting Web3Telegram subscription process...\n")
      );

      // --- STEP 1: Data configuration and protection ---
      console.log(chalk.yellow.bold("📝 Step 1: Protecting data..."));

      const dataProtector = initializeDataProtector();

      // Protect the data (Telegram chat ID)
      const protectedData = await dataProtector.protectData({
        name: "web3telegram data",
        data: {
          telegram_chatId: chatId,
        },
      });

      console.log(chalk.green.bold(`✅ Data protected successfully!`));
      console.log(
        chalk.gray(
          `   Protected data address: ${chalk.cyan(protectedData.address)}`
        )
      );
      console.log(chalk.gray(`   Chat ID: ${chalk.cyan(chatId)}\n`));

      // --- STEP 2: Access authorization ---
      console.log(chalk.yellow.bold("🔐 Step 2: Granting access..."));

      // Grant access to the Web3Telegram application and authorized user
      await dataProtector.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: authorizedAppTelegram,
        authorizedUser,
        pricePerAccess,
        numberOfAccess,
      });

      console.log(chalk.green.bold(`✅ Access granted successfully!`));
      console.log(
        chalk.gray(`   Authorized user: ${chalk.cyan(authorizedUser)}`)
      );
      console.log(
        chalk.gray(`   Price per access: ${chalk.cyan(pricePerAccess)} RLC`)
      );
      console.log(
        chalk.gray(`   Number of access: ${chalk.cyan(numberOfAccess)}`)
      );
      console.log(
        chalk.gray(`   App address: ${chalk.cyan(authorizedAppTelegram)}\n`)
      );

      console.log(chalk.green.bold("🎉 Subscription completed successfully!"));
      console.log(
        chalk.blue(
          "   You can now send messages via Web3Telegram using this protected data."
        )
      );
    } catch (error) {
      handleError(error, "subscription");
    }
  });

program
  .command("send-test-tg")
  .description("Send a test Telegram message via Web3Telegram")
  .option(
    "-p, --max-price <price>",
    "Maximum price in nRLC (default: 0.1)",
    "0.1"
  )
  .action(async (options) => {
    try {
      // Generate hardcoded test message with current UTC time
      const currentTime = new Date().toISOString();
      const message = `RandomApe says hi! (${currentTime})`;
      const maxPrice = parseFloat(options.maxPrice);

      console.log(
        chalk.cyan.bold("\n🚀 Starting Web3Telegram test message process...\n")
      );

      // --- STEP 3: Initialization and sending the message via Web3Telegram ---
      console.log(chalk.yellow.bold("📤 Step 3: Sending test message..."));

      const web3telegram = initializeWeb3Telegram();

      // Fetch contacts (protected data to which you have access)
      console.log(chalk.blue("🔍 Fetching your contacts..."));
      const contacts = await web3telegram.fetchMyContacts({
        isUserStrict: true,
      });

      if (contacts.length === 0) {
        throw new Error(
          chalk.red(
            "No contacts available. Ensure you have been granted access to protected data.\n" +
              "Run the 'subscribe' command first to protect your data and grant access."
          )
        );
      }

      console.log(chalk.green(`✅ Found ${contacts.length} contact(s)`));

      // Display all contacts
      console.log(chalk.gray("\n   Available contacts:"));
      contacts.forEach((contact, index) => {
        console.log(
          chalk.gray(`   ${index + 1}. ${chalk.cyan(contact.address)}`)
        );
      });

      console.log(
        chalk.gray(`\n   Using contact: ${chalk.cyan(contacts[0].address)}\n`)
      );

      // Send the Telegram message using the protected data address of the first contact
      console.log(chalk.blue("📨 Sending message via Web3Telegram..."));
      const telegramResult = await web3telegram.sendTelegram({
        telegramContent: message,
        protectedData: contacts[0].address,
        senderName: "RandomApe",
        workerpoolMaxPrice: maxPrice * 1e9, // Convert to nRLC
        // useVoucher: true,
        // workerpoolAddressOrEns: "0x2C06263943180Cc024dAFfeEe15612DB6e5fD248",
      });

      console.log(chalk.green.bold("✅ Test message sent successfully!"));
      console.log(chalk.gray(`   Message: ${chalk.cyan(message)}`));
      console.log(
        chalk.gray(`   Task ID: ${chalk.cyan(telegramResult.taskId)}`)
      );
      console.log(chalk.gray(`   Max price paid: ${chalk.cyan(maxPrice)} RLC`));
      console.log(
        chalk.gray(`   Protected data: ${chalk.cyan(contacts[0].address)}\n`)
      );

      console.log(
        chalk.green.bold("🎉 Web3Telegram test completed successfully!")
      );
      console.log(
        chalk.blue("   Check your Telegram to see the message delivered!")
      );
    } catch (error) {
      handleError(error, "test message");
    }
  });

program
  .command("deposit")
  .description("Check account balance and deposit RLC in the iExec protocol")
  .option("-a, --amount <amount>", "Amount of RLC to deposit (default: 1)")
  .action(async (options) => {
    try {
      const depositAmount = parseFloat(options.amount || "1");
      const depositAmountNano = Math.floor(depositAmount * 1_000_000_000); // Convert to nano RLC

      console.log(
        chalk.cyan.bold(
          "\n💰 Starting iExec account balance check and deposit...\n"
        )
      );

      const { iexec } = initializeIExec();
      const accountAddress = await iexec.wallet.getAddress();

      console.log(chalk.yellow.bold("📊 Step 1: Checking account balance..."));
      console.log(chalk.gray(`   Account: ${chalk.cyan(accountAddress)}\n`));

      // Check your balance
      const balance = await iexec.account.checkBalance(accountAddress);
      displayBalance(balance);

      // Ask for confirmation if depositing
      if (depositAmount > 0) {
        console.log(
          chalk.yellow.bold(`💰 Step 2: Depositing ${depositAmount} RLC...`)
        );
        console.log(
          chalk.gray(`   Amount to deposit: ${chalk.cyan(depositAmount)} RLC`)
        );
        console.log(
          chalk.gray(
            `   Amount in nano RLC: ${chalk.cyan(depositAmountNano)} nano RLC\n`
          )
        );

        const answers = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `Are you sure you want to deposit ${depositAmount} RLC?`,
            default: false,
          },
        ]);

        if (!answers.confirm) {
          console.log(chalk.yellow("❌ Deposit cancelled by user."));
          return;
        }

        console.log(chalk.blue("🔒 Depositing RLC in your account..."));

        // Lock RLC in your account in the iExec protocol
        await iexec.account.deposit(depositAmountNano);

        console.log(chalk.green.bold("✅ RLC deposited successfully!"));
        console.log(
          chalk.gray(`   Deposited: ${chalk.cyan(depositAmount)} RLC`)
        );
        console.log(chalk.gray(`   Transaction completed\n`));

        // Check balance again to confirm
        console.log(
          chalk.yellow.bold("📊 Step 3: Checking updated balance...")
        );
        const updatedBalance = await iexec.account.checkBalance(accountAddress);
        displayBalance(updatedBalance, "Updated account balance");
      }

      console.log(
        chalk.green.bold("🎉 Account balance check completed successfully!")
      );
      console.log(
        chalk.blue("   Your RLC is now available for iExec operations.")
      );
    } catch (error) {
      handleError(error, "deposit");
    }
  });

program
  .command("withdraw")
  .description("Check account balance and withdraw RLC from the iExec protocol")
  .option(
    "-a, --amount <amount>",
    "Amount of RLC to withdraw (default: all available)"
  )
  .action(async (options) => {
    try {
      console.log(
        chalk.cyan.bold(
          "\n💰 Starting iExec account balance check and withdraw...\n"
        )
      );

      const { iexec } = initializeIExec();
      const accountAddress = await iexec.wallet.getAddress();

      console.log(chalk.yellow.bold("📊 Step 1: Checking account balance..."));
      console.log(chalk.gray(`   Account: ${chalk.cyan(accountAddress)}\n`));

      // Check your balance
      const balance = await iexec.account.checkBalance(accountAddress);
      const formatted = formatBalance(balance);

      displayBalance(balance);

      if (BigInt(formatted.available) === 0n) {
        console.log(chalk.yellow("⚠️  No available balance to withdraw."));
        console.log(
          chalk.blue("   All your RLC is currently locked in tasks.")
        );
        return;
      }

      // Determine withdrawal amount
      let withdrawAmount: number;
      let withdrawAmountNano: bigint;

      if (options.amount) {
        withdrawAmount = parseFloat(options.amount);
        withdrawAmountNano = BigInt(Math.floor(withdrawAmount * 1_000_000_000));

        if (withdrawAmountNano > BigInt(formatted.available)) {
          throw new Error(
            chalk.red(
              `Insufficient balance. Available: ${formatted.availableRLC.toFixed(
                9
              )} RLC, Requested: ${withdrawAmount} RLC`
            )
          );
        }
      } else {
        // Withdraw all available
        withdrawAmountNano = BigInt(formatted.available);
        withdrawAmount = formatted.availableRLC;
      }

      console.log(
        chalk.yellow.bold(
          `💰 Step 2: Withdrawing ${withdrawAmount.toFixed(9)} RLC...`
        )
      );
      console.log(
        chalk.gray(
          `   Amount to withdraw: ${chalk.cyan(withdrawAmount.toFixed(9))} RLC`
        )
      );
      console.log(
        chalk.gray(
          `   Amount in nano RLC: ${chalk.cyan(
            withdrawAmountNano.toString()
          )} nano RLC\n`
        )
      );

      const answers = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to withdraw ${withdrawAmount.toFixed(
            9
          )} RLC?`,
          default: false,
        },
      ]);

      if (!answers.confirm) {
        console.log(chalk.yellow("❌ Withdrawal cancelled by user."));
        return;
      }

      console.log(chalk.blue("🔓 Withdrawing RLC from your account..."));

      // Withdraw RLC from your account in the iExec protocol
      await iexec.account.withdraw(withdrawAmountNano.toString());

      console.log(chalk.green.bold("✅ RLC withdrawn successfully!"));
      console.log(
        chalk.gray(`   Withdrawn: ${chalk.cyan(withdrawAmount.toFixed(9))} RLC`)
      );
      console.log(chalk.gray(`   Transaction completed\n`));

      // Check balance again to confirm
      console.log(chalk.yellow.bold("📊 Step 3: Checking updated balance..."));
      const updatedBalance = await iexec.account.checkBalance(accountAddress);
      displayBalance(updatedBalance, "Updated account balance");

      console.log(chalk.green.bold("🎉 Withdrawal completed successfully!"));
      console.log(
        chalk.blue("   Your RLC has been withdrawn from the iExec protocol.")
      );
    } catch (error) {
      handleError(error, "withdrawal");
    }
  });

program.parse();

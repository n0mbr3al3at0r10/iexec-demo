#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import {
  GrantedAccess,
  IExecDataProtectorCore,
  getWeb3Provider,
} from "@iexec/dataprotector";
import { IExecWeb3telegram } from "@iexec/web3telegram";
import { IExecWeb3mail } from "@iexec/web3mail";
import { IExec } from "iexec";
import dotenv from "dotenv";
import chalk from "chalk";

// Load environment variables from .env file
dotenv.config();

// * Note: In a frontend implementation, users would connect their wallet via window.ethereum
// * and transactions would be paid directly by the user's wallet, not via a stored private key
const privateKey = process.env.PRIVATE_KEY;
const userPrivateKey = process.env.USER_PRIVATE_KEY;
const userAddress = process.env.USER_ADDRESS;
const authorizedUser =
  process.env.AUTHORIZED_USER || "0x9e6AFcB1462997c867F5755d4E533E8917d347Af";
const authorizedAppTelegram =
  process.env.AUTHORIZED_APP_TELEGRAM ||
  "0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89"; // Web3Telegram application address
const authorizedAppMail =
  process.env.AUTHORIZED_APP_MAIL ||
  "0xD5054a18565c4a9E5c1aa3cEB53258bd59d4c78C"; // Web3Mail application address

// Common utility functions
const validatePrivateKey = (privateKey: string) => {
  if (!privateKey) {
    throw new Error(chalk.red("Error: PRIVATE_KEY not found in the .env file"));
  }
};

const initializeIExec = () => {
  validatePrivateKey(userPrivateKey!);
  const ethProvider = getWeb3Provider(userPrivateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const iexec = new IExec({
    ethProvider,
  });
  return { iexec, ethProvider };
};

const initializeDataProtector = () => {
  validatePrivateKey(userPrivateKey!);
  const ethProvider = getWeb3Provider(userPrivateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const dataProtector = new IExecDataProtectorCore(ethProvider);
  return dataProtector;
};

const initializeWeb3Telegram = () => {
  validatePrivateKey(privateKey!);
  const ethProviderWeb3telegram = getWeb3Provider(privateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const web3telegram = new IExecWeb3telegram(ethProviderWeb3telegram, {
    dappWhitelistAddress: authorizedAppTelegram,
  });
  return web3telegram;
};

const initializeWeb3Mail = () => {
  validatePrivateKey(privateKey!);
  const ethProviderWeb3mail = getWeb3Provider(privateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const web3mail = new IExecWeb3mail(ethProviderWeb3mail, {
    dappWhitelistAddress: authorizedAppMail,
  });
  return web3mail;
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
  .command("subscribe")
  .description(
    "Subscribe to Web3Telegram or Web3Mail by protecting data and granting access"
  )
  .option(
    "-s, --service <service>",
    "Service to subscribe to (telegram or mail)"
  )
  .option(
    "-c, --chat-id <chatId>",
    "Telegram chat ID to protect (for telegram service)"
  )
  .option("-e, --email <email>", "Email address to protect (for mail service)")
  .option("-p, --price <price>", "Price per access in RLC (default: 0)", "0")
  .option(
    "-n, --access-count <count>",
    "Number of access (default: unlimited)",
    (Number.MAX_SAFE_INTEGER - 1).toString()
  )
  .action(async (options) => {
    try {
      // Service selection
      let selectedService = options.service;
      if (!selectedService) {
        const serviceAnswer = await inquirer.prompt([
          {
            type: "list",
            name: "service",
            message: "Which service would you like to subscribe to?",
            choices: [
              { name: "📱 Web3Telegram", value: "telegram" },
              { name: "📧 Web3Mail", value: "mail" },
            ],
          },
        ]);
        selectedService = serviceAnswer.service;
      }

      // Validate service selection
      if (!["telegram", "mail"].includes(selectedService)) {
        throw new Error("Invalid service. Please choose 'telegram' or 'mail'");
      }

      let protectedDataInput: string;
      let serviceName: string;
      let appAddress: string;
      let dataName: string;
      let dataKey: string;

      if (selectedService === "telegram") {
        serviceName = "Web3Telegram";
        appAddress = authorizedAppTelegram;
        dataName = "web3telegram data";
        dataKey = "telegram_chatId";

        // Get Telegram chat ID
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

        const telegramAnswer = await inquirer.prompt([
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

        protectedDataInput = options.chatId || telegramAnswer.chatId;
      } else {
        serviceName = "Web3Mail";
        appAddress = authorizedAppMail;
        dataName = "web3mail data";
        dataKey = "email";

        // Get email address
        if (!options.email) {
          console.log(
            chalk.yellow.bold(
              "\n📧 No email provided. Please enter your email address:\n"
            )
          );
        }

        const emailAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "email",
            message: "Enter email address:",
            when: !options.email,
            validate: (input: string) => {
              if (input.trim().length === 0) {
                return "Please enter a valid email address";
              }
              // Basic email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(input.trim())) {
                return "Please enter a valid email address format";
              }
              return true;
            },
          },
        ]);

        protectedDataInput = options.email || emailAnswer.email;
      }

      const pricePerAccess = parseFloat(options.price);
      const numberOfAccess = parseInt(options.accessCount);

      console.log(
        chalk.cyan.bold(
          `\n🚀 Starting ${serviceName} subscription process...\n`
        )
      );

      // --- STEP 1: Check existing protected data and access ---
      console.log(
        chalk.yellow.bold(
          "🔍 Step 1: Checking existing protected data and access..."
        )
      );

      const dataProtector = initializeDataProtector();

      // Get all protected data owned by the user with the correct schema
      const protectedDataList = await dataProtector.getProtectedData({
        owner: userAddress,
        requiredSchema: {
          [dataKey]: "string",
          apebonddata: "string",
        },
      });

      console.log(
        chalk.blue(
          `   Found ${protectedDataList.length} existing protected data for ${serviceName}`
        )
      );

      let protectedDataAddress: string = "";
      let shouldGrantAccess = true;

      if (protectedDataList.length > 0) {
        // Check if any of the existing protected data already has access to this service
        console.log(
          chalk.yellow.bold("\n🔍 Step 1.1: Checking existing access...")
        );

        let foundExistingAccess = false;
        for (let i = 0; i < protectedDataList.length; i++) {
          const protectedData = protectedDataList[i];
          console.log(
            chalk.blue(
              `   🔍 Checking access for protected data ${i + 1}/${
                protectedDataList.length
              }: ${chalk.cyan(protectedData.address)}`
            )
          );

          try {
            const grantedAccessResponse = await dataProtector.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: appAddress,
              authorizedUser,
              isUserStrict: true,
            });

            const grantedAccess = grantedAccessResponse.grantedAccess || [];
            if (grantedAccess.length > 0) {
              console.log(
                chalk.green(
                  `   ✅ Found existing access for this protected data`
                )
              );
              foundExistingAccess = true;
              protectedDataAddress = protectedData.address;
              shouldGrantAccess = false;
              break;
            } else {
              console.log(
                chalk.blue(`   ℹ️  No access found for this protected data`)
              );
            }
          } catch (error) {
            console.log(
              chalk.red(
                `   ❌ Failed to check access for ${protectedData.address}`
              )
            );
            if (error instanceof Error) {
              console.log(chalk.red(`   Error: ${error.message}`));
            }
          }
        }

        if (foundExistingAccess) {
          console.log(
            chalk.green.bold(`✅ Already subscribed to ${serviceName}!`)
          );
          console.log(
            chalk.blue(
              `   Using existing protected data: ${chalk.cyan(
                protectedDataAddress
              )}`
            )
          );
        } else {
          // No existing access found, use the first available protected data
          protectedDataAddress = protectedDataList[0].address;
          console.log(
            chalk.green(`✅ Using existing protected data without access`)
          );
          console.log(
            chalk.blue(
              `   Protected data address: ${chalk.cyan(protectedDataAddress)}`
            )
          );
        }
      } else {
        // No protected data found, create a new one
        console.log(
          chalk.yellow.bold("\n🔒 Step 1.2: Creating new protected data...")
        );

        const newProtectedData = await dataProtector.protectData({
          name: dataName,
          data: {
            [dataKey]: protectedDataInput,
            apebonddata: "apebond",
          },
        });

        protectedDataAddress = newProtectedData.address;
        console.log(
          chalk.green(
            `✅ New protected data created! Address: ${chalk.cyan(
              protectedDataAddress
            )}`
          )
        );
        console.log(
          chalk.gray(
            `   ${
              dataKey === "telegram_chatId" ? "Chat ID" : "Email"
            }: ${chalk.cyan(protectedDataInput)}`
          )
        );
      }

      // --- STEP 2: Access authorization ---
      if (shouldGrantAccess) {
        console.log(chalk.yellow.bold("🔐 Step 2: Granting access..."));

        // Grant access to the application and authorized user
        await dataProtector.grantAccess({
          protectedData: protectedDataAddress,
          authorizedApp: appAddress,
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
        console.log(chalk.gray(`   App address: ${chalk.cyan(appAddress)}\n`));
      } else {
        console.log(chalk.yellow.bold("🔐 Step 2: Access already granted"));
        console.log(
          chalk.blue(`   Access was already granted for this protected data.`)
        );
        console.log(
          chalk.gray(`   Protected data: ${chalk.cyan(protectedDataAddress)}\n`)
        );
      }

      console.log(chalk.green.bold("🎉 Subscription completed successfully!"));
      console.log(
        chalk.blue(
          `   You can now send ${
            dataKey === "telegram_chatId" ? "messages" : "emails"
          } via ${serviceName} using this protected data.`
        )
      );
    } catch (error) {
      handleError(error, "subscription");
    }
  });

program
  .command("send-test")
  .description("Send a test message via Web3Telegram or Web3Mail")
  .option(
    "-s, --service <service>",
    "Service to send test message via (telegram or mail)"
  )
  .option(
    "-p, --max-price <price>",
    "Maximum price in nRLC (default: 0.1)",
    "0.1"
  )
  .action(async (options) => {
    try {
      // Service selection
      let selectedService = options.service;
      if (!selectedService) {
        const serviceAnswer = await inquirer.prompt([
          {
            type: "list",
            name: "service",
            message: "Which service would you like to send a test message via?",
            choices: [
              { name: "📱 Web3Telegram", value: "telegram" },
              { name: "📧 Web3Mail", value: "mail" },
            ],
          },
        ]);
        selectedService = serviceAnswer.service;
      }

      // Validate service selection
      if (!["telegram", "mail"].includes(selectedService)) {
        throw new Error("Invalid service. Please choose 'telegram' or 'mail'");
      }

      const currentTime = new Date().toISOString();
      const maxPrice = parseFloat(options.maxPrice);

      let serviceName: string;
      let content: any;
      let web3Client: IExecWeb3mail | IExecWeb3telegram;

      if (selectedService === "telegram") {
        serviceName = "Web3Telegram";
        content = `RandomApe says hi! (${currentTime})`;
        web3Client = initializeWeb3Telegram();
      } else {
        serviceName = "Web3Mail";
        content = {
          subject: `Test Email from RandomApe (${currentTime})`,
          content: `Hello from RandomApe!\n\nThis is a test email sent via Web3Mail.\n\nTimestamp: ${currentTime}\n\nBest regards,\nRandomApe`,
        };
        web3Client = initializeWeb3Mail();
      }

      console.log(
        chalk.cyan.bold(
          `\n🚀 Starting ${serviceName} test ${
            selectedService === "telegram" ? "message" : "email"
          } process...\n`
        )
      );

      // --- STEP 3: Initialization and sending via selected service ---
      console.log(
        chalk.yellow.bold(
          `📤 Step 3: Sending test ${
            selectedService === "telegram" ? "message" : "email"
          }...`
        )
      );

      // Fetch contacts (protected data to which you have access)
      console.log(chalk.blue("🔍 Fetching your contacts..."));
      const contacts = await web3Client.fetchMyContacts({
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
      contacts.forEach((contact: any, index: number) => {
        console.log(
          chalk.gray(`   ${index + 1}. ${chalk.cyan(contact.address)}`)
        );
      });

      console.log(
        chalk.gray(
          `\n   Sending to ${chalk.cyan(contacts.length)} contact(s)...\n`
        )
      );

      // Start timer
      const startTime = Date.now();

      // Send the message/email to all contacts
      const results: any[] = [];
      let successCount = 0;
      let errorCount = 0;
      const sendTimes: number[] = [];

      // Send messages sequentially (one at a time)
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const sendStartTime = Date.now();

        try {
          console.log(
            chalk.blue(
              `📤 Submitting to contact ${i + 1}/${
                contacts.length
              }: ${chalk.cyan(contact.address)}`
            )
          );

          let result: any;
          // if (selectedService === "telegram") {
          //   result = await (web3Client as IExecWeb3telegram).sendTelegram({
          //     telegramContent: content,
          //     protectedData: contact.address,
          //     senderName: "RandomApe",
          //     workerpoolMaxPrice: maxPrice * 1e9, // Convert to nRLC
          //   });
          // } else {
          //   result = await (web3Client as IExecWeb3mail).sendEmail({
          //     emailSubject: content.subject,
          //     emailContent: content.content,
          //     protectedData: contact.address,
          //     contentType: "text/plain", // text/html is also supported
          //     senderName: "RandomApe",
          //     workerpoolMaxPrice: maxPrice * 1e9, // Convert to nRLC
          //   });
          // }

          const sendEndTime = Date.now();
          const sendDuration = sendEndTime - sendStartTime;
          const sendDurationSeconds = (sendDuration / 1000).toFixed(2);
          sendTimes.push(sendDuration);

          results.push({
            contact: contact.address,
            taskId: result.taskId,
            success: true,
            error: null,
            sendTime: sendDuration,
          });
          successCount++;

          console.log(
            chalk.green(
              `   ✅ Submitted successfully! Task ID: ${chalk.cyan(
                result.taskId
              )} (${sendDurationSeconds}s)`
            )
          );
        } catch (error) {
          const sendEndTime = Date.now();
          const sendDuration = sendEndTime - sendStartTime;
          sendTimes.push(sendDuration);

          console.log(
            chalk.red(
              `   ❌ Failed to submit to ${contact.address} (${(
                sendDuration / 1000
              ).toFixed(2)}s)`
            )
          );
          if (error instanceof Error) {
            console.log(chalk.red(`   Error: ${error.message}`));
          }

          results.push({
            contact: contact.address,
            taskId: null,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            sendTime: sendDuration,
          });
          errorCount++;
        }
      }

      // Calculate elapsed time and timing statistics
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      const elapsedSeconds = (elapsedTime / 1000).toFixed(2);

      // Calculate timing statistics
      const avgSendTime =
        sendTimes.length > 0
          ? sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length
          : 0;
      const minSendTime = sendTimes.length > 0 ? Math.min(...sendTimes) : 0;
      const maxSendTime = sendTimes.length > 0 ? Math.max(...sendTimes) : 0;
      const avgSendTimeSeconds = (avgSendTime / 1000).toFixed(2);
      const minSendTimeSeconds = (minSendTime / 1000).toFixed(2);
      const maxSendTimeSeconds = (maxSendTime / 1000).toFixed(2);

      // Summary of results
      console.log(
        chalk.green.bold(
          `\n✅ Test ${
            selectedService === "telegram" ? "messages" : "emails"
          } submission completed!`
        )
      );
      console.log(
        chalk.gray(`   Total contacts: ${chalk.cyan(contacts.length)}`)
      );
      console.log(
        chalk.green(`   Successful submissions: ${chalk.cyan(successCount)}`)
      );
      if (errorCount > 0) {
        console.log(
          chalk.red(`   Failed submissions: ${chalk.cyan(errorCount)}`)
        );
      }
      console.log(
        chalk.gray(
          `   Total submission time: ${chalk.cyan(elapsedSeconds)} seconds`
        )
      );
      console.log(
        chalk.gray(
          `   Average submission time: ${chalk.cyan(
            avgSendTimeSeconds
          )} seconds`
        )
      );
      console.log(
        chalk.gray(
          `   Fastest submission: ${chalk.cyan(minSendTimeSeconds)} seconds`
        )
      );
      console.log(
        chalk.gray(
          `   Slowest submission: ${chalk.cyan(maxSendTimeSeconds)} seconds`
        )
      );

      if (selectedService === "telegram") {
        console.log(chalk.gray(`   Message: ${chalk.cyan(content)}`));
      } else {
        console.log(chalk.gray(`   Subject: ${chalk.cyan(content.subject)}`));
        console.log(chalk.gray(`   Content: ${chalk.cyan(content.content)}`));
      }
      console.log(
        chalk.gray(`   Max price per send: ${chalk.cyan(maxPrice)} RLC`)
      );

      // Show detailed results
      if (successCount > 0) {
        console.log(chalk.gray(`\n   📋 Successful submissions:`));
        results
          .filter((r) => r.success)
          .forEach((result, index) => {
            const sendTimeSeconds = (result.sendTime / 1000).toFixed(2);
            console.log(
              chalk.gray(
                `   ${index + 1}. ${chalk.cyan(
                  result.contact
                )} - Task ID: ${chalk.cyan(
                  result.taskId
                )} (${sendTimeSeconds}s)`
              )
            );
          });
      }

      if (errorCount > 0) {
        console.log(chalk.gray(`\n   ❌ Failed submissions:`));
        results
          .filter((r) => !r.success)
          .forEach((result, index) => {
            const sendTimeSeconds = (result.sendTime / 1000).toFixed(2);
            console.log(
              chalk.gray(
                `   ${index + 1}. ${chalk.cyan(
                  result.contact
                )} - Error: ${chalk.red(result.error)} (${sendTimeSeconds}s)`
              )
            );
          });
      }

      console.log(
        chalk.green.bold(`\n🎉 ${serviceName} test submissions completed!`)
      );
      console.log(
        chalk.blue(
          `   Messages submitted to blockchain. Check your ${
            selectedService === "telegram" ? "Telegram" : "email"
          } in a few minutes to see the ${
            selectedService === "telegram" ? "messages" : "emails"
          } delivered!`
        )
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

program
  .command("unsubscribe")
  .description("Revoke access to protected data (unsubscribe from a service)")
  .option(
    "-s, --service <service>",
    "Service to unsubscribe from (telegram or mail)"
  )
  .action(async (options) => {
    try {
      const dataProtector = initializeDataProtector();

      console.log(chalk.cyan.bold("\n🚪 Starting unsubscribe process...\n"));

      // Service selection
      let selectedService = options.service;
      if (!selectedService) {
        const serviceAnswer = await inquirer.prompt([
          {
            type: "list",
            name: "service",
            message: "Which service would you like to unsubscribe from?",
            choices: [
              { name: "📱 Web3Telegram", value: "telegram" },
              { name: "📧 Web3Mail", value: "mail" },
            ],
          },
        ]);
        selectedService = serviceAnswer.service;
      }

      // Validate service selection
      if (!["telegram", "mail"].includes(selectedService)) {
        throw new Error("Invalid service. Please choose 'telegram' or 'mail'");
      }

      const serviceName =
        selectedService === "telegram" ? "Web3Telegram" : "Web3Mail";
      const authorizedApp =
        selectedService === "telegram"
          ? authorizedAppTelegram
          : authorizedAppMail;

      console.log(
        chalk.yellow.bold(
          `📋 Step 1: Getting protected data for ${serviceName}...`
        )
      );

      try {
        // First, get all protected data owned by the user with apebonddata schema
        const dataKey =
          selectedService === "telegram" ? "telegram_chatId" : "email";
        const protectedDataList = await dataProtector.getProtectedData({
          owner: userAddress,
          requiredSchema: {
            [dataKey]: "string",
            apebonddata: "string",
          },
        });

        if (protectedDataList.length === 0) {
          console.log(
            chalk.blue(`   ℹ️  No protected data found for ${serviceName}`)
          );
          console.log(chalk.green.bold("\n🎉 Unsubscribe process completed!"));
          console.log(chalk.blue("   No protected data was found."));
          return;
        }

        console.log(
          chalk.green(
            `   ✅ Found ${protectedDataList.length} protected data for ${serviceName}`
          )
        );

        console.log(
          chalk.yellow.bold(
            `\n📋 Step 2: Checking granted access for each protected data...`
          )
        );

        // Get all granted access for each protected data
        let allGrantedAccess: GrantedAccess[] = [];
        for (let i = 0; i < protectedDataList.length; i++) {
          const protectedData = protectedDataList[i];
          console.log(
            chalk.blue(
              `   🔍 Checking access for protected data ${i + 1}/${
                protectedDataList.length
              }: ${chalk.cyan(protectedData.address)}`
            )
          );

          try {
            const grantedAccessResponse = await dataProtector.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp,
              authorizedUser,
              isUserStrict: true,
            });

            const grantedAccess = grantedAccessResponse.grantedAccess || [];
            if (grantedAccess.length > 0) {
              console.log(
                chalk.green(
                  `   ✅ Found ${grantedAccess.length} access(es) for this protected data`
                )
              );
              allGrantedAccess = allGrantedAccess.concat(grantedAccess);
            } else {
              console.log(
                chalk.blue(`   ℹ️  No access found for this protected data`)
              );
            }
          } catch (error) {
            console.log(
              chalk.red(
                `   ❌ Failed to get granted access for ${protectedData.address}`
              )
            );
            if (error instanceof Error) {
              console.log(chalk.red(`   Error: ${error.message}`));
            }
          }
        }

        if (allGrantedAccess.length === 0) {
          console.log(
            chalk.blue(`   ℹ️  No granted access found for any protected data`)
          );
          console.log(chalk.green.bold("\n🎉 Unsubscribe process completed!"));
          console.log(chalk.blue("   No access was found to revoke."));
          return;
        }

        console.log(
          chalk.green(
            `   ✅ Found ${allGrantedAccess.length} total granted access(es) for ${serviceName}`
          )
        );

        console.log(
          chalk.yellow.bold(
            `\n🔓 Step 3: Revoking access for ${serviceName}...`
          )
        );

        let totalRevoked = 0;

        // Revoke access for each granted access entry
        for (let i = 0; i < allGrantedAccess.length; i++) {
          const grantedAccess = allGrantedAccess[i];
          const dataset = grantedAccess.dataset; // aka protectedData address

          console.log(
            chalk.blue(
              `   🔓 Revoking access ${i + 1}/${
                allGrantedAccess.length
              }: ${chalk.cyan(dataset)}`
            )
          );

          try {
            await dataProtector.revokeAllAccess({
              protectedData: dataset,
              authorizedApp,
              authorizedUser,
            });

            console.log(
              chalk.green(`   ✅ Successfully revoked access to ${dataset}`)
            );
            totalRevoked++;
          } catch (error) {
            console.log(
              chalk.red(`   ❌ Failed to revoke access to ${dataset}`)
            );
            if (error instanceof Error) {
              console.log(chalk.red(`   Error: ${error.message}`));
            }
          }
        }

        console.log(chalk.green.bold("\n🎉 Unsubscribe process completed!"));
        if (totalRevoked > 0) {
          console.log(
            chalk.blue(
              `   Successfully revoked access to ${totalRevoked} protected data`
            )
          );
          console.log(
            chalk.blue(`   You are now unsubscribed from ${serviceName}.`)
          );
        } else {
          console.log(chalk.blue("   No access was found to revoke."));
        }
      } catch (error) {
        console.log(
          chalk.red(`   ❌ Failed to get granted access for ${serviceName}`)
        );
        if (error instanceof Error) {
          console.log(chalk.red(`   Error: ${error.message}`));
        }
      }
    } catch (error) {
      handleError(error, "unsubscribe");
    }
  });

program.parse();

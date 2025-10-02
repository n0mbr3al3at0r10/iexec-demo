#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { IExecDataProtectorCore, getWeb3Provider } from "@iexec/dataprotector";
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
const authorizedUser =
  process.env.AUTHORIZED_USER || "0x346BF25831698B27046F59210505F70F5391A197";
const authorizedAppTelegram =
  process.env.AUTHORIZED_APP_TELEGRAM ||
  "0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89"; // Web3Telegram application address
const authorizedAppMail =
  process.env.AUTHORIZED_APP_MAIL ||
  "0xD5054a18565c4a9E5c1aa3cEB53258bd59d4c78C"; // Web3Mail application address

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
  const ethProviderWeb3telegram = getWeb3Provider(privateKey!, {
    host: 42161, // Arbitrum mainnet
  });
  const web3telegram = new IExecWeb3telegram(ethProviderWeb3telegram, {
    dappWhitelistAddress: authorizedAppTelegram,
  });
  return web3telegram;
};

const initializeWeb3Mail = () => {
  validatePrivateKey();
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

      // --- STEP 1: Data configuration and protection ---
      console.log(chalk.yellow.bold("📝 Step 1: Protecting data..."));

      const dataProtector = initializeDataProtector();

      // Protect the data
      const protectedData = await dataProtector.protectData({
        name: dataName,
        data: {
          [dataKey]: protectedDataInput,
        },
      });

      console.log(chalk.green.bold(`✅ Data protected successfully!`));
      console.log(
        chalk.gray(
          `   Protected data address: ${chalk.cyan(protectedData.address)}`
        )
      );
      console.log(
        chalk.gray(
          `   ${
            dataKey === "telegram_chatId" ? "Chat ID" : "Email"
          }: ${chalk.cyan(protectedDataInput)}\n`
        )
      );

      // --- STEP 2: Access authorization ---
      console.log(chalk.yellow.bold("🔐 Step 2: Granting access..."));

      // Grant access to the application and authorized user
      await dataProtector.grantAccess({
        protectedData: protectedData.address,
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

      // Create timeout promise (1 minute)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout after 60 seconds")), 60000);
      });

      // Send all messages in parallel (fire-and-forget with timeout)
      const sendPromises = contacts.map((contact, index) => {
        const sendStartTime = Date.now();

        console.log(
          chalk.blue(
            `📤 Submitting to contact ${index + 1}/${
              contacts.length
            }: ${chalk.cyan(contact.address)}`
          )
        );

        // Create the send promise without awaiting it
        const sendPromise = (async () => {
          try {
            let result: any;
            if (selectedService === "telegram") {
              result = await (web3Client as IExecWeb3telegram).sendTelegram({
                telegramContent: content,
                protectedData: contact.address,
                senderName: "RandomApe",
                workerpoolMaxPrice: maxPrice * 1e9, // Convert to nRLC
              });
            } else {
              result = await (web3Client as IExecWeb3mail).sendEmail({
                emailSubject: content.subject,
                emailContent: content.content,
                protectedData: contact.address,
                contentType: "text/plain", // text/html is also supported
                senderName: "RandomApe",
                workerpoolMaxPrice: maxPrice * 1e9, // Convert to nRLC
              });
            }

            const sendEndTime = Date.now();
            const sendDuration = sendEndTime - sendStartTime;
            const sendDurationSeconds = (sendDuration / 1000).toFixed(2);
            sendTimes.push(sendDuration);

            console.log(
              chalk.green(
                `   ✅ Submitted successfully! Task ID: ${chalk.cyan(
                  result.taskId
                )} (${sendDurationSeconds}s)`
              )
            );

            return {
              contact: contact.address,
              taskId: result.taskId,
              success: true,
              error: null,
              sendTime: sendDuration,
            };
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
            if ((error as any).cause) {
              console.log(chalk.red(`   Cause: ${(error as any).cause}`));
            }
            if (error instanceof Error) {
              console.log(chalk.red(`   Error: ${error.message}`));
            }

            return {
              contact: contact.address,
              taskId: null,
              success: false,
              error: (error as any).cause
                ? `Cause: ${(error as any).cause} Error: ${
                    (error as any).message
                  }`
                : error instanceof Error
                ? error.message
                : String(error),
              sendTime: sendDuration,
            };
          }
        })();

        // Return the send promise
        return sendPromise;
      });

      // Race between all submissions and timeout
      try {
        const sendResults = (await Promise.race([
          Promise.allSettled(sendPromises),
          timeoutPromise,
        ])) as PromiseSettledResult<any>[];

        // Process results from Promise.allSettled
        sendResults.forEach((result) => {
          if (result.status === "fulfilled") {
            results.push(result.value);
            if (result.value.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            // This shouldn't happen with allSettled, but handle it just in case
            errorCount++;
            results.push({
              contact: "unknown",
              taskId: null,
              success: false,
              error: result.reason?.message || "Unknown error",
              sendTime: 0,
            });
          }
        });
      } catch (timeoutError) {
        // Timeout occurred - handle partial results
        console.log(
          chalk.yellow(
            `\n⚠️  Timeout after 60 seconds. Some submissions may still be in progress.`
          )
        );

        // Try to get any results that completed before timeout
        const settledResults = await Promise.allSettled(sendPromises);
        settledResults.forEach((result: any) => {
          if (result.status === "fulfilled") {
            results.push(result.value);
            if (result.value.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            errorCount++;
            results.push({
              contact: "unknown",
              taskId: null,
              success: false,
              error: "Timeout - submission may still be in progress",
              sendTime: 60000, // 60 seconds
            });
          }
        });
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

program.parse();

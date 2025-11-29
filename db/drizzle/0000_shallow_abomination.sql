CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`bankName` text NOT NULL,
	`accountNo` text NOT NULL,
	`upiLimit` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `accounts_idx` ON `accounts` (`accountNo`,`bankName`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_accountNo_bankName_unique` ON `accounts` (`accountNo`,`bankName`);--> statement-breakpoint
CREATE TABLE `banks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`receiver` text NOT NULL,
	`reference` text NOT NULL,
	`date` text NOT NULL,
	`bankName` text NOT NULL,
	`timestamp` integer NOT NULL,
	`accountNo` text NOT NULL,
	`rawMessage` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transactions_idx` ON `transactions` (`bankName`,`accountNo`);
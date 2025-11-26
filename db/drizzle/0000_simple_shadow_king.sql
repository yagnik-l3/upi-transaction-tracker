CREATE TABLE `accounts_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`bankId` integer NOT NULL,
	`upiLimit` real NOT NULL,
	FOREIGN KEY (`bankId`) REFERENCES `banks_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `banks_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`accountId` integer NOT NULL,
	`amount` real NOT NULL,
	`receiver` text NOT NULL,
	`reference` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts_table`(`id`) ON UPDATE no action ON DELETE no action
);

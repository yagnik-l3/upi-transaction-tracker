CREATE TABLE `settings_table` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `key` text NOT NULL,
    `value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_table_key_unique` ON `settings_table` (`key`);
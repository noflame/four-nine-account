CREATE TABLE `ledger_users` (
	`ledger_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`last_accessed_at` integer,
	PRIMARY KEY(`ledger_id`, `user_id`),
	FOREIGN KEY (`ledger_id`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ledgers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`password_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE accounts ADD `ledger_id` integer REFERENCES ledgers(id);--> statement-breakpoint
ALTER TABLE accounts ADD `is_private` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE categories ADD `ledger_id` integer REFERENCES ledgers(id);--> statement-breakpoint
ALTER TABLE credit_cards ADD `ledger_id` integer REFERENCES ledgers(id);--> statement-breakpoint
ALTER TABLE stocks ADD `ledger_id` integer REFERENCES ledgers(id);--> statement-breakpoint
ALTER TABLE transactions ADD `ledger_id` integer REFERENCES ledgers(id);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/
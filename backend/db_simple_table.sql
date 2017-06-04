/*
project database for db_one_table.js

The definitions can be loaded by running the command:
  psql my_database_name
At the psql prompt you then type:
  \i trader.sql
Ignore any errors from the DROP commands
(these commands a just removing tables from your database if you have previously set up the database).

You can use:
  pg_dump -f filename database
to save the data and definition of a database in this format. If you want to make complex changes to
the database you may find it easiest to edit the definitions below and reload this file.
*/


--------------------------------------------------------------------------------------------------
-- First we tidy up earlier versions of the tables if they exist to avoid conflicts.
DROP TABLE project;


--------------------------------------------------------------------------------------------------
-- Next we create the tables for our database.
/*
-- Project table --
Contains the general state of a game. There will be one row for each game in progress.
*/
CREATE TABLE project_table (
    project_id integer,
    project_name varchar(255),
    PRIMARY KEY (project_id)
);

CREATE TABLE columns_0 (
    project_id integer,
    column_id integer,
    column_title varchar(255) not null,
    column_position integer not null,
    PRIMARY KEY (project_id, column_id)
);

CREATE TABLE tickets_0 (
    ticket_id integer,
    column_id integer,
    project_id integer,
    ticket_description varchar(255),
    PRIMARY KEY (project_id, ticket_id)
);

--------------------------------------------------------------------------------------------------
-- Finally we populate the tables with the basic game state information.

-- Set up the star-systems.
INSERT INTO project VALUES(0, 'test name', 0, 'test column name', 0, 0, 'test ticket description');

-- The remaining tables will be populated during the game.
--------------------------------------------------------------------------------------------------




